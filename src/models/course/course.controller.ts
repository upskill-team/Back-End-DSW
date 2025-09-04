/**
 * @module Models/Course/Controller
 * @remarks Handles HTTP requests for the Course module.
 * @see {@link CourseService} for business logic.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { CourseService } from './course.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'
import { User } from '../user/user.entity.js'

/**
 * Handles the retrieval of courses for the currently authenticated professor.
 * @param {Request} req The Express request object, containing the user payload from auth.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A list of the professor's courses.
 */
async function findMyCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log)
    const userId = req.user!.id

    const courses = await courseService.findByAuthenticatedProfessor(userId)
    
    return HttpResponse.Ok(res, courses)
  } catch (error: any) {

    if (error.message === 'User is not a professor') {
        return HttpResponse.Unauthorized(res, 'The authenticated user is not a professor.')
    }
    next(error)
  }
}

/**
 * Handles the retrieval of all courses.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} A list of all courses.
 */
async function findAll(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log)
  const courses = await courseService.findAll()
  return HttpResponse.Ok(res, courses)
}

/**
 * Handles the retrieval of a single course by its ID.
 * @param {Request} req The Express request object, containing the course ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The requested course data.
 */
async function findOne(req: Request, res: Response, next: NextFunction) {
  // This try...catch remains because it handles a specific error case (NotFoundError)
  // to return a 404, which is more specific than a generic 500. Check it
  try {
    const courseService = new CourseService(orm.em.fork(), req.log)
    const { id } = req.params
    const course = await courseService.findOne(id)
    return HttpResponse.Ok(res, course)
  } catch (error: any) {
    // Handle specific, expected errors locally.
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    // Delegate all other, unexpected errors to the global handler.
    return next(error);
  }
}

/**
 * Handles the creation of a new course.
 * @param {Request} req The Express request object, with course data in the body and user info from auth.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The newly created course.
 */
async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log)
    const em = orm.em.fork()
    const user = await em.findOne(
      User,
      { id: req.user?.id },
      { populate: ['professorProfile'] }
    )
    const professorId = user?.professorProfile?.id
    if (!professorId) {
      return HttpResponse.Unauthorized(
        res,
        'The authenticated user is not a professor.'
      )
    }
    const newCourse = await courseService.create(req.body, professorId)
    return HttpResponse.Created(res, newCourse)
  } catch (error) {
    next(error)
  }
}

/**
 * Handles updating an existing course.
 * @param {Request} req The Express request object, with course ID in params and update data in body.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The updated course data.
 */
async function update(req: Request, res: Response, next: NextFunction) {
  // This try...catch also remains for specific NotFoundError handling.
  try {
    const courseService = new CourseService(orm.em.fork(), req.log)
    const { id } = req.params
    const updatedCourse = await courseService.update(id, req.body)
    return HttpResponse.Ok(res, updatedCourse)
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    return next(error);
  }
}

/**
 * Handles the deletion of a course.
 * @param {Request} req The Express request object, with course ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A confirmation message.
 */
async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log)
    const { id } = req.params
    await courseService.remove(id)
    return HttpResponse.Ok(res, { message: 'Course deleted successfully' })
  } catch (error) {
    next(error)
  }
}
export { findAll, findOne, add, update, remove, findMyCourses }
