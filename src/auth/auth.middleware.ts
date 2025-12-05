/**
 * @module Auth/Middleware
 * @remarks Provides middleware for user authentication and authorization.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpResponse } from '../shared/response/http.response.js';
import { UserRole } from '../models/user/user.entity.js';

/**
 * Middleware to verify user authentication via JWT.
 * It extracts the token from the 'Authorization' header, validates it, and if valid,
 * attaches the decoded payload (user id and role) to the `req` object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
// Middleware to check if the user is authenticated using JWT
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add user info to request if token is valid
  const authReq = req as Request & { user?: { id: string; role: string } };

  // Get the authorization header
  const authHeader = authReq.headers['authorization'];

  // Check if the header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return HttpResponse.Unauthorized(
      res,
      'Token de autorización no proporcionado o con formato incorrecto.'
    );
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1];

  if (!token || token === 'undefined' || token.length < 10) {
      return HttpResponse.Unauthorized(res, 'Token inválido.');
  }
  
  const JWT_SECRET = process.env.JWT_SECRET!;

  try {
    // Verify the token and get user data
    const decodedPayload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: UserRole;
    };
    // Attach user info to request
    authReq.user = decodedPayload;
    next();
  } catch {
    // If token is invalid or expired, block access
    return HttpResponse.Unauthorized(res, 'Token inválido o expirado.');
  }
};

/**
 * Factory middleware for role-based authorization.
 * Creates a middleware that checks if the authenticated user's role
 * is included in the list of allowed roles.
 * @param {UserRole[]} allowedRoles - An array of roles that are allowed to access the route.
 * @returns An Express middleware function.
 */
export const roleAuthMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }

    console.log(userRole && allowedRoles.includes(userRole));
    console.log(userRole, allowedRoles);
    return HttpResponse.Unauthorized(
      res,
      'No tienes permiso para realizar esta acción.'
    );
  };
};