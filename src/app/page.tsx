"use client";

import { createClient } from "../../utils/supabase/client";
import { useEffect, useState } from "react";

interface YourTableType {
  id: number;
  name: string;
  created_at: string;
  // далее поля таблицы...
}

export default function Page() {
  const [data, setData] = useState<YourTableType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from("your_table").select("*");

        if (error) {
          setError(error);
          return;
        }

        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      } finally {
        setIsLoading(false);
      }
    };

    // Добавляем обработку возвращаемого промиса
    fetchData().catch(err => {
      console.error('Ошибка при загрузке данных:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      setIsLoading(false);
    });
  }, [supabase]);

  if (isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error.message}</p>;

  return (
      <div>
        <h1>Данные из Supabase:</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
  );
}