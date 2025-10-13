/**
 * @module Models/Professor/Controller
 * @remarks Handles HTTP requests for the professor module.
 * @see {@link ProfessorService}
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { ProfessorService } from './professor.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new ProfessorService(orm.em.fork(), req.log)
    const professors = await service.findAll()
    return HttpResponse.Ok(res, professors)
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new ProfessorService(orm.em.fork(), req.log)
    const { id } = req.params
    const professor = await service.findOne(id)
    return HttpResponse.Ok(res, professor)
  } catch (error) {
    next(error)
  }
}

async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new ProfessorService(orm.em.fork(), req.log)
    const userId = req.user?.id

    if (!userId) {
      return HttpResponse.Unauthorized(res, {
        message: 'You are not authenticated.',
      })
    }

    const professor = await service.getByUserId(userId)

    if (!professor) {
      return HttpResponse.NotFound(res, {
        message: 'You dont have a teacher profile.',
      })
    }

    return HttpResponse.Ok(res, professor)
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new ProfessorService(orm.em.fork(), req.log)
    const { id } = req.params
    const updatedProfessor = await service.update(id, req.body)
    return HttpResponse.Ok(res, updatedProfessor)
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new ProfessorService(orm.em.fork(), req.log)
    const { id } = req.params
    await service.remove(id)
    return HttpResponse.Ok(res, { message: 'Professor deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, getMe, update, remove }