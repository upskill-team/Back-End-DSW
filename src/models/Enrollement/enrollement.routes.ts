/**
 * @module Models/Enrollement/Routes
 * @remarks Defines the API routes for the Enrollement module.
 */

import { Router } from 'express';
import * as enrolController from './enrollement.controller.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import {
  CreateEnrollementSchema,
  UpdateEnrollementSchema,
  SearchEnrollementsSchema,
  UnitProgressSchema,
} from './enrollement.schemas.js';
import { authMiddleware } from '../../auth/auth.middleware.js';

export const enrollementRouter = Router();

enrollementRouter.use(authMiddleware);

// List / search enrollements (query validated)
enrollementRouter.get(
  '/',
  validationMiddleware(SearchEnrollementsSchema),
  enrolController.getEnrollements
);

// Create enrollement
enrollementRouter.post(
  '/',
  validationMiddleware(CreateEnrollementSchema),
  enrolController.createEnrollement
);

// Get by student and course (specific route before generic patterns)
enrollementRouter.get(
  '/student/:studentId/course/:courseId',
  enrolController.getEnrollmentByStudentAndCourse
);

// Get by student
enrollementRouter.get(
  '/student/:studentId',
  enrolController.getEnrollementsByStudent
);

// Get by course
enrollementRouter.get(
  '/course/:courseId',
  enrolController.getEnrollementsByCourse
);

// Unit progress routes (must be before /:id to avoid route conflicts)
enrollementRouter.patch(
  '/:enrollmentId/complete-unit',
  validationMiddleware(UnitProgressSchema),
  enrolController.completeUnit
);
enrollementRouter.patch(
  '/:enrollmentId/uncomplete-unit',
  validationMiddleware(UnitProgressSchema),
  enrolController.uncompleteUnit
);

// Generic routes with :id parameter (must be at the end)
enrollementRouter.get('/:id', enrolController.getEnrollementById);

// Update partial
enrollementRouter.patch(
  '/:id',
  validationMiddleware(UpdateEnrollementSchema),
  enrolController.updateEnrollement
);

// Delete
enrollementRouter.delete('/:id', enrolController.deleteEnrollement);
