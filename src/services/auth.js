import crypto from 'crypto';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';
import { Session } from '../models/session.js';

export const createSession = async (userId) => {
  //Створюємо access token (короткотерміновий токен для авторизації)
  const accessToken = crypto.randomBytes(30).toString('base64');
  //Створюємо refresh token (довготерміновий токен для оновлення сесії)
  const refreshToken = crypto.randomBytes(30).toString('base64');

  //Зберігаємо сесію в базі даних з відповідними термінами дії токенів
  return Session.create({
    userId, // Ідентифікатор користувача, для якого створюється сесія
    accessToken, // Згенерований access token
    refreshToken, // Згенерований refresh token
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES), // Встановлюємо термін дії access token на 15 хвилин
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY), // Встановлюємо термін дії refresh token на 1 день
  });
};

// Функція для встановлення сесійних cookie в відповіді сервера
export const setSessionCookies = (res, session) => {
  res.cookie('accessToken', session.accessToken, {
    httpOnly: true, // Доступ до cookie лише через HTTP (не доступно для JavaScript на клієнті)
    secure: true, // Відправляти cookie лише через HTTPS
    sameSite: 'none', // Дозволяє відправляти cookie в крос-доменних запитах (необхідно для роботи з різними доменами)
    maxAge: FIFTEEN_MINUTES, // Встановлюємо час життя cookie на 15 хвилин (відповідно до терміну дії access token)
  });

  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });
};
