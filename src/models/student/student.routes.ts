/**
 * @module Models/Student/Routes
 * @remarks Defines the API routes for the Student module.
 */

import { Router } from 'express';
import { findAll, findOne, update, remove } from './student.controller.js';

import {
  authMiddleware,
  roleAuthMiddleware,
} from '../../auth/auth.middleware.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';

import { UpdateStudentSchema } from './student.schemas.js';
import { UserRole } from '../user/user.entity.js';

export const studentRouter = Router();

studentRouter.use(authMiddleware);

const adminOnly = roleAuthMiddleware([UserRole.ADMIN]);

studentRouter.get('/', findAll);
studentRouter.get('/:id', findOne);

studentRouter.put(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateStudentSchema),
  update
);
studentRouter.patch(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateStudentSchema),
  update
);

studentRouter.delete('/:id', adminOnly, remove);

// Assessment routes for students
import * as assessmentController from '../assessment/assessment.controller.js';

studentRouter.get(
  '/:studentId/assessments/pending',
  assessmentController.getPendingAssessments
);

// Enrollment routes - Alias for frontend compatibility
import * as enrollmentController from '../Enrollement/enrollement.controller.js';

// GET /api/students/:studentId/enrollments
studentRouter.get(
  '/:studentId/enrollments',
  enrollmentController.getEnrollementsByStudent
);

// GET /api/students/:studentId/courses/:courseId/enrollment
studentRouter.get(
  '/:studentId/courses/:courseId/enrollment',
  enrollmentController.getEnrollmentByStudentAndCourse
);
