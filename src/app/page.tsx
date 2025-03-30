"use client";

import {useEffect, useState} from "react";
import { supabaseClient } from '../../utils/supabase/client';

interface Product {
  id: number;
  name: string;
  price: number;
  // другие поля...
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error: supabaseError } = await supabaseClient
            .from('your_table_name')
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
                {product.name} - {product.price}
              </li>
          ))}
        </ul>
      </div>
  );
}