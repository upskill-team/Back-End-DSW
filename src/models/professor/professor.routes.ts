/**
 * @module ProfessorRoutes
 * @description Defines the API routes for the professor module.
 * All routes are protected by authentication.
 * @see {@link ./professor.controller.ts}
 */
import { Router } from 'express';
import { findAll, findOne, update, remove } from './professor.controller.js';
import { authMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import { UpdateProfessorSchema } from './professor.schema.js';

export const professorRouter = Router();

// Apply authentication middleware to all professor routes.
professorRouter.use(authMiddleware);

professorRouter.get('/', findAll);
professorRouter.get('/:id', findOne);

// The POST route for direct creation has been removed as it's architecturally incorrect.
// Professor profiles are created via business logic (accepting an Appeal).

professorRouter.put(
  '/:id',
  validationMiddleware(UpdateProfessorSchema),
  update
);
professorRouter.patch(
  '/:id',
  validationMiddleware(UpdateProfessorSchema),
  update
);
professorRouter.delete('/:id', remove);
