/**
 * @module ErrorMiddleware
 * @description Provides a global error handling middleware for the Express application.
 */
import { Request, Response, NextFunction } from 'express'
import { HttpResponse } from '../response/http.response.js'
import { logger } from '../utils/logger.js'

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
  // Log the full error object for detailed debugging in production
  logger.error({ err }, 'Unhandled error caught by error handler')
  
  return HttpResponse.InternalServerError(res, err.message) // Maybe we could change it to BadRequest
}
