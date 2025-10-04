/**
 * @module Models/Appeal/Controller
 * @remarks Handles HTTP requests for the Appeal module.
 * @see {@link AppealService} for business logic.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { AppealService } from './appeal.service.js'
import { HttpResponse } from '../../shared/response/http.response.js'
import * as v from 'valibot'
import { SearchAppealsSchema } from './appeal.schemas.js'

/**
 * Handles the creation of a new appeal.
 * @param {Request} req The Express request object, containing appeal data in the body and user ID from auth middleware.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The created appeal data.
 */
async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork(), req.log)
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

/**
 * Handles the retrieval of all appeals with filtering, sorting, and pagination.
 * @param {Request} req The Express request object, containing query parameters.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A paginated list of appeals.
 */
async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedQuery = v.parse(SearchAppealsSchema, req.query);
    
    const appealService = new AppealService(orm.em.fork(), req.log)
    const result = await appealService.findAll(validatedQuery)
    
    return HttpResponse.Ok(res, result)

  } catch (error) {
    if (error instanceof v.ValiError) {
      const errorDetails = error.issues.map(issue => ({
        field: issue.path?.map((p: { key: any; }) => p.key).join('.'),
        message: issue.message,
      }));
      return HttpResponse.BadRequest(res, {
        message: 'Parámetros de consulta inválidos.',
        errors: errorDetails,
      });
    }
    next(error)
  }
}

/**
 * Handles the retrieval of a single appeal by its ID.
 * @param {Request} req The Express request object, containing the appeal ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The requested appeal data.
 */
async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork(), req.log)
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

/**
 * Handles the update of an appeal's state.
 * @param {Request} req The Express request object, containing the appeal ID in params and update data in the body.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The updated appeal data.
 */
async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork(), req.log)
    const { id } = req.params
    const updatedAppeal = await appealService.update(id, req.body)
    return HttpResponse.Ok(res, updatedAppeal)
  } catch (error) {
    next(error)
  }
}

/**
 * Handles the deletion of an appeal.
 * @param {Request} req The Express request object, containing the appeal ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A confirmation message.
 */
async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const appealService = new AppealService(orm.em.fork(), req.log)
    const { id } = req.params
    await appealService.remove(id)
    return HttpResponse.Ok(res, { message: 'Appeal deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, add, update, remove }
