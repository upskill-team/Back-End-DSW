/**
 * @module Models/Course/Controller
 * @remarks Handles HTTP requests for the Course module.
 * @see {@link CourseService} for business logic.
 */
import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { CourseService } from './course.services.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { User } from '../user/user.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Handles the retrieval of courses for the currently authenticated professor.
 * @param {Request} req The Express request object, containing the user payload from auth.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A list of the professor's courses.
 */
async function findMyCourses(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);

  const userId = req.user!.id;

  const courses = await courseService.findCoursesOfProfessor(userId);

  return HttpResponse.Ok(res, courses);
}

/**
 * Handles the retrieval of all courses.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} A list of all courses.
 */
async function findAll(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);
  const courses = await courseService.findAll();
  return HttpResponse.Ok(res, courses);
}

/**
 * Handles the retrieval of a single course by its ID.
 * @param {Request} req The Express request object, containing the course ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The requested course data.
 */
async function findOne(req: Request, res: Response) {
  // This try...catch remains because it handles a specific error case (NotFoundError)
  // to return a 404, which is more specific than a generic 500. Check it
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { id } = req.params;
    const course = await courseService.findOne(id);
    return HttpResponse.Ok(res, course);
  } catch (error: any) {
    // Handle specific, expected errors locally.
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    throw error;
  }
}

/**
 * Handles the creation of a new course.
 * @param {Request} req The Express request object, with course data in the body and user info from auth.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The newly created course.
 */
async function add(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);
  const em = orm.em.fork();

  const userObjectId = new ObjectId(req.user!.id);

  const user = await em.findOne(
    User,
    { _id: userObjectId },
    { populate: ['professorProfile'] }
  );

  const professorId = user?.professorProfile?.id;
  if (!professorId) {
    return HttpResponse.Unauthorized(
      res,
      'The authenticated user is not a professor.'
    );
  }

  const imageUrl = req.file?.path;

  const newCourse = await courseService.create(req.body, professorId, imageUrl);
  return HttpResponse.Created(res, newCourse);
}

/**
 * Handles updating an existing course.
 * @param {Request} req The Express request object, with course ID in params and update data in body.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The updated course data.
 */
async function update(req: Request, res: Response) {
  // This try...catch also remains for specific NotFoundError handling.
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { id } = req.params;
    const userId = req.user!.id;
    const updatedCourse = await courseService.update(id, req.body, userId);
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    throw error;
  }
}

/**
 * Handles the deletion of a course.
 * @param {Request} req The Express request object, with course ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A confirmation message.
 */
async function remove(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);
  const { id } = req.params;
  const userId = req.user!.id;
  await courseService.remove(id, userId);
  return HttpResponse.Ok(res, { message: 'Course deleted successfully' });
}
export { findAll, findOne, add, update, remove, findMyCourses };
