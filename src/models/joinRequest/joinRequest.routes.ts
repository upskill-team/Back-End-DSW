/**
 * @module Models/JoinRequest/Routes
 * @remarks Defines the API routes for the JoinRequest module.
 */
import { Router } from 'express';
import { create, findPendingForInstitution, processRequest, findMyPendingRequest, cancelRequest } from './joinRequest.controller.js';
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import { CreateJoinRequestSchema, ProcessJoinRequestSchema } from './joinRequest.schemas.js';
import { UserRole } from '../user/user.entity.js';

export const joinRequestRouter = Router();

// All routes in this module require an authenticated professor
joinRequestRouter.use(authMiddleware, roleAuthMiddleware([UserRole.PROFESSOR]));

// A professor gets their own pending request
joinRequestRouter.get('/me/pending', findMyPendingRequest);

// A professor creates a request to join an institution
joinRequestRouter.post('/', validationMiddleware(CreateJoinRequestSchema), create);

// A professor cancels their own request
joinRequestRouter.delete('/:requestId', cancelRequest);

// A manager gets all pending requests for their institution
joinRequestRouter.get('/institution/:institutionId/pending', findPendingForInstitution);

// A manager accepts or rejects a specific request
joinRequestRouter.patch('/:requestId/process', validationMiddleware(ProcessJoinRequestSchema), processRequest);