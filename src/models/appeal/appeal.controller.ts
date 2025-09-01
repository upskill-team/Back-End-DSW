/**
 * @module AppealController
 * @description Handles HTTP requests for the Appeal module.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { AppealService } from './appeal.service.js'
import { HttpResponse } from '../../shared/response/http.response.js'

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork())
    const userId = req.user?.id
    if (!userId) {
      return HttpResponse.Unauthorized(res, 'User ID not found in token')
    }

    const documentPath = req.file?.path
    const appealData = req.body

    const newAppeal = await appealService.create(
      appealData,
      userId,
      documentPath
    )

    return HttpResponse.Created(res, newAppeal)
  } catch (error) {
    next(error)
  }
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork())
    const appeals = await appealService.findAll()
    return HttpResponse.Ok(res, appeals)
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork())
    const { id } = req.params
    const appeal = await appealService.findOne(id)

    if (!appeal) {
      return HttpResponse.NotFound(res, 'Appeal not found')
    }
    return HttpResponse.Ok(res, appeal)
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork())
    const { id } = req.params
    const updatedAppeal = await appealService.update(id, req.body)
    return HttpResponse.Ok(res, updatedAppeal)
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork())
    const { id } = req.params
    await appealService.remove(id)
    return HttpResponse.Ok(res, { message: 'Appeal deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, add, update, remove }
