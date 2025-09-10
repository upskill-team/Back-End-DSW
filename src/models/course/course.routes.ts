/**
 * @module Models/Course/Routes
 * @remarks Defines the API routes for the Course module.
 */

import { Router } from 'express';
import * as courseController from './course.controller.js';
import * as questionController from '../question/question.controller.js';
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js';
import { CreateCourseSchema, UpdateCourseSchema } from './course.schemas.js';
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
import { uploadCourseData } from '../../shared/middlewares/file-upload.middleware.js'

export const courseRouter = Router();

courseRouter.use(authMiddleware);

const professorOnly = roleAuthMiddleware([UserRole.PROFESSOR]);
const professorOrAdmin = roleAuthMiddleware([
  UserRole.PROFESSOR,
  UserRole.ADMIN,
]);

courseRouter.get('/', courseController.findAll);
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
  validationMiddleware(UpdateCourseSchema),
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
courseRouter.post(
  '/:courseId/questions',
  professorOnly,
  validationMiddleware(CreateQuestionSchema),
  questionController.add
);
courseRouter.get(
  '/:courseId/questions/:id',
  professorOnly,
  questionController.findOne
);
courseRouter.put(
  '/:courseId/questions/:id',
  professorOnly,
  uploadCourseData,
  courseController.update,
  validationMiddleware(UpdateQuestionSchema),
  questionController.update
);
courseRouter.patch(
  '/:courseId/questions/:id',
  professorOnly,
  uploadCourseData,
  courseController.update,
  validationMiddleware(UpdateQuestionSchema),
  questionController.update
);
courseRouter.delete(
  '/:courseId/questions/:id',
  professorOrAdmin,
  questionController.remove
);
