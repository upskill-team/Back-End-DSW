// institution.routes.ts (versión limpia)

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

// Middleware de autenticación para todas las rutas de este módulo
institutionRouter.use(authMiddleware);

const adminOnly = roleAuthMiddleware([UserRole.ADMIN]);

// Las rutas ahora están limpias y son fáciles de leer.
// swagger-jsdoc las asociará automáticamente con las definiciones en el YAML
// gracias a la configuración en `apis`.

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
