/**
 * @module StudentController
 * @description Handles HTTP requests for the Student module.
 */
import { Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { StudentService } from './student.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function findAll(req: Request, res: Response) {
  const studentService = new StudentService(orm.em.fork())
  const students = await studentService.findAll()
  return HttpResponse.Ok(res, students)
}

async function findOne(req: Request, res: Response) {
  const studentService = new StudentService(orm.em.fork())
  const { id } = req.params
  const student = await studentService.findOne(id)

  if (!student) {
    return HttpResponse.NotFound(res, 'Student not found')
  }
  return HttpResponse.Ok(res, student)
}

async function update(req: Request, res: Response) {
  const studentService = new StudentService(orm.em.fork())
  const { id } = req.params
  const updatedStudent = await studentService.update(id, req.body)
  return HttpResponse.Ok(res, updatedStudent)
}

async function remove(req: Request, res: Response) {
  const studentService = new StudentService(orm.em.fork())
  const { id } = req.params
  await studentService.remove(id)
  return HttpResponse.Ok(res, { message: 'Student deleted successfully' })
}

export { findAll, findOne, update, remove }
