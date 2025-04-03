'use client';
import React from 'react'
import Image from "next/image";
import ProductsFilters from "../components/ProductsFilters";
import useProductsRedux from "@/hooks/useProductsRedux";

const AllProducts: React.FC = () => {
    const {
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
    } = useProductsRedux();

    if (loading) return (
        <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="container mx-auto px-10 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Ошибка!</p>
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-5 md:px-10 py-8">
            <h1 className="text-3xl font-bold mb-8">Мои товары</h1>

            {/* Вставляем компонент фильтров */}
            <ProductsFilters
                filters={filters}
                filterOptions={filterOptions}
                onFilterChangeAction={handleFilterChange}
                onResetAction={resetFilters}
                totalProducts={groupedProducts.length}
                filteredCount={filteredProducts.length}
            />

            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.Handle} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                            {product.images.length > 0 ? (
                                <div className="relative">
                                    <div className="relative h-48 w-full mb-3">
                                        <Image
                                            src={product.images[activeImageIndex[product.Handle] || 0].src}
                                            alt={product.images[activeImageIndex[product.Handle] || 0].alt}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                            className="object-contain"
                                            priority={activeImageIndex[product.Handle] === 0}
                                        />
                                    </div>

                                    {/* Показываем точки для переключения изображений, если их больше одного */}
                                    {product.images.length > 1 && (
                                        <div className="flex justify-center mt-2 space-x-2">
                                            {product.images.map((_, index) => (
                                                <button
                                                    key={index}
                                                    className={`w-3 h-3 rounded-full transition-colors ${
                                                        (activeImageIndex[product.Handle] || 0) === index
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
                            ) : (
                                <div className="h-48 w-full flex items-center justify-center bg-gray-100 mb-3">
                                    <span className="text-gray-400">Нет изображения</span>
                                </div>
                            )}

                            <div className="p-4">
                                <h3 className="text-lg font-semibold line-clamp-2 mb-2">{product.Title}</h3>

                                {product["Variant Price"] ? (
                                    <p className="font-bold text-lg text-blue-600 mb-2">
                                        {product["Variant Price"].toLocaleString()} UAH
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 mb-2">Цена не указана</p>
                                )}

                                <div className="flex flex-col space-y-1 text-sm text-gray-600">
                                    {product.Vendor && <p>Производитель: {product.Vendor}</p>}
                                    {product["Product Category"] && <p>Категория: {product["Product Category"]}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg mb-4">По вашему запросу ничего не найдено</p>
                    <button
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={resetFilters}
                    >
                        Сбросить фильтры
                    </button>
                </div>
            )}
        </div>
    );
}
export default AllProducts;