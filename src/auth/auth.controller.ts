/**
 * @module Auth/Controller
 * @remarks Handles HTTP requests for user authentication.
 * @see {@link AuthService}
 */

import { NextFunction, Request, Response } from 'express'
import { AuthService } from './auth.service.js'
import { orm } from '../shared/db/orm.js'
import { HttpResponse } from '../shared/response/http.response.js'

/**
 * @function register
 * @remarks Registers a new user.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<Response>}
 */
// Registers a new user
async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const authService = new AuthService(orm.em.fork(), req.log)
    const user = await authService.register(req.body)
    return HttpResponse.Created(res, user)
  } catch (error: any) {
    // Pass any error to the global error handler.
    return next(error)
  }
}

/**
 * @function login
 * @remarks Logs in an existing user.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<Response>}
 */
// Logs in a user
async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const authService = new AuthService(orm.em.fork(), req.log)
    const result = await authService.login(req.body)
    return HttpResponse.Ok(res, result)
  } catch (error: any) {
    // Handle expected authentication errors specifically.
    if (error.message === 'Credenciales inválidas.') {
      return HttpResponse.Unauthorized(res, error.message)
    }
    // Delegate all other errors (e.g., database connection issues).
    return next(error)
  }
}

/**
 * @function forgotPassword
 * @remarks Initiates the password recovery process.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<Response>}
 */
async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { mail } = req.body
    if (!mail) {
      return HttpResponse.BadRequest(res, 'El correo electrónico es requerido.')
    }
    const authService = new AuthService(orm.em.fork(), req.log);
    await authService.forgotPassword(mail)
    return HttpResponse.Ok(res, { message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.' })
  } catch (error: any) {
    return next(error)
  }
}

/**
 * @function resetPassword
 * @remarks Resets the user's password using a token.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<Response>}
 */
async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password_plaintext } = req.body;
    if (!token || !password_plaintext) {
      return HttpResponse.BadRequest(res, 'El token y la nueva contraseña son requeridos.')
    }
    const authService = new AuthService(orm.em.fork(), req.log);
    await authService.resetPassword(token, password_plaintext);
    return HttpResponse.Ok(res, { message: 'Contraseña actualizada correctamente.' });
  } catch (error: any) {
    // Errors like "invalid token" are expected business logic failures.
    // We can handle them as a BadRequest or pass to the global handler.
    // For consistency with other services, we can let the global handler manage it.
    return next(error)
  }
}

export { register, login, forgotPassword, resetPassword }
