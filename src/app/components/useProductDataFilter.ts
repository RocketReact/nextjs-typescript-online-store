import {useEffect, useState} from "react";
import {supabaseClient} from "../../../utils/supabase/client";

export  function useProductDataFilter() {
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