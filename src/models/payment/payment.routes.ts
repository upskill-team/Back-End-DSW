/**
 * @module Models/Payment/Routes
 * @remarks Defines the API routes for the Payment module.
 */
import { Router } from 'express';
import { createPreference, receiveWebhook } from './payment.controller.js';
import { authMiddleware } from '../../auth/auth.middleware.js';

export const paymentRouter = Router();

//Creates a new Mercado Pago payment preference. Requires authentication.
paymentRouter.post('/create-preference', authMiddleware, createPreference);

//Receives webhook notifications from Mercado Pago to process payment updates.
paymentRouter.post('/webhook', receiveWebhook);