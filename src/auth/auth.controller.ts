import { Request, Response } from 'express'
import { AuthService } from './auth.service.js'
import { orm } from '../shared/db/orm.js'
import { HttpResponse } from '../shared/response/http.response.js'

// Registers a new user
async function register(req: Request, res: Response) {
  const authService = new AuthService(orm.em.fork())
  const user = await authService.register(req.body)
  return HttpResponse.Created(res, user)
}

// Logs in a user
async function login(req: Request, res: Response) {
  const authService = new AuthService(orm.em.fork())
  const result = await authService.login(req.body)
  return HttpResponse.Ok(res, result)
}

// Gets the profile of the logged-in user
async function getProfile(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: string } }).user?.id
  if (!userId) {
    return HttpResponse.Unauthorized(
      res,
      'No se pudo verificar la identidad del usuario.'
    )
  }

  const authService = new AuthService(orm.em.fork())
  const userProfile = await authService.getProfile(userId)

  if (!userProfile) {
    return HttpResponse.NotFound(res, 'Perfil de usuario no encontrado.')
  }

  return HttpResponse.Ok(res, userProfile)
}

async function forgotPassword(req: Request, res: Response) {
  const { mail } = req.body
  if (!mail) {
    return HttpResponse.BadRequest(res, 'El correo electrónico es requerido.')
  }
  const authService = new AuthService(orm.em.fork())
  await authService.forgotPassword(mail)
  return HttpResponse.Ok(res, {
    message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.',
  })
}

async function resetPassword(req: Request, res: Response) {
  const { token, password_plaintext } = req.body
  if (!token || !password_plaintext) {
    return HttpResponse.BadRequest(res, 'El token y la nueva contraseña son requeridos.')
  }
  const authService = new AuthService(orm.em.fork())
  await authService.resetPassword(token, password_plaintext)
  return HttpResponse.Ok(res, { message: 'Contraseña actualizada correctamente.' })
}

export { register, login, getProfile, forgotPassword, resetPassword }
