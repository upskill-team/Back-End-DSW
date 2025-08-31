import {Router} from 'express'
import { findAll, findOne, add, update, remove } from "./appeal.controller.js"
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import { CreateAppealSchema, UpdateAppealSchema } from './appeal.schemas.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { uploadCvToCloudinary } from '../../shared/middlewares/file-upload.middleware.js'
import { UserRole } from '../user/user.entity.js'

export const appealRouter = Router()

appealRouter.use(authMiddleware)

const studentOnly = roleAuthMiddleware([UserRole.STUDENT])
const adminOnly = roleAuthMiddleware([UserRole.ADMIN])

appealRouter.get('/', adminOnly, findAll)
appealRouter.get('/:id', adminOnly, findOne)

appealRouter.post('/', studentOnly, uploadCvToCloudinary.single('document'), validationMiddleware(CreateAppealSchema), add)

appealRouter.put('/:id', adminOnly, validationMiddleware(UpdateAppealSchema), update)
appealRouter.patch('/:id', adminOnly, validationMiddleware(UpdateAppealSchema), update)

appealRouter.delete('/:id', adminOnly, remove)
