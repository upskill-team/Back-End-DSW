import {Router} from 'express'
import { findAll, findOne, add, update, remove } from './courseType.controller.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import { CreateCourseTypeSchema, UpdateCourseTypeSchema } from './courseType.schemas.js'
import { authMiddleware } from '../../auth/auth.middleware.js'

export const courseTypeRouter = Router()

courseTypeRouter.use(authMiddleware)

courseTypeRouter.get('/', findAll)
courseTypeRouter.get('/:id', findOne)
courseTypeRouter.post('/', validationMiddleware(CreateCourseTypeSchema), add)
courseTypeRouter.put('/:id', validationMiddleware(UpdateCourseTypeSchema), update)
courseTypeRouter.patch('/:id', validationMiddleware(UpdateCourseTypeSchema), update)
courseTypeRouter.delete('/:id', remove)

