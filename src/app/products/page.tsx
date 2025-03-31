"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from '../../../utils/supabase/client';

interface Product {
    ID: string;
    Handle: string;
    Title: string;
    "Body (HTML)": string;
    Vendor: string;
    "Product Category": string;
    Tags: string | null;
    Published: string;
    "Size Name": string;
    "Size Value": string;
    "Variant SKU": string | null;
    "Variant Price": number;
    "Image Src": string;
    "Image Position": number;
    "Image Alt Text": string;
    "Product rating count (product.metafields.reviews.rating_count)": null;
}

// Интерфейс для сгруппированных продуктов
interface GroupedProduct {
    Title: string;
    Handle: string;
    Vendor: string;
    "Variant Price": number | null; // Может быть null если цена не найдена
    images: {
        src: string;
        alt: string;
        position: number;
    }[];
}

export default function Products() {
    const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error: supabaseError } = await supabaseClient
                    .from('table_product')
                    .select('*');

                if (supabaseError) {
                    setError(new Error(`Ошибка при получении данных: ${supabaseError.message}`));
                    return;
                }

                // Группировка продуктов по Handle
                const productsMap = new Map<string, GroupedProduct>();

                (data || []).forEach((product: Product) => {
                    const handle = product.Handle;

                    if (!productsMap.has(handle)) {
                        // При создании новой записи используем Title только если он не NULL
                        const title = product.Title || handle;

                        // Создаем новую запись для этого handle
                        productsMap.set(handle, {
                            Title: title,
                            Handle: handle,
                            Vendor: product.Vendor || "",
                            "Variant Price": product["Variant Price"] || null,
                            images: []
                        });
                    } else {
                        const currentProduct = productsMap.get(handle)!;

                        // Обновляем Title если текущий Title - это handle или NULL
                        if (product.Title && (currentProduct.Title === handle || !currentProduct.Title)) {
                            currentProduct.Title = product.Title;
                        }

                        // Обновляем цену если текущая цена - NULL, а у этой записи есть цена
                        if (product["Variant Price"] && !currentProduct["Variant Price"]) {
                            currentProduct["Variant Price"] = product["Variant Price"];
                        }

                        // Обновляем vendor если текущий vendor пустой
                        if (product.Vendor && !currentProduct.Vendor) {
                            currentProduct.Vendor = product.Vendor;
                        }
                    }

                    // Добавляем изображение в массив изображений продукта
                    if (product["Image Src"]) {
                        const groupedProduct = productsMap.get(handle)!;
                        groupedProduct.images.push({
                            src: product["Image Src"],
                            alt: product["Image Alt Text"] || product.Title || handle,
                            position: product["Image Position"]
                        });
                    }
                });

                // Второй проход для дополнительной обработки
                // Находим записи, где не удалось установить цену, и ищем цену среди всех товаров с тем же Handle
                (data || []).forEach((product: Product) => {
                    const handle = product.Handle;
                    const groupedProduct = productsMap.get(handle);

                    if (groupedProduct && !groupedProduct["Variant Price"] && product["Variant Price"]) {
                        groupedProduct["Variant Price"] = product["Variant Price"];
                    }
                });

                // Сортируем изображения по позиции для каждого продукта
                productsMap.forEach(product => {
                    product.images.sort((a, b) => a.position - b.position);
                });

                // Преобразуем Map в массив для использования в состоянии
                setGroupedProducts(Array.from(productsMap.values()));

                // Инициализация индексов активных изображений
                const initialActiveImageIndices: Record<string, number> = {};
                Array.from(productsMap.keys()).forEach(handle => {
                    initialActiveImageIndices[handle] = 0;
                });
                setActiveImageIndex(initialActiveImageIndices);

            } catch (err) {
                console.error('Неожиданная ошибка:', err);
                setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts().catch(err => {
            console.error('Необработанная ошибка при загрузке продуктов:', err);
            setError(err instanceof Error ? err : new Error('Непредвиденная ошибка'));
            setLoading(false);
        });

    }, []);

    // Fn change active img
    const changeActiveImage = (handle: string, index: number) => {
        setActiveImageIndex(prev => ({
            ...prev,
            [handle]: index
        }));
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error.message}</p>;

    return (
        <div className="container mx-auto px-10">
            <h1 className="text-2xl font-bold my-4">Мои товары</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {groupedProducts.map((product) => (
                    <div key={product.Handle} >
                        {product.images.length > 0 && (
                            <div className="relative">
                                <img
                                    src={product.images[activeImageIndex[product.Handle]].src}
                                    alt={product.images[activeImageIndex[product.Handle]].alt}
                                    className="w-full h-48 object-contain rounded mb-3"
                                />

                                {/* Показываем точки для переключения изображений, если их больше одного */}
                                {product.images.length > 1 && (
                                    <div className="flex justify-center mt-2 space-x-2">
                                        {product.images.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`w-3 h-3 rounded-full transition-colors ${
                                                    activeImageIndex[product.Handle] === index
                                                        ? 'bg-blue-600'
                                                        : 'bg-gray-300'
                                                }`}
                                                onClick={() => changeActiveImage(product.Handle, index)}
                                                aria-label={`Изображение ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <h3 className="text-lg font-semibold mt-2">{product.Title}</h3>
                        {product["Variant Price"] ? (
                            <p className="font-bold text-lg text-blue-600">{product["Variant Price"]} UAH</p>
                        ) : (
                            <p className="text-sm text-gray-400">Цена не указана</p>
                        )}
                        {product.Vendor && <p className="text-sm text-gray-600">Производитель: {product.Vendor}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}