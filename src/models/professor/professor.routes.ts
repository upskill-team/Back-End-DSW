/**
 * @module Models/Professor/Routes
 * @remarks Defines the API routes for the professor module.
 * All routes are protected by authentication.
 * @see {@link Models/Professor/Controller} for request handlers.
 */
import { Router } from 'express'
import { findAll, findOne, getMe, update, remove, getMyRecentEnrollments, getMyAnalytics } from './professor.controller.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import { UpdateProfessorSchema } from './professor.schema.js'
import { UserRole } from '../user/user.entity.js'

export const professorRouter = Router()

// Apply authentication middleware to all professor routes.

const adminOnly = roleAuthMiddleware([UserRole.ADMIN])
const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR])

professorRouter.get('/', findAll)
professorRouter.get('/me', authMiddleware, professorOnly, getMe)
professorRouter.get('/:id', findOne)
professorRouter.get('/me/recent-enrollments', authMiddleware, professorOnly, getMyRecentEnrollments)
professorRouter.get('/me/analytics', authMiddleware, professorOnly, getMyAnalytics)

// The POST route for direct creation has been removed as it's architecturally incorrect.
// Professor profiles are created via business logic (accepting an Appeal).

professorRouter.put(
  '/:id',
  authMiddleware,
  adminOnly,
  validationMiddleware(UpdateProfessorSchema),
  update
)
professorRouter.patch(
  '/:id',
  authMiddleware,
  adminOnly,
  validationMiddleware(UpdateProfessorSchema),
  update
)
professorRouter.delete('/:id', authMiddleware, adminOnly, remove)