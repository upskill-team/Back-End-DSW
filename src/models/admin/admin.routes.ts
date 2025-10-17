/**
 * @module Models/Admin/Routes
 * @remarks Express routes for admin endpoints.
 */

import { Router } from 'express';
import { authMiddleware } from '../../auth/auth.middleware.js';
import { roleAuthMiddleware } from '../../auth/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';
import * as adminController from './admin.controller.js';

export const adminRouter = Router();

/**
 * GET /api/admin/analytics
 * Get comprehensive platform analytics (admin only)
 */
adminRouter.get(
  '/analytics',
  authMiddleware,
  roleAuthMiddleware([UserRole.ADMIN]),
  adminController.getAnalytics
);
