/**
 * @module Models/Institution/Routes
 * @remarks Defines the API routes for the Institution module.
 */

import { Router } from 'express'
import {
  findAll,
  findAllAdmin,
  findOne,
  createByProfessor,
  remove,
  update,
  removeProfessor,
  getManagedInstitution,
  leaveInstitution,
  updateManagedInstitution,
} from './institution.controller.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import {
  CreateInstitutionSchema,
  UpdateInstitutionSchema,
  UpdateManagedInstitutionSchema,
} from './institution.schemas.js'
import {
  authMiddleware,
  roleAuthMiddleware,
} from '../../auth/auth.middleware.js'
import { UserRole } from '../user/user.entity.js'

export const institutionRouter = Router()

// Apply authentication to all routes
institutionRouter.use(authMiddleware)

const adminOnly = roleAuthMiddleware([UserRole.ADMIN])
const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR])

// Public routes (authenticated users)
institutionRouter.get('/', findAll)
institutionRouter.get('/:id', findOne)

// Professor routes
// Get institution managed by the current professor
institutionRouter.get('/managed/me', professorOnly, getManagedInstitution)

// Create a new institution (professor becomes manager)
institutionRouter.post(
  '/',
  professorOnly,
  validationMiddleware(CreateInstitutionSchema),
  createByProfessor
)

// Update institution managed by the current professor
institutionRouter.patch(
  '/managed/me',
  professorOnly,
  validationMiddleware(UpdateManagedInstitutionSchema),
  updateManagedInstitution
)

// Leave an institution (professor can't be manager)
institutionRouter.delete(
  '/:institutionId/leave',
  professorOnly,
  leaveInstitution
)

institutionRouter.delete(
  '/:id/professors/:professorId',
  professorOnly,
  removeProfessor
)

// Admin routes
institutionRouter.get('/admin/all', adminOnly, findAllAdmin)

institutionRouter.put(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
)

institutionRouter.delete('/:id', adminOnly, remove)