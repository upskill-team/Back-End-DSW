import { Router } from 'express'
import { register, login, getProfile, forgotPassword, resetPassword } from './auth.controller.js'
import { authMiddleware } from './auth.middleware.js'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.get('/profile', authMiddleware, getProfile)
