// src/server.js
import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import { errors } from 'celebrate';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express(); // ця middleware "вчить" Express розуміти JSON у тілі запиту

const PORT = process.env.PORT ?? 3000;

// Глобальні middleware
app.use(logger); // 1. Щоб бачити усі запити які надійшли на сервер
app.use(express.json()); // 2. Парсинг JSON-тіла
app.use(cors()); // 3. Дозвіл для запитів з інших доменів

app.use(cookieParser()); // 4. Парсинг cookie з запиту

app.use(authRoutes); // 5. Роутер для авторизації та реєстрації
app.use(notesRoutes); // 6. Роутер для нотаток
app.use(userRoutes); // 7. Роутер для користувачів

// 404 — якщо маршрут не знайдено
app.use(notFoundHandler);

// Celebrate — якщо валідація не пройшла
app.use(errors());

// Error — якщо під час запиту виникла помилка
app.use(errorHandler);

// Підключення до MongoDB та запуск сервера
await connectMongoDB();

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
