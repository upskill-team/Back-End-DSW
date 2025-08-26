import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove,
} from './professor.controller.js';
import { authMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import { CreateProfessorSchema, UpdateProfessorSchema } from './professo.schema.js';

export const professorRouter = Router();

professorRouter.use(authMiddleware);

professorRouter.get('/', findAll);
professorRouter.get('/:id', findOne);
// Create and Update routes use validation middleware to ensure data integrity
// Validation middleware checks the request body against the defined schema
professorRouter.post('/', validationMiddleware(CreateProfessorSchema), add);
professorRouter.put('/:id', validationMiddleware(UpdateProfessorSchema), update);
professorRouter.patch('/:id', validationMiddleware(UpdateProfessorSchema), update);
professorRouter.delete('/:id', remove);
