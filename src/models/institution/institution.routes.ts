/**
 * @module models/institution
 * Defines the API routes for the institution module.
 * It maps HTTP endpoints to controller functions, applies authentication middleware to all routes,
 * and uses validation middleware for create/update operations.
 * @see {@link InstitutionController}
 * @see {@link InstitutionSchemas}
 * @see {@link authMiddleware}
 */
import { Router } from 'express'
import {
  add,
  findAll,
  findOne,
  remove,
  update,
} from './institution.controller.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import {
  CreateInstitutionSchema,
  UpdateInstitutionSchema,
} from './institution.schemas.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { UserRole } from '../user/user.entity.js'

export const institutionRouter = Router()

// Apply the authentication middleware to all routes within this module.
// This ensures that only authenticated users can access these endpoints.
institutionRouter.use(authMiddleware)

const adminOnly = roleAuthMiddleware([UserRole.ADMIN])

institutionRouter.get('/', findAll)
institutionRouter.get('/:id', findOne)

institutionRouter.post('/', adminOnly, validationMiddleware(CreateInstitutionSchema), add)
institutionRouter.put(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
)
institutionRouter.patch(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
)

institutionRouter.delete('/:id', adminOnly, remove)
