/**
 * @module Models/Student/Controller
 * @remarks Handles HTTP requests for the Student module.
 * @see {@link StudentService} for business logic.
 */

import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { StudentService } from './student.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

/**
 * Handles the retrieval of all students.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A list of all students.
 */
async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const studentService = new StudentService(orm.em.fork(), req.log)
    const students = await studentService.findAll()
    return HttpResponse.Ok(res, students)
  } catch (error) {
    next(error)
  }
}

/**
 * Handles the retrieval of a single student by ID.
 * @param {Request} req The Express request object, with student ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The requested student's data.
 */
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

/**
 * Handles updating an existing student's profile.
 * @param {Request} req The Express request object, with student ID in params and update data in body.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The updated student data.
 */
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

/**
 * Handles the deletion of a student profile.
 * @param {Request} req The Express request object, with student ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A confirmation message.
 */
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
