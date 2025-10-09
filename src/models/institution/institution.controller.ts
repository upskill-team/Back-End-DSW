/**
 * @module Models/Institution/Controller
 * @remarks Handles the HTTP request/response logic for the institution module.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { InstitutionService } from './institution.services.js'
import { HttpResponse } from '../../shared/response/http.response.js'
import { getProfessorFromUserId } from '../../shared/utils/professor.helper.js'

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork(), req.log)
    const institutions = await service.findAll()
    return HttpResponse.Ok(res, institutions)
  } catch (error) {
    next(error)
  }
}

async function findAllAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork(), req.log)
    const institutions = await service.findAllAdmin()
    return HttpResponse.Ok(res, institutions)
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork(), req.log)
    const { id } = req.params
    const institution = await service.findOne(id)
    return HttpResponse.Ok(res, institution)
  } catch (error) {
    next(error)
  }
}

async function createByProfessor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const em = orm.em.fork()
    const institutionService = new InstitutionService(em, req.log)
    
    const userId = req.user?.id

    if (!userId) {
      return HttpResponse.Unauthorized(res, {
        message: 'Debes estar autenticado.',
      })
    }

    // Use the helper to get the professor
    // The helper throws if professor doesn't exist
    const professor = await getProfessorFromUserId(em, userId)
    
    // After fetching from DB, id is always defined, we use non-null assertion
    const professorId = professor.id!

    const newInstitution = await institutionService.createByProfessor(
      professorId,
      req.body
    )
    return HttpResponse.Created(res, newInstitution)
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork(), req.log)
    const { id } = req.params
    const updatedInstitution = await service.update(id, req.body)
    return HttpResponse.Ok(res, updatedInstitution)
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new InstitutionService(orm.em.fork(), req.log)
    const { id } = req.params
    await service.remove(id)
    return HttpResponse.Ok(res, { message: 'Institution deleted successfully' })
  } catch (error) {
    next(error)
  }
}

async function removeProfessor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const em = orm.em.fork()
    const institutionService = new InstitutionService(em, req.log)
    
    const { id, professorId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return HttpResponse.Unauthorized(res, {
        message: 'Debes estar autenticado.',
      })
    }

    // Get the requester's professor profile using the helper
    const requester = await getProfessorFromUserId(em, userId)
    const requesterId = requester.id!

    await institutionService.removeProfessor(id, professorId, requesterId)
    return HttpResponse.Ok(res, {
      message: 'Profesor removido de la institución exitosamente.',
    })
  } catch (error) {
    next(error)
  }
}

async function getManagedInstitution(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const em = orm.em.fork()
    const institutionService = new InstitutionService(em, req.log)
    
    const userId = req.user?.id

    if (!userId) {
      return HttpResponse.Unauthorized(res, {
        message: 'Debes estar autenticado.',
      })
    }

    // Get the professor profile using the helper
    const professor = await getProfessorFromUserId(em, userId)
    const professorId = professor.id!

    const institution = await institutionService.getManagedInstitution(
      professorId
    )
    return HttpResponse.Ok(res, institution)
  } catch (error) {
    next(error)
  }
}

async function leaveInstitution(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const em = orm.em.fork()
    const institutionService = new InstitutionService(em, req.log)
    
    const userId = req.user?.id

    if (!userId) {
      return HttpResponse.Unauthorized(res, {
        message: 'Debes estar autenticado.',
      })
    }

    // Get the professor profile using the helper
    const professor = await getProfessorFromUserId(em, userId)
    const professorId = professor.id!

    const { institutionId } = req.params

    await institutionService.removeProfessor(
      institutionId,
      professorId,
      professorId
    )
    return HttpResponse.Ok(res, {
      message: 'Has abandonado la institución exitosamente.',
    })
  } catch (error) {
    next(error)
  }
}

async function updateManagedInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const em = orm.em.fork();
    const institutionService = new InstitutionService(em, req.log);
    const userId = req.user?.id;
    if (!userId) {
      return HttpResponse.Unauthorized(res, { message: 'Debes estar autenticado.' });
    }
    const professor = await getProfessorFromUserId(em, userId);
    const updatedInstitution = await institutionService.updateManagedInstitution(professor.id!, req.body);
    return HttpResponse.Ok(res, updatedInstitution);
  } catch (error) {
    next(error);
  }
}

export {
  findAll,
  findAllAdmin,
  findOne,
  createByProfessor,
  update,
  remove,
  removeProfessor,
  getManagedInstitution,
  leaveInstitution,
  updateManagedInstitution,
}