/**
 * @module Models/Assessment/Routes
 * @remarks Defines the API routes for the Assessment module.
 */

import { Router } from 'express';
import * as assessmentController from './assessment.controller.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import {
  CreateAssessmentSchema,
  UpdateAssessmentSchema,
  StartAttemptSchema,
  SubmitAnswerSchema,
  SubmitAttemptSchema,
} from './assessment.schemas.js';
import {
  authMiddleware,
  roleAuthMiddleware,
} from '../../auth/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const assessmentRouter = Router();

assessmentRouter.use(authMiddleware);

const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR]);
const studentOrProfessor = roleAuthMiddleware([
  UserRole.STUDENT,
  UserRole.PROFESSOR,
]);
const professorOrAdmin = roleAuthMiddleware([
  UserRole.PROFESSOR,
  UserRole.ADMIN,
]);

// Assessment CRUD routes (Professor only)
assessmentRouter.get('/', assessmentController.findAll);
assessmentRouter.get('/:id', assessmentController.findOne);

assessmentRouter.post(
  '/',
  professorOnly,
  validationMiddleware(CreateAssessmentSchema),
  assessmentController.create
);

assessmentRouter.put(
  '/:id',
  professorOnly,
  validationMiddleware(UpdateAssessmentSchema),
  assessmentController.update
);

assessmentRouter.delete('/:id', professorOrAdmin, assessmentController.remove);

// Attempt routes (Students & Professors)
// POST /api/assessments/:assessmentId/attempts - Start new attempt
assessmentRouter.post(
  '/:assessmentId/attempts',
  studentOrProfessor,
  validationMiddleware(StartAttemptSchema),
  assessmentController.startAttempt
);

// PATCH /api/assessments/attempts/:attemptId/answers - Auto-save answers
assessmentRouter.patch(
  '/attempts/:attemptId/answers',
  studentOrProfessor,
  assessmentController.saveAnswers
);

// POST /api/assessments/attempts/:attemptId/submit - Submit attempt
assessmentRouter.post(
  '/attempts/:attemptId/submit',
  studentOrProfessor,
  validationMiddleware(SubmitAttemptSchema),
  assessmentController.submitAttempt
);

// GET /api/assessments/attempts/:attemptId - Get attempt result
assessmentRouter.get(
  '/attempts/:attemptId',
  assessmentController.getAttemptWithAnswers
);

// GET /api/assessments/:assessmentId/attempts - List attempts for an assessment
assessmentRouter.get(
  '/:assessmentId/attempts',
  assessmentController.getAttemptsByAssessment
);

// GET /api/assessments/:assessmentId/statistics - Get assessment statistics (professors only)
assessmentRouter.get(
  '/:assessmentId/statistics',
  professorOrAdmin,
  assessmentController.getAssessmentStatistics
);

// GET /api/assessments/:assessmentId/all-attempts - Get all attempts for professors
assessmentRouter.get(
  '/:assessmentId/all-attempts',
  professorOrAdmin,
  assessmentController.getAllAttemptsForProfessor
);

// Legacy routes (for backwards compatibility)
assessmentRouter.post(
  '/attempts/start',
  studentOrProfessor,
  validationMiddleware(StartAttemptSchema),
  assessmentController.startAttempt
);

assessmentRouter.post(
  '/attempts/answer',
  studentOrProfessor,
  validationMiddleware(SubmitAnswerSchema),
  assessmentController.submitAnswer
);

assessmentRouter.post(
  '/attempts/submit',
  studentOrProfessor,
  validationMiddleware(SubmitAttemptSchema),
  assessmentController.submitAttempt
);

assessmentRouter.get(
  '/attempts/student/:studentId',
  assessmentController.getAttemptsByStudent
);

export default assessmentRouter;
