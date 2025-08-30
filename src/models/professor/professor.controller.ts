/**
 * @module models/professor
 * Handles HTTP requests for the professor module.
 * @see {@link ProfessorService}
 */
import { Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { ProfessorService } from './professor.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function findAll(req: Request, res: Response) {
  const service = new ProfessorService(orm.em.fork())
  const professors = await service.findAll()
  return HttpResponse.Ok(res, professors)
}

async function findOne(req: Request, res: Response) {
  const service = new ProfessorService(orm.em.fork())
  const { id } = req.params
  const professor = await service.findOne(id)
  return HttpResponse.Ok(res, professor)
}

async function update(req: Request, res: Response) {
  const service = new ProfessorService(orm.em.fork())
  const { id } = req.params
  const updatedProfessor = await service.update(id, req.body)
  return HttpResponse.Ok(res, updatedProfessor)
}

async function remove(req: Request, res: Response) {
  const service = new ProfessorService(orm.em.fork())
  const { id } = req.params
  await service.remove(id)
  return HttpResponse.Ok(res, { message: 'Professor deleted successfully' })
}

export { findAll, findOne, update, remove }
