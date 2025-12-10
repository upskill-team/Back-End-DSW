/**
 * @module Shared/Config/Security
 * @remarks Centralizes security configurations for the application, including CORS policies
 * and Rate Limiting rules.
 */

import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * List of allowed origins for CORS requests.
 * Includes local development URLs and dynamic environment variables.
 */
export const corsWhitelist = [
  'http://localhost:5173',
  'https://localhost:5173',
  process.env.NGROK_FRONTEND_URL,
];

/**
 * Configuration options for Cross-Origin Resource Sharing (CORS).
 * Validates the request origin against the whitelist.
 */
export const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || corsWhitelist.includes(origin)) {
      callback(null, true);
    } else {
      logger.error({ origin }, 'CORS error: origin not allowed');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Required for cookies to work
};

/**
 * Rate limiter for authentication endpoints (Login/Register).
 * Applies stricter limits to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      'Demasiados intentos de inicio de sesión desde esta IP, por favor intente nuevamente en 15 minutos',
  },
});

/**
 * General rate limiter for API endpoints.
 * Protects the application from Denial of Service (DoS) attacks.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      'Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos',
  },
});
