// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino-http';

import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(
  pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat:
          '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
        hideObject: true,
      },
    },
  }),
);

// Логирование времени
app.use((req, res, next) => {
  console.log(`Time: ${new Date().toLocaleString()}`);
  next();
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, World!' });
});

// Маршрут для тестирования middleware ошибки
app.get('/test-error', (req, res) => {
  // Искусственная ошибка для примера
  throw new Error('Something went wrong');
});

// Middleware 404 (после всех маршрутов)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  console.error(err);

  const isProd = process.env.NODE_ENV === 'production';

  res.status(500).json({
    message: isProd
      ? 'Something went wrong. Please try again later.'
      : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
