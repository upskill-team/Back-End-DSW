/**
 * @module Models/Institution/Routes
 * @remarks Defines the API routes for the Institution module.
 * @requires express
 * @requires InstitutionController
 * @requires authMiddleware
 */

import { Router } from 'express';
import {
  add,
  findAll,
  findOne,
  remove,
  update,
} from './institution.controller.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import {
  CreateInstitutionSchema,
  UpdateInstitutionSchema,
} from './institution.schemas.js';
import {
  authMiddleware,
  roleAuthMiddleware,
} from '../../auth/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const institutionRouter = Router();

institutionRouter.use(authMiddleware);

const adminOnly = roleAuthMiddleware([UserRole.ADMIN]);

institutionRouter.get('/', findAll);
institutionRouter.get('/:id', findOne);

institutionRouter.post(
  '/',
  adminOnly,
  validationMiddleware(CreateInstitutionSchema),
  add
);

institutionRouter.put(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
);

institutionRouter.patch(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
);

institutionRouter.delete('/:id', adminOnly, remove);
