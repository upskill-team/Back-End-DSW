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
import { authMiddleware } from '../../auth/auth.middleware.js'

export const institutionRouter = Router()

// Apply the authentication middleware to all routes within this module.
// This ensures that only authenticated users can access these endpoints.
institutionRouter.use(authMiddleware)

institutionRouter.get('/', findAll)
institutionRouter.get('/:id', findOne)

institutionRouter.post('/', validationMiddleware(CreateInstitutionSchema), add)
institutionRouter.put(
  '/:id',
  validationMiddleware(UpdateInstitutionSchema),
  update
)
institutionRouter.patch(
  '/:id',
  validationMiddleware(UpdateInstitutionSchema),
  update
)

institutionRouter.delete('/:id', remove)
