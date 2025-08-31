import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  remove,
} from './student.controller.js';

import { authMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import { UpdateStudentSchema } from './student.schemas.js';


export const studentRouter = Router();

studentRouter.use(authMiddleware);

studentRouter.get('/', findAll);
studentRouter.get('/:id', findOne);

studentRouter.put('/:id', validationMiddleware(UpdateStudentSchema), update);
studentRouter.patch('/:id', validationMiddleware(UpdateStudentSchema), update);

studentRouter.delete('/:id', remove);
