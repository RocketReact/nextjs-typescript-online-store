'use client';
import { supabaseClient } from '../../../utils/supabase/client';
import { useEffect, useState } from "react";
import React from 'react'

// Типы данных
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
    "Product rating": string | null;
}

export interface GroupedProduct {
    Title: string;
    Handle: string;
    Vendor: string;
    "Product Category": string;
    "Variant Price": number | null;
    images: {
        src: string;
        alt: string;
        position: number;
    }[];
}

export interface ProductsFiltersInterface {
    category?: string;
    vendor?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface FilterOptionsType {
    categories: string[];
    vendors: string[];
    sizes: string[];
    priceRange: {
        min: number;
        max: number;
    };
}

interface ProductsFiltersProps {
    filters: ProductsFiltersInterface;
    filterOptions: FilterOptionsType;
    onFilterChangeAction: (newFilters: ProductsFiltersInterface) => void;
    onResetAction: () => void;
    totalProducts: number;
    filteredCount: number;
}

// Компонент фильтров
export function ProductsFilters({
                                    filters,
                                    filterOptions,
                                    onFilterChangeAction,
                                    onResetAction,
                                    totalProducts,
                                    filteredCount
                                }: ProductsFiltersProps) {

    // Обработчики изменения фильтров
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChangeAction({ ...filters, category: e.target.value, page: 1 });
    };

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChangeAction({ ...filters, vendor: e.target.value, page: 1 });
    };

    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChangeAction({
            ...filters,
            minPrice: e.target.value ? Number(e.target.value) : undefined,
            page: 1
        });
    };

    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChangeAction({
            ...filters,
            maxPrice: e.target.value ? Number(e.target.value) : undefined,
            page: 1
        });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChangeAction({ ...filters, search: e.target.value, page: 1 });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChangeAction({ ...filters, sort: e.target.value, page: 1 });
    };

    return (
        <>
            {/* Фильтры */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Поиск */}
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Поиск
                        </label>
                        <input
                            type="text"
                            id="search"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Введите название товара"
                            value={filters.search || ''}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Категория */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Категория
                        </label>
                        <select
                            id="category"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={filters.category || ''}
                            onChange={handleCategoryChange}
                        >
                            <option value="">Все категории</option>
                            {filterOptions.categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Производитель */}
                    <div>
                        <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
                            Производитель
                        </label>
                        <select
                            id="vendor"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={filters.vendor || ''}
                            onChange={handleVendorChange}
                        >
                            <option value="">Все производители</option>
                            {filterOptions.vendors.map(vendor => (
                                <option key={vendor} value={vendor}>
                                    {vendor}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Сортировка */}
                    <div>
                        <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                            Сортировка
                        </label>
                        <select
                            id="sort"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={filters.sort || 'ID_desc'}
                            onChange={handleSortChange}
                        >
                            <option value="ID_desc">По умолчанию</option>
                            <option value="price_asc">Цена: по возрастанию</option>
                            <option value="price_desc">Цена: по убыванию</option>
                            <option value="title_asc">Название: А-Я</option>
                            <option value="title_desc">Название: Я-А</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Диапазон цен */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Цена
                        </label>
                        <div className="flex space-x-4">
                            <div className="w-1/2">
                                <input
                                    type="number"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`От ${filterOptions.priceRange.min}`}
                                    value={filters.minPrice || ''}
                                    onChange={handleMinPriceChange}
                                    min={filterOptions.priceRange.min}
                                />
                            </div>
                            <div className="w-1/2">
                                <input
                                    type="number"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`До ${filterOptions.priceRange.max}`}
                                    value={filters.maxPrice || ''}
                                    onChange={handleMaxPriceChange}
                                    max={filterOptions.priceRange.max}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Кнопка сброса */}
                    <div className="flex items-end">
                        <button
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            onClick={onResetAction}
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                </div>
            </div>

            {/* Результаты */}
            <div className="mb-4">
                <p className="text-gray-600">
                    Найдено товаров: {filteredCount} из {totalProducts}
                </p>
            </div>
        </>
    );
}

// Функция для получения данных и применения фильтров
export  function useProductData() {
    const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<GroupedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

    // Состояния для фильтров
    const [filters, setFilters] = useState<ProductsFiltersInterface>({
        category: '',
        vendor: '',
        minPrice: undefined,
        maxPrice: undefined,
        sizes: [],
        search: '',
        sort: 'ID_desc',
        page: 1,
        limit: 60
    });

    // Состояния для опций фильтров
    const [filterOptions, setFilterOptions] = useState<FilterOptionsType>({
        categories: [],
        vendors: [],
        sizes: [],
        priceRange: { min: 0, max: 0 }
    });

    // Функция для изменения активного изображения
    const changeActiveImage = (handle: string, index: number) => {
        setActiveImageIndex(prev => ({
            ...prev,
            [handle]: index
        }));
    };

    // Получение всех товаров при первой загрузке
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
                            "Product Category": product["Product Category"] || "",
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

                        // Обновляем категорию если текущая категория пустая
                        if (product["Product Category"] && !currentProduct["Product Category"]) {
                            currentProduct["Product Category"] = product["Product Category"];
                        }
                    }

                    // Добавляем изображение в массив изображений продукта
                    if (product["Image Src"]) {
                        const groupedProduct = productsMap.get(handle)!;
                        // Проверяем, не дублируется ли изображение
                        const imageExists = groupedProduct.images.some(img => img.src === product["Image Src"]);
                        if (!imageExists) {
                            groupedProduct.images.push({
                                src: product["Image Src"],
                                alt: product["Image Alt Text"] || product.Title || handle,
                                position: product["Image Position"]
                            });
                        }
                    }
                });

                // Сортируем изображения по позиции для каждого продукта
                productsMap.forEach(product => {
                    product.images.sort((a, b) => a.position - b.position);
                });

                // Получаем варианты для фильтров
                const categories = new Set<string>();
                const vendors = new Set<string>();
                const sizes = new Set<string>();
                let minPrice = Infinity;
                let maxPrice = 0;

                data.forEach((product: Product) => {
                    if (product["Product Category"]) categories.add(product["Product Category"]);
                    if (product.Vendor) vendors.add(product.Vendor);
                    if (product["Size Value"]) sizes.add(product["Size Value"]);
                    if (product["Variant Price"]) {
                        minPrice = Math.min(minPrice, product["Variant Price"]);
                        maxPrice = Math.max(maxPrice, product["Variant Price"]);
                    }
                });

                setFilterOptions({
                    categories: Array.from(categories),
                    vendors: Array.from(vendors),
                    sizes: Array.from(sizes),
                    priceRange: {
                        min: minPrice === Infinity ? 0 : minPrice,
                        max: maxPrice === 0 ? 1000 : maxPrice
                    }
                });

                const products = Array.from(productsMap.values());

                // Инициализация индексов активных изображений
                const initialActiveImageIndices: Record<string, number> = {};
                Array.from(productsMap.keys()).forEach(handle => {
                    initialActiveImageIndices[handle] = 0;
                });
                setActiveImageIndex(initialActiveImageIndices);

                setGroupedProducts(products);
                setFilteredProducts(products);
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

    // Применение фильтров
    useEffect(() => {
        if (groupedProducts.length === 0) return;

        let filtered = [...groupedProducts];

        // Фильтрация по категории
        if (filters.category) {
            filtered = filtered.filter(product =>
                product["Product Category"] === filters.category
            );
        }

        // Фильтрация по производителю
        if (filters.vendor) {
            filtered = filtered.filter(product =>
                product.Vendor === filters.vendor
            );
        }

        // Фильтрация по цене
        if (filters.minPrice !== undefined) {
            filtered = filtered.filter(product =>
                product["Variant Price"] !== null && product["Variant Price"] >= filters.minPrice!
            );
        }

        if (filters.maxPrice !== undefined) {
            filtered = filtered.filter(product =>
                product["Variant Price"] !== null && product["Variant Price"] <= filters.maxPrice!
            );
        }

        // Поиск по названию
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.Title.toLowerCase().includes(searchLower) ||
                product.Vendor.toLowerCase().includes(searchLower)
            );
        }

        // Сортировка
        if (filters.sort) {
            switch (filters.sort) {
                case 'price_asc':
                    filtered.sort((a, b) => {
                        if (a["Variant Price"] === null) return 1;
                        if (b["Variant Price"] === null) return -1;
                        return a["Variant Price"] - b["Variant Price"];
                    });
                    break;
                case 'price_desc':
                    filtered.sort((a, b) => {
                        if (a["Variant Price"] === null) return 1;
                        if (b["Variant Price"] === null) return -1;
                        return b["Variant Price"] - a["Variant Price"];
                    });
                    break;
                case 'title_asc':
                    filtered.sort((a, b) => a.Title.localeCompare(b.Title));
                    break;
                case 'title_desc':
                    filtered.sort((a, b) => b.Title.localeCompare(a.Title));
                    break;
                default:
                    // По умолчанию без сортировки
                    break;
            }
        }

        // Пагинация (только для демонстрации - на клиенте делать пагинацию не рекомендуется для больших наборов данных)
        const startIndex = (filters.page && filters.limit)
            ? (filters.page - 1) * filters.limit
            : 0;

        const endIndex = (filters.page && filters.limit)
            ? startIndex + filters.limit
            : filtered.length;

        filtered = filtered.slice(startIndex, endIndex);

        setFilteredProducts(filtered);
    }, [filters, groupedProducts]);

    // Обработчик изменения фильтров
    const handleFilterChange = (newFilters: ProductsFiltersInterface) => {
        setFilters(newFilters);
    };

    // Сброс фильтров
    const resetFilters = () => {
        setFilters({
            category: '',
            vendor: '',
            minPrice: undefined,
            maxPrice: undefined,
            sizes: [],
            search: '',
            sort: 'ID_desc',
            page: 1,
            limit: 12
        });
    };

    return {
        loading,
        error,
        groupedProducts,
        filteredProducts,
        activeImageIndex,
        changeActiveImage,
        filters,
        filterOptions,
        handleFilterChange,
        resetFilters
    };
}