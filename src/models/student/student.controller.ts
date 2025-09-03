/**
 * @module StudentController
 * @description Handles HTTP requests for the Student module.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { StudentService } from './student.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const studentService = new StudentService(orm.em.fork(), req.log)
    const students = await studentService.findAll()
    return HttpResponse.Ok(res, students)
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const studentService = new StudentService(orm.em.fork(), req.log)
    const { id } = req.params
    const student = await studentService.findOne(id)

    if (!student) {
      return HttpResponse.NotFound(res, 'Student not found')
    }
    return HttpResponse.Ok(res, student)
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const studentService = new StudentService(orm.em.fork(), req.log)
    const { id } = req.params
    const updatedStudent = await studentService.update(id, req.body)
    return HttpResponse.Ok(res, updatedStudent)
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const studentService = new StudentService(orm.em.fork(), req.log)
    const { id } = req.params
    await studentService.remove(id)
    return HttpResponse.Ok(res, { message: 'Student deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, update, remove }
