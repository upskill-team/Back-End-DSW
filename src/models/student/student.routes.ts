/**
 * @module Models/Student/Routes
 * @remarks Defines the API routes for the Student module.
 */

import { Router } from 'express';
import {
  findAll,
  findOne,
  countAll,
  update,
  remove,
} from './student.controller.js';

import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';

import { UpdateStudentSchema } from './student.schemas.js';
import { UserRole } from '../user/user.entity.js';

export const studentRouter = Router();

studentRouter.get('/count', countAll)

studentRouter.use(authMiddleware);

const adminOnly = roleAuthMiddleware([UserRole.ADMIN]);

studentRouter.get('/', findAll);
studentRouter.get('/:id', findOne);

studentRouter.put('/:id', adminOnly, validationMiddleware(UpdateStudentSchema), update);
studentRouter.patch('/:id', adminOnly, validationMiddleware(UpdateStudentSchema), update);

studentRouter.delete('/:id', adminOnly, remove);
