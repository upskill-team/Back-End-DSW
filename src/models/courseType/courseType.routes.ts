/**
 * @module Models/CourseType/Routes
 * @remarks Defines the API routes for the CourseType module.
 */

import {Router} from 'express'
import { findAll, findOne, add, update, remove } from './courseType.controller.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import { CreateCourseTypeSchema, UpdateCourseTypeSchema } from './courseType.schemas.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { UserRole } from '../user/user.entity.js'

export const courseTypeRouter = Router()

courseTypeRouter.get('/', findAll)

courseTypeRouter.use(authMiddleware)

const adminOnly = roleAuthMiddleware([UserRole.ADMIN])

courseTypeRouter.get('/:id', findOne)
courseTypeRouter.post('/', adminOnly,validationMiddleware(CreateCourseTypeSchema), add)
courseTypeRouter.put('/:id', adminOnly, validationMiddleware(UpdateCourseTypeSchema), update)
courseTypeRouter.patch('/:id', adminOnly, validationMiddleware(UpdateCourseTypeSchema), update)
courseTypeRouter.delete('/:id', adminOnly, remove)

