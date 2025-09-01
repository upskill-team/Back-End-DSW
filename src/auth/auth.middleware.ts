import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpResponse } from '../shared/response/http.response.js';
import { UserRole } from '../models/user/user.entity.js';

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
 * Middleware to authorize users based on their roles.
 * @param {UserRole[]} allowedRoles - An array of roles that are allowed to access the route.
 * @returns An Express middleware function.
 */
export const roleAuthMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }

    return HttpResponse.Unauthorized(
      res,
      'No tienes permiso para realizar esta acción.'
    );
  };
};