import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post('/auth/register', celebrate(registerUserSchema), registerUser); // Реєстрація нового користувача з валідацією даних
router.post('/auth/login', celebrate(loginUserSchema), loginUser); // Авторизація користувача з валідацією даних
router.post('/auth/logout', logoutUser); // Вихід користувача (завершення сесії)
router.post('/auth/refresh', refreshUserSession); // Оновлення сесії користувача (отримання нового токена)
router.post(
  '/auth/request-reset-email',
  celebrate(requestResetEmailSchema),
  requestResetEmail,
); // Запит на відправку листа для скидання пароля з валідацією даних
router.post(
  '/auth/reset-password',
  celebrate(resetPasswordSchema),
  resetPassword,
); // Зміна пароля з валідацією даних

export default router;
