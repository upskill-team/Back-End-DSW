/**
 * @module models/institution
 * Handles the HTTP request/response logic for the institution module.
 * It uses the InstitutionService to perform business logic and responds with standardized HTTP responses.
 * @see {@link InstitutionService}
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { InstitutionService } from './institution.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork())
    const institutions = await service.findAll()
    return HttpResponse.Ok(res, institutions)
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork())
    const { id } = req.params
    const institution = await service.findOne(id)
    return HttpResponse.Ok(res, institution)
  } catch (error) {
    next(error)
  }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork())
    const newInstitution = await service.create(req.body)
    return HttpResponse.Created(res, newInstitution)
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork())
    const { id } = req.params
    const updatedInstitution = await service.update(id, req.body)
    return HttpResponse.Ok(res, updatedInstitution)
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork())
    const { id } = req.params
    await service.remove(id)
    return HttpResponse.Ok(res, { message: 'Institution deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, add, remove, update }
