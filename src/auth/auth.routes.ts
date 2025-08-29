import { Router } from 'express';
import { register, login, getProfile, forgotPassword, resetPassword } from './auth.controller.js';
import { authMiddleware } from './auth.middleware.js';
import { validationMiddleware } from '../shared/middlewares/validate.middleware.js';
import { ForgotPasswordSchema, ResetPasswordSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', register); // TODO: Add validation
authRouter.post('/login', login);       // TODO: Add validation
authRouter.get('/profile', authMiddleware, getProfile);

// Routes for password recovery with validation
authRouter.post('/forgot-password', validationMiddleware(ForgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validationMiddleware(ResetPasswordSchema), resetPassword);