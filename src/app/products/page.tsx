"use client";

import {useEffect, useState} from "react";
import { supabaseClient } from '../../../utils/supabase/client';

interface Product {
    ID: string;              // Из данных видно, что это строка, а не число
    Handle: string;
    Title: string;
    "Body (HTML)": string;   // Имя поля с пробелами нужно заключать в кавычки
    Vendor: string;
    "Product Category": string;
    Tags: string | null;     // В данных это null
    Published: string;       // В данных это строка "TRUE"
    "Size Name": string;
    "Size Value": string;
    "Variant SKU": string | null;
    "Variant Price": number;
    "Image Src": string;
    "Image Position": number;
    "Image Alt Text": string;
    "Product rating count (product.metafields.reviews.rating_count)": null;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    console.log(products)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error: supabaseError } = await supabaseClient
                    .from('table_product')
                    .select('*');

                if (supabaseError) {
                    setError(new Error(`Ошибка при получении данных: ${supabaseError.message}`));
                } else {
                    setProducts(data || []);
                }
            } catch (err) {
                console.error('Неожиданная ошибка:', err);
                setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts().catch(err => {
            // Это позволит перехватить ошибки, которые могли не быть обработаны в try/catch
            console.error('Необработанная ошибка при загрузке продуктов:', err);
            setError(err instanceof Error ? err : new Error('Непредвиденная ошибка'));
            setLoading(false);
        });

    }, []);

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error.message}</p>;


    return (
        <div className="container mx-auto px-10">
            <h1 className="text-2xl font-bold my-4">Мои товары</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map((product, index) => (
                    <div
                        key={product.ID || `product-${index}`}
                    >
                        {product["Image Src"] && (
                            <img
                                src={product["Image Src"]}
                                alt={product["Image Alt Text"] || product.Title}
                                className="w-full h-48 object-scale-down rounded mb-3"
                            />
                        )}
                        <h3 className="text-lg font-semibold">{product.Title}</h3>
                        <p className="font-bold text-lg text-blue-600">{product["Variant Price"]} UAH</p>
                        {product.Vendor && <p className="text-sm text-gray-600">Производитель: {product.Vendor}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}