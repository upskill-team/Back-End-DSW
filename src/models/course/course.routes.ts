/**
 * @module Models/Course/Routes
 * @remarks Defines the API routes for the Course module.
 */

import { Router } from 'express';
import * as courseController from './course.controller.js';
import * as questionController from '../question/question.controller.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateUnitSchema,
  UpdateUnitSchema,
  ReorderUnitsSchema,
  QuickSaveSchema,
} from './course.schemas.js';
import {
  CreateQuestionSchema,
  UpdateQuestionSchema,
} from '../question/question.schemas.js';
import {
  authMiddleware,
  roleAuthMiddleware,
} from '../../auth/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';
import { uploadCourseImage } from '../../shared/middlewares/file-upload.middleware.js';
import {
  uploadCourseData,
  handleMulterUpload,
} from '../../shared/middlewares/file-upload.middleware.js';
import { enrollmentCheckMiddleware } from '../../shared/middlewares/enrollmentCheck.middleware.js';

export const courseRouter = Router();

const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR]);
const professorOrAdmin = roleAuthMiddleware([
  UserRole.PROFESSOR,
  UserRole.ADMIN,
]);


courseRouter.get('/', courseController.findAllWithPagination);

courseRouter.get('/trending', courseController.findTrending);

courseRouter.get('/my-courses', authMiddleware, professorOnly, courseController.findMyCourses);

courseRouter.get('/:id', courseController.findOne);

courseRouter.post(
  '/',
  authMiddleware,
  professorOnly,
  uploadCourseImage.single('image'),
  validationMiddleware(CreateCourseSchema),
  courseController.add
);
courseRouter.put(
  '/:id',
  authMiddleware,
  professorOnly,
  handleMulterUpload(uploadCourseData),
  courseController.update
);
courseRouter.patch(
  '/:id',
  authMiddleware,
  professorOnly,
  validationMiddleware(UpdateCourseSchema),
  courseController.update
);

courseRouter.delete('/:id', professorOrAdmin, courseController.remove);

// Question routes not nested under courses
courseRouter.get(
  '/questions/my',
  authMiddleware,
  professorOnly,
  questionController.findMyQuestions
);

// Question routes - nested under courses
courseRouter.get(
  '/:courseId/questions',
  authMiddleware,
  professorOnly,
  questionController.findByCourse
);

courseRouter.get(
  '/:courseId/questions/general',
  authMiddleware,
  professorOnly,
  questionController.findGeneralQuestions
);

courseRouter.post(
  '/:courseId/questions',
  authMiddleware,
  professorOnly,
  validationMiddleware(CreateQuestionSchema),
  questionController.add
);

// Allow both students and professors to view a question
courseRouter.get('/:courseId/questions/:id', authMiddleware, questionController.findOne);

courseRouter.put(
  '/:courseId/questions/:id',
  authMiddleware,
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.update
);

courseRouter.patch(
  '/:courseId/questions/:id',
  authMiddleware,
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.update
);

courseRouter.delete(
  '/:courseId/questions/:id',
  authMiddleware,
  professorOrAdmin,
  questionController.remove
);

// Unit-specific question routes
courseRouter.get(
  '/:courseId/units/:unitNumber/questions',
  authMiddleware,
  professorOnly,
  questionController.findByUnit
);

courseRouter.post(
  '/:courseId/units/:unitNumber/questions',
  authMiddleware,
  professorOnly,
  validationMiddleware(CreateQuestionSchema),
  questionController.addToUnit
);

courseRouter.get(
  '/:courseId/units/:unitNumber/questions/:id',
  authMiddleware,
  professorOnly,
  questionController.findOneFromUnit
);

courseRouter.put(
  '/:courseId/units/:unitNumber/questions/:id',
  authMiddleware,
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.updateFromUnit
);

courseRouter.patch(
  '/:courseId/units/:unitNumber/questions/:id',
  authMiddleware,
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.updateFromUnit
);

courseRouter.delete(
  '/:courseId/units/:unitNumber/questions/:id',
  authMiddleware,
  professorOrAdmin,
  questionController.removeFromUnit
);

// Individual unit management routes
courseRouter.post(
  '/:courseId/units',
  authMiddleware,
  professorOnly,
  validationMiddleware(CreateUnitSchema),
  courseController.createUnit
);

courseRouter.put(
  '/:courseId/units/:unitNumber',
  authMiddleware,
  professorOnly,
  validationMiddleware(UpdateUnitSchema),
  courseController.updateUnit
);

courseRouter.delete(
  '/:courseId/units/:unitNumber',
  authMiddleware,
  professorOrAdmin,
  courseController.deleteUnit
);

courseRouter.patch(
  '/:courseId/units/reorder',
  authMiddleware,
  professorOnly,
  validationMiddleware(ReorderUnitsSchema),
  courseController.reorderUnits
);

// Individual material management routes
courseRouter.post(
  '/:courseId/units/:unitNumber/materials',
  authMiddleware,
  professorOnly,
  handleMulterUpload(uploadCourseData),
  courseController.uploadMaterial
);

courseRouter.delete(
  '/:courseId/units/:unitNumber/materials/:materialIndex',
  authMiddleware,
  professorOrAdmin,
  courseController.deleteMaterial
);

// Quick save route
courseRouter.patch(
  '/:courseId/quick-save',
  authMiddleware,
  professorOnly,
  validationMiddleware(QuickSaveSchema),
  courseController.quickSave
);

// Assessment routes for a specific course
// Import assessment controller
import * as assessmentController from '../assessment/assessment.controller.js';

courseRouter.get(
  '/:courseId/assessments',
  enrollmentCheckMiddleware,
  authMiddleware,
  assessmentController.getAssessmentsByCourse
);

// Enrollment routes - Alias for frontend compatibility
import * as enrollmentController from '../Enrollement/enrollement.controller.js';

// GET /api/courses/:courseId/enrollments (for professors)
courseRouter.get(
  '/:courseId/enrollments',
  authMiddleware,
  professorOnly,
  enrollmentController.getEnrollementsByCourse
);