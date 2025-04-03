'use client';
import React from 'react'
import {FilterOptionsType, ProductsFiltersInterface} from "@/store/slices/filterSlice";


interface ProductsFiltersProps {
    filters: ProductsFiltersInterface,
    filterOptions: FilterOptionsType;
    onFilterChangeAction:(newFilters: ProductsFiltersInterface) => void;
    onResetAction:() => void;
    totalProducts: number;
    filteredCount: number;
}


// Компонент фильтров
export default function ProductsFilters ({
                                             filters,
                                             filterOptions,
                                             onFilterChangeAction,
                                             onResetAction,
                                             totalProducts,
                                             filteredCount,

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

