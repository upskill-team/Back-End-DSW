/**
@module CourseController
@description Handles HTTP requests for the Course module.
*/
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { CourseService } from './course.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'
import { User } from '../user/user.entity.js'
async function findAll(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log)
  const courses = await courseService.findAll()
  return HttpResponse.Ok(res, courses)
}
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
export { findAll, findOne, add, update, remove }
