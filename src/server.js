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
