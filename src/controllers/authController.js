import bcrypt from 'bcrypt';

import createHttpError from 'http-errors';
import { User } from '../models/user.js';

import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';

import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';

import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

// Реєстрація нового користувача
export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  // Перевіряємо, чи користувач з таким email вже існує
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Якщо користувач з таким email вже існує, кидаємо HTTP-помилку 400
    throw createHttpError(400, 'Email in use');
  }

  // Хешуємо пароль перед збереженням у базі даних
  const hashedPassword = await bcrypt.hash(password, 10);

  // Створюємо нового користувача з хешованим паролем
  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  // Створюємо нову сесію для нового користувача
  const newSession = await createSession(newUser._id);

  // Викликаємо, передаємо об'єкт відподвіді та сесію
  setSessionCookies(res, newSession);

  // Відправляємо відповідь з кодом 201 (Created) без тіла, оскільки ми не хочемо повертати дані користувача
  res.status(201).json(newUser);
};

// Авторизація користувача
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  //Перевіряємо, чи користувач з таким email існує
  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  //Порівнюємо введений пароль з хешованим паролем у базі даних
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

  //Видаляємо стару сесію для цього користувача
  await Session.deleteOne({ userId: user._id });

  //Створюємо нову сесію для цього користувача
  const newSession = await createSession(user._id);

  //Викликаємо, передаємо об'єкт відповіді та сесію
  setSessionCookies(res, newSession);

  res.status(200).json(user); // Відправляємо дані користувача без пароля
};

// Вихід користувача (завершення сесії)
export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  // Видаляємо сесію з бази даних, якщо вона існує
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  // Очищаємо cookie, пов'язані з сесією
  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

// Оновлення сесії (отримання нового accessToken за допомогою refreshToken)
export const refreshUserSession = async (req, res) => {
  // Знаходимо поточну сесію за id сесії та рефреш токеном
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  // Якщо сесія не знайдена або рефреш токен не співпадає, кидаємо помилку 401
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  // Якщо сесія існує, перевіряємо валідність рефреш токена
  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  // Якщо термін дії рефреш токена вийшов, повертаємо помилку
  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  // Якщо всі перевіркі пройшли добре, видаляємо поточную сесію
  await Session.deleteOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  // Створюємо нову сесію та додаємо кукі
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({ message: 'Session refreshed' });
};

// Обробка запиту на скидання пароля
export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body; // Отримуємо email з тіла запиту

  // Шукаємо користувача в базі даних за email
  const user = await User.findOne({ email });

  // Якщо користувач не знайдений
  // Повертаємо "успішну" відповідь, щоб не розкривати, чи існує email у системі
  if (!user) {
    return res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  }

  // Якщо користувач знайдений
  // Генеруємо короткоживучий JWT-токен для скидання пароля
  const resetToken = jwt.sign(
    { sub: user._id, email }, // містить мінімально необхідну інформацію: ID користувача та email
    process.env.JWT_SECRET, // секретний ключ для підпису токена
    { expiresIn: '15m' }, // токен дійсний 15 хвилин
  );

  // 1. Формуємо шлях до шаблона
  const templatePath = path.resolve('src/templates/reset-password-email.html');
  // 2. Читаємо шаблон
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  // 3. Готуємо шаблон до заповнення
  const template = handlebars.compile(templateSource);
  // 4. Формуємо із шаблона HTML документ з динамічними даними
  const html = template({
    name: user.username,
    link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
  });

  // Спроба відправки листа з посиланням для скидання пароля
  try {
    await sendEmail({
      from: process.env.SMTP_FROM, // адреса відправника з змінних оточення
      to: email, // адреса отримувача
      subject: 'Reset your password', // тема листа
      html, // HTML вміст листа, згенерований з шаблона
    });
  } catch {
    // Якщо сталася помилка сервісу при відправці листа, повертаємо 500
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }

  // Відправляємо клієнту відповідь про "успішну" відправку листа
  // Техніка однакових відповідей запобігає можливості дізнатись, чи існує email у системі
  res.status(200).json({
    message: 'Password reset email sent successfully',
  });
};

// Обробка запиту на зміну пароля
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  // 1. Перевіряємо/декодуємо токен
  let payload; // Змінна для зберігання даних, отриманих з токена після декодування
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET); // Декодуємо токен за допомогою секретного ключа. Якщо токен недійсний або термін його дії вийшов, буде кинута помилка
  } catch {
    // Повертаємо помилку якщо проблема при декодуванні
    throw createHttpError(401, 'Invalid or expired token');
  }

  // 2. Шукаємо користувача
  const user = await User.findOne({ _id: payload.sub, email: payload.email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  // 3. Якщо користувач існує
  // створюємо новий пароль і оновлюємо користувача
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });

  // 4. Видаляємо всі можливі попередні сесії користувача
  await Session.deleteMany({ userId: user._id });

  // 5. Повертаємо успішну відповідь
  res.status(200).json({
    message: 'Password reset successfully',
  });
};
