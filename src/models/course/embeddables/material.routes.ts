import { Router } from 'express';
import { authMiddleware } from '../../../auth/auth.middleware.js';
import { uploadMaterialToCloudinary } from '../../../shared/middlewares/file-upload.middleware.js';
import { uploadMaterial } from './material.controller.js';

export const materialRouter = Router();

materialRouter.use(authMiddleware);

materialRouter.post(
  '/upload',
  uploadMaterialToCloudinary.single('material'),
  uploadMaterial
);