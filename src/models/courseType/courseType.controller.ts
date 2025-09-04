/**
 * @module Models/CourseType/Controller
 * @remarks Handles HTTP requests for the CourseType module.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { CourseTypeService } from './courseType.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new CourseTypeService(orm.em.fork(), req.log)
    const newCourseType = await service.create(req.body)
    return HttpResponse.Created(res, newCourseType)
  } catch (error: any) {
    if (error.code === 11000) {
      return HttpResponse.BadRequest(
        res,
        'There is already a type of course with that name.'
      )
    }
    return next(error)
  }
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new CourseTypeService(orm.em.fork(), req.log)
    const courseTypes = await service.findAll()
    return HttpResponse.Ok(res, courseTypes)
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new CourseTypeService(orm.em.fork(), req.log)
    const { id } = req.params
    const courseType = await service.findOne(id)
    if (!courseType) {
      return HttpResponse.NotFound(res, 'Course type not found.')
    }
    return HttpResponse.Ok(res, courseType)
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new CourseTypeService(orm.em.fork(), req.log)
    const { id } = req.params
    const updatedCourseType = await service.update(id, req.body)
    return HttpResponse.Ok(res, updatedCourseType)
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new CourseTypeService(orm.em.fork(), req.log)
    const { id } = req.params
    await service.remove(id)
    return HttpResponse.Ok(res, { message: 'Course type successfully deleted.' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, add, update, remove }
