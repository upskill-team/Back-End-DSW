/**
@module CourseController
@description Handles HTTP requests for the Course module.
*/
import { Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { CourseService } from './course.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'
import { User } from '../user/user.entity.js'
async function findAll(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork())
  const courses = await courseService.findAll()
  return HttpResponse.Ok(res, courses)
}

async function findOne(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork())
  const { id } = req.params
  const course = await courseService.findOne(id)
  return HttpResponse.Ok(res, course)
}

async function add(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork())
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
}

async function update(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork())
  const { id } = req.params
  const updatedCourse = await courseService.update(id, req.body)
  return HttpResponse.Ok(res, updatedCourse)
}

async function remove(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork())
  const { id } = req.params
  await courseService.remove(id)
  return HttpResponse.Ok(res, { message: 'Course deleted successfully' })
}

export { findAll, findOne, add, update, remove }
