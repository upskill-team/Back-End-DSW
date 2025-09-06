/**
 * @module Models/Course/Routes
 * @remarks Defines the API routes for the Course module.
 */

import { Router } from 'express'
import { findAll, findOne, add, update, remove, findMyCourses } from './course.controller.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import {
  CreateCourseSchema,
  UpdateCourseSchema,
} from './course.schemas.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { UserRole } from '../user/user.entity.js'
import { uploadCourseImage } from '../../shared/middlewares/file-upload.middleware.js'

export const courseRouter = Router()

courseRouter.use(authMiddleware)


const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR])
const professorOrAdmin = roleAuthMiddleware([UserRole.PROFESSOR, UserRole.ADMIN])


courseRouter.get('/', findAll)
courseRouter.get('/my-courses', professorOnly, findMyCourses)
courseRouter.get('/:id', findOne)


courseRouter.post('/', professorOnly, uploadCourseImage.single('image'), validationMiddleware(CreateCourseSchema), add)
courseRouter.put('/:id', professorOnly, validationMiddleware(UpdateCourseSchema), update)
courseRouter.patch('/:id', professorOnly,validationMiddleware(UpdateCourseSchema), update)

courseRouter.delete('/:id', professorOrAdmin, remove)
