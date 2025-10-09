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
const studentOnly = roleAuthMiddleware([UserRole.STUDENT]);
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

// Attempt routes (Students)
assessmentRouter.post(
  '/attempts/start',
  studentOnly,
  validationMiddleware(StartAttemptSchema),
  assessmentController.startAttempt
);

assessmentRouter.post(
  '/attempts/answer',
  studentOnly,
  validationMiddleware(SubmitAnswerSchema),
  assessmentController.submitAnswer
);

assessmentRouter.post(
  '/attempts/submit',
  studentOnly,
  validationMiddleware(SubmitAttemptSchema),
  assessmentController.submitAttempt
);

// Viewing attempts (Professor can see all attempts for their assessments)
assessmentRouter.get(
  '/:assessmentId/attempts',
  professorOnly,
  assessmentController.getAttemptsByAssessment
);

assessmentRouter.get(
  '/attempts/student/:studentId',
  assessmentController.getAttemptsByStudent
);

assessmentRouter.get(
  '/attempts/:attemptId',
  assessmentController.getAttemptWithAnswers
);

export default assessmentRouter;
