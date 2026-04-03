import bcrypt from 'bcrypt';

import createHttpError from 'http-errors';
import { User } from '../models/user.js';

import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';

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
