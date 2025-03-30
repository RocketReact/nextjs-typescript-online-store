// scripts/import-images.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid'; // Добавим uuid для генерации уникальных имен

// Захардкодим значения для тестирования (замените на свои)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);
const bucketName = 'image';

// Функция для создания безопасных имен файлов
function generateSafeFileName(originalUrl) {
    // Используем UUID для гарантии уникальности и безопасности имени файла
    const fileExtension = path.extname(originalUrl).split('?')[0]; // Извлекаем расширение, убирая параметры URL
    return `product_${uuidv4()}${fileExtension}`;
}

async function processImages() {
    try {
        // Чтение CSV файла
        const csvPath = path.join(process.cwd(), 'data', 'products_with_supabase_images.csv');
        const csvData = await fs.readFile(csvPath, 'utf8');

        console.log("Парсинг CSV файла...");

        // Парсинг CSV
        const { data: products } = Papa.parse(csvData, { header: true });

        console.log(`Загружено ${products.length} товаров из CSV`);

        const updatedProducts = [];

        // Обработка изображений для каждого продукта
        for (const product of products) {
            console.log(`Обработка товара: ${product.Title || product.Handle || 'Без названия'}`);

            if (product['Image Src']) {
                try {
                    // Скачивание изображения
                    console.log(`  - Скачивание изображения: ${product['Image Src']}`);
                    const response = await fetch(product['Image Src']);
                    if (!response.ok) {
                        throw new Error(`Не удалось скачать изображение: ${response.status}`);
                    }

                    // Подготовка безопасного имени файла
                    const buffer = await response.arrayBuffer();
                    const fileName = generateSafeFileName(product['Image Src']);

                    // Загрузка в Supabase Storage
                    const { error } = await supabase.storage
                        .from(bucketName)
                        .upload(fileName, buffer, {
                            contentType: response.headers.get('content-type') || 'image/jpeg',
                            upsert: true
                        });

                    if (error) {
                        console.error(`  - Ошибка загрузки в Supabase: ${error.message}`);
                        throw error;
                    }

                    // Получение публичного URL
                    const { data: publicUrlData } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(fileName);

                    // Обновление URL в объекте продукта
                    product['Image Src'] = publicUrlData.publicUrl;
                    console.log(`  - Изображение загружено: ${publicUrlData.publicUrl}`);
                } catch (error) {
                    console.error(`  - Ошибка обработки изображения для продукта ${product.Handle}:`, error);
                }
            } else {
                console.log(`  - Нет изображения для этого товара`);
            }

            updatedProducts.push(product);
        }

        // Создаем папку data, если она не существует
        try {
            await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
        } catch (err) {
            // Игнорируем ошибку, если папка уже существует
        }

        // Сохранение обновленного CSV
        const outputPath = path.join(process.cwd(), 'data', 'products_with_supabase_images.csv');
        const updatedCsv = Papa.unparse(updatedProducts);
        await fs.writeFile(outputPath, updatedCsv, 'utf8');

        console.log(`\nОбработка завершена! Обновленный CSV сохранен в: ${outputPath}`);
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
}

processImages();