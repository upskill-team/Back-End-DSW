import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  remove,
} from './student.controller.js';

import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';

import { UpdateStudentSchema } from './student.schemas.js';
import { UserRole } from '../user/user.entity.js';

export const studentRouter = Router();

studentRouter.use(authMiddleware);

const adminOnly = roleAuthMiddleware([UserRole.ADMIN]);

studentRouter.get('/', findAll);
studentRouter.get('/:id', findOne);

studentRouter.put('/:id', adminOnly, validationMiddleware(UpdateStudentSchema), update);
studentRouter.patch('/:id', adminOnly, validationMiddleware(UpdateStudentSchema), update);

studentRouter.delete('/:id', adminOnly, remove);
