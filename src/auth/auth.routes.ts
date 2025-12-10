/**
 * @module Auth/Routes
 * @remarks Defines the routes for the authentication module.
 */
import { Router } from 'express';
import { register, login, refresh, logout, forgotPassword, resetPassword } from './auth.controller.js';
import { validationMiddleware } from '../shared/middlewares/validate.middleware.js';
import { ForgotPasswordSchema, ResetPasswordSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);

// New Routes for Refresh Token Flow
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);

// Routes for password recovery with validation
authRouter.post('/forgot-password', validationMiddleware(ForgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validationMiddleware(ResetPasswordSchema), resetPassword);