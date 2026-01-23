/**
 * @module Auth/Controller
 * @remarks Handles HTTP requests for user authentication (Login, Refresh, Logout).
 */
import { NextFunction, Request, Response } from 'express'
import { AuthService } from './auth.service.js'
import { orm } from '../shared/db/orm.js'
import { HttpResponse } from '../shared/response/http.response.js'

/**
 * Helper to set the Refresh Token as an HttpOnly cookie.
 */
const setRefreshTokenCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    path: '/',
    secure: isProduction, 
    sameSite: isProduction ? 'none' as const : 'lax' as const, 
  };
  
  res.cookie('refreshToken', token, cookieOptions);
};

// Registers a new user
async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const authService = new AuthService(orm.em.fork(), req.log)
    const user = await authService.register(req.body)
    return HttpResponse.Created(res, user)
  } catch (error: any) {
    return next(error)
  }
}

// Logs in a user and sets refresh cookie
async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const authService = new AuthService(orm.em.fork(), req.log)
    
    const { mail, password_plaintext, rememberMe } = req.body;

    const { accessToken, refreshToken } = await authService.login({
        mail,
        password_plaintext,
        rememberMe: !!rememberMe
    })
    
    if (refreshToken) {
        setRefreshTokenCookie(res, refreshToken);
    } else {
        res.clearCookie('refreshToken');
    }

    // Send Access Token in Body
    return HttpResponse.Ok(res, { token: accessToken })
  } catch (error: any) {
    if (error.message === 'Credenciales inválidas.') {
      return HttpResponse.Unauthorized(res, error.message)
    }
    return next(error)
  }
}

// Refreshes the Access Token using the cookie
async function refresh(req: Request, res: Response, _next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return HttpResponse.Unauthorized(res, 'No refresh token provided');
    }

    const authService = new AuthService(orm.em.fork(), req.log);
    
    const tokens = await authService.refreshToken(refreshToken);

    setRefreshTokenCookie(res, tokens.refreshToken);

    return HttpResponse.Ok(res, { token: tokens.accessToken });
  } catch (error: any) {
    req.log.warn({ msg: error.message }, 'Refresh token failed');
    res.clearCookie('refreshToken');
    return HttpResponse.Unauthorized(res, 'Session expired or invalid');
  }
}

// Logs out the user (revokes token and clears cookie)
async function logout(req: Request, res: Response, _next: NextFunction) {
  try {
    const refreshToken = req.cookies.refreshToken;
    const authService = new AuthService(orm.em.fork(), req.log);
    
    await authService.logout(refreshToken);
    
    res.clearCookie('refreshToken');
    return HttpResponse.Ok(res, { message: 'Logged out successfully' });
  } catch {
    res.clearCookie('refreshToken');
    return HttpResponse.Ok(res, { message: 'Logged out' });
  }
}

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
    return next(error)
  }
}

export { register, login, refresh, logout, forgotPassword, resetPassword }