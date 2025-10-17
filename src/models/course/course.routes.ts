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
import { enrollmentCheckMiddleware } from '../../shared/middlewares/enrollmentCheck.middleware.js'

export const courseRouter = Router();

courseRouter.get('/', courseController.findAllWithPagination);

courseRouter.get('/trending', courseController.findTrending)

courseRouter.use(authMiddleware);

const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR]);
const professorOrAdmin = roleAuthMiddleware([
  UserRole.PROFESSOR,
  UserRole.ADMIN,
]);

courseRouter.get('/my-courses', professorOnly, courseController.findMyCourses);

courseRouter.get('/:id', courseController.findOne);

courseRouter.post(
  '/',
  professorOnly,
  uploadCourseImage.single('image'),
  validationMiddleware(CreateCourseSchema),
  courseController.add
);
courseRouter.put(
  '/:id',
  professorOnly,
  handleMulterUpload(uploadCourseData),
  courseController.update
);
courseRouter.patch(
  '/:id',
  professorOnly,
  validationMiddleware(UpdateCourseSchema),
  courseController.update
);

courseRouter.delete('/:id', professorOrAdmin, courseController.remove);

// Question routes not nested under courses
courseRouter.get(
  '/questions/my',
  professorOnly,
  questionController.findMyQuestions
);

// Question routes - nested under courses
courseRouter.get(
  '/:courseId/questions',
  professorOnly,
  questionController.findByCourse
);

courseRouter.get(
  '/:courseId/questions/general',
  professorOnly,
  questionController.findGeneralQuestions
);

courseRouter.post(
  '/:courseId/questions',
  professorOnly,
  validationMiddleware(CreateQuestionSchema),
  questionController.add
);

// Allow both students and professors to view a question
courseRouter.get('/:courseId/questions/:id', questionController.findOne);
courseRouter.put(
  '/:courseId/questions/:id',
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.update
);
courseRouter.patch(
  '/:courseId/questions/:id',
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.update
);
courseRouter.delete(
  '/:courseId/questions/:id',
  professorOrAdmin,
  questionController.remove
);

// Unit-specific question routes
courseRouter.get(
  '/:courseId/units/:unitNumber/questions',
  professorOnly,
  questionController.findByUnit
);

courseRouter.post(
  '/:courseId/units/:unitNumber/questions',
  professorOnly,
  validationMiddleware(CreateQuestionSchema),
  questionController.addToUnit
);

courseRouter.get(
  '/:courseId/units/:unitNumber/questions/:id',
  professorOnly,
  questionController.findOneFromUnit
);

courseRouter.put(
  '/:courseId/units/:unitNumber/questions/:id',
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.updateFromUnit
);

courseRouter.patch(
  '/:courseId/units/:unitNumber/questions/:id',
  professorOnly,
  validationMiddleware(UpdateQuestionSchema),
  questionController.updateFromUnit
);

courseRouter.delete(
  '/:courseId/units/:unitNumber/questions/:id',
  professorOrAdmin,
  questionController.removeFromUnit
);

// Individual unit management routes
courseRouter.post(
  '/:courseId/units',
  professorOnly,
  validationMiddleware(CreateUnitSchema),
  courseController.createUnit
);

courseRouter.put(
  '/:courseId/units/:unitNumber',
  professorOnly,
  validationMiddleware(UpdateUnitSchema),
  courseController.updateUnit
);

courseRouter.delete(
  '/:courseId/units/:unitNumber',
  professorOrAdmin,
  courseController.deleteUnit
);

courseRouter.patch(
  '/:courseId/units/reorder',
  professorOnly,
  validationMiddleware(ReorderUnitsSchema),
  courseController.reorderUnits
);

// Individual material management routes
courseRouter.post(
  '/:courseId/units/:unitNumber/materials',
  professorOnly,
  handleMulterUpload(uploadCourseData),
  courseController.uploadMaterial
);

courseRouter.delete(
  '/:courseId/units/:unitNumber/materials/:materialIndex',
  professorOrAdmin,
  courseController.deleteMaterial
);

// Quick save route
courseRouter.patch(
  '/:courseId/quick-save',
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
  assessmentController.getAssessmentsByCourse
);

// Enrollment routes - Alias for frontend compatibility
import * as enrollmentController from '../Enrollement/enrollement.controller.js';

// GET /api/courses/:courseId/enrollments (for professors)
courseRouter.get(
  '/:courseId/enrollments',
  professorOnly,
  enrollmentController.getEnrollementsByCourse
);
