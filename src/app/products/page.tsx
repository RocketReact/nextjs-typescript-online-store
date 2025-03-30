"use client";

import {useEffect, useState} from "react";
import { supabaseClient } from '../../../utils/supabase/client';

interface Product {
    id: number;
    handle: string;
    title: string;
    bodyHtml:string;
    vendor:string;
    productCategory:string;
    tags:string[];
    published:boolean;
    sizeName:string;
    sizeValue:string;
    variantSKU:string;
    variantPrice:number;
    imageSrc:string;
    imagePosition:number;
    imageAltText:string;
    productRating:string;

}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

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
        <div>
            <h1>Мои товары</h1>
            <ul>
                {products.map((product) => (
                    <li key={product.id}>
                        {product.imageSrc && (
                            <img
                                src={product.imageSrc}
                                alt={product.imageAltText || product.title}
                                style={{ width: '100px', height: 'auto', marginRight: '10px' }}
                            />
                        )}
                        {product.title} - ${product.variantPrice} UAH.
                    </li>
                ))}
            </ul>
        </div>
    );
}