/**
 * @module ErrorMiddleware
 * @description Provides a global error handling middleware for the Express application.
 */
import { Request, Response, NextFunction } from 'express';
import { HttpResponse } from '../response/http.response.js';

/**
 * Global error handler for the application.
 * This middleware catches any errors that occur in the route handlers
 * and sends a standardized 500 Internal Server Error response.
 * @param {Error} err - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} _next - The next middleware function. Required for Express to identify this as an error handler, but unused in this implementation.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(`Error: ${err.message}\nStack: ${err.stack}`);
  // In a real production app, you might have more sophisticated logic here
  // to handle different types of errors (e.g., validation errors, not found errors).
  return HttpResponse.InternalServerError(res, err.message);
};
