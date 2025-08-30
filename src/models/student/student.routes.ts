import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove,
} from './student.controller.js';

import { authMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import { CreateStudentSchema, UpdateStudentSchema } from './student.schemas.js';


export const studentRouter = Router();

studentRouter.use(authMiddleware);

/**
 * @openapi
 * /api/students:
 *   get:
 *     description: Retrieve a list of all students.
 *     tags:
 *       - Students
 *     responses:
 *       200:
 *        description: A list of students.
 *       content:
 *        application/json:
 *        schema:
 *         type: array
 */
studentRouter.get('/', findAll);
studentRouter.get('/:id', findOne);

studentRouter.post('/', validationMiddleware(CreateStudentSchema), add); //Candidate for removal

studentRouter.put('/:id', validationMiddleware(UpdateStudentSchema), update);
studentRouter.patch('/:id', validationMiddleware(UpdateStudentSchema), update);

studentRouter.delete('/:id', remove);
