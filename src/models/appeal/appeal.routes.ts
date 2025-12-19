/**
 * @module Models/Appeal/Routes
 * @remarks Defines the API routes for the Appeal module.
 * Routes handle CRUD operations for professor appeals and provide role-based access control.
 */

import {Router} from 'express'
import { findAll, findOne, add, update, remove, findMyAppeals } from "./appeal.controller.js"
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import { CreateAppealSchema, UpdateAppealSchema } from './appeal.schemas.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { uploadCvToCloudinary } from '../../shared/middlewares/file-upload.middleware.js'
import { UserRole } from '../user/user.entity.js'

export const appealRouter = Router()

appealRouter.use(authMiddleware)

const studentOnly = roleAuthMiddleware([UserRole.STUDENT])
const adminOnly = roleAuthMiddleware([UserRole.ADMIN])

appealRouter.get('/me', authMiddleware, findMyAppeals) 

appealRouter.get('/', adminOnly, findAll)
appealRouter.get('/:id', adminOnly, findOne)

appealRouter.post('/', studentOnly, uploadCvToCloudinary.single('document'), validationMiddleware(CreateAppealSchema), add)

appealRouter.put('/:id', adminOnly, validationMiddleware(UpdateAppealSchema), update)
appealRouter.patch('/:id', adminOnly, validationMiddleware(UpdateAppealSchema), update)

appealRouter.delete('/:id', adminOnly, remove)