/**
 * @module Auth/Routes
 * @remarks Defines the routes for the authentication module.
 * @see {@link AuthController}
 */

import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from './auth.controller.js';
import { validationMiddleware } from '../shared/middlewares/validate.middleware.js';
import { ForgotPasswordSchema, ResetPasswordSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);

// Routes for password recovery with validation
authRouter.post('/forgot-password', validationMiddleware(ForgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validationMiddleware(ResetPasswordSchema), resetPassword);