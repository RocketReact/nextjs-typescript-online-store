import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import path from 'path';
import dotenv from 'dotenv';


// Настройки Supabase
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)
const bucketName = 'image';

async function processImages() {
    try {
        // Чтение CSV файла
        const filePath = path.join(process.cwd(), 'products_export_1.csv');
        const data = await fs.readFile(filePath, 'utf8');
        const parsedData = Papa.parse(data, { header: true });

        // Создаем новый массив для хранения обновленных данных
        const updatedData = [];

        // Обрабатываем каждую строку CSV
        for (const row of parsedData.data) {
            // Обработка изображений только если есть URL
            if (row.ImageSrc) {
                try {
                    // Скачиваем изображение
                    const response = await fetch(row.ImageSrc);
                    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

                    const buffer = await response.arrayBuffer();
                    const fileName = `product_${row.Handle || Date.now()}_${path.basename(row.ImageSrc)}`;

                    // Загружаем изображение в Supabase Storage
                    const { data: uploadData, error } = await supabase.storage
                        .from(bucketName)
                        .upload(fileName, buffer, {
                            contentType: response.headers.get('content-type') || 'image/jpeg',
                            upsert: true
                        });

                    if (error) throw error;

                    // Получаем публичный URL изображения
                    const { data: publicUrlData } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(fileName);

                    // Обновляем URL изображения в строке CSV
                    row.ImageSrc = publicUrlData.publicUrl;

                    console.log(`Обработано изображение: ${row.Title || 'Без названия'}`);
                } catch (imageError) {
                    console.error(`Ошибка при обработке изображения: ${imageError.message}`);
                    // Сохраняем исходный URL, если произошла ошибка
                }
            }

            updatedData.push(row);
        }

        // Сохраняем обновленный CSV
        const updatedCsv = Papa.unparse(updatedData);
        await fs.writeFile('products_with_supabase_images.csv', updatedCsv, 'utf8');

        console.log('Обработка завершена, CSV с обновленными URL сохранен!');
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
}

processImages();