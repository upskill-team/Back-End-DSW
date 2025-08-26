import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './course.controller.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
} from './course.schemas.js';
import { authMiddleware } from '../../auth/auth.middleware.js';

export const courseRouter = Router();

courseRouter.use(authMiddleware);

courseRouter.get('/', findAll);
courseRouter.get('/:id', findOne);
courseRouter.delete('/:id', remove);
courseRouter.post('/', validationMiddleware(CreateCourseSchema), add);
courseRouter.put('/:id', validationMiddleware(UpdateCourseSchema), update);
courseRouter.patch('/:id', validationMiddleware(UpdateCourseSchema), update);
