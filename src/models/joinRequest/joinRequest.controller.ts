/**
 * @module Models/JoinRequest/Controller
 * @remarks Handles HTTP requests for the JoinRequest module.
 */
import { NextFunction, Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { JoinRequestService } from './joinRequest.services.js';
import { getProfessorFromUserId } from '../../shared/utils/professor.helper.js';

/**
 * Handles the creation of a new join request by a professor.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new JoinRequestService(orm.em.fork(), req.log);
    const professor = await getProfessorFromUserId(orm.em.fork(), req.user!.id);
    const { institutionId } = req.body;

    const newRequest = await service.create(professor.id!, institutionId);
    return HttpResponse.Created(res, newRequest);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles fetching all pending join requests for an institution. (Manager only)
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
async function findPendingForInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new JoinRequestService(orm.em.fork(), req.log);
    const manager = await getProfessorFromUserId(orm.em.fork(), req.user!.id);
    const { institutionId } = req.params;

    const requests = await service.findPendingForInstitution(institutionId, manager.id!);
    return HttpResponse.Ok(res, requests);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles processing a join request (accept/reject). (Manager only)
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
async function processRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new JoinRequestService(orm.em.fork(), req.log);
    const manager = await getProfessorFromUserId(orm.em.fork(), req.user!.id);
    const { requestId } = req.params;
    const { action } = req.body;

    const processedRequest = await service.processRequest(requestId, action, manager.id!);
    return HttpResponse.Ok(res, processedRequest);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles fetching the current professor's own pending join request.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
async function findMyPendingRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new JoinRequestService(orm.em.fork(), req.log);
    const professor = await getProfessorFromUserId(orm.em.fork(), req.user!.id);

    const request = await service.findMyPendingRequest(professor.id!);
    return HttpResponse.Ok(res, request);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the cancellation of a join request by the professor who created it.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
async function cancelRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new JoinRequestService(orm.em.fork(), req.log);
    const professor = await getProfessorFromUserId(orm.em.fork(), req.user!.id);
    const { requestId } = req.params;

    await service.cancelRequest(requestId, professor.id!);
    return HttpResponse.Ok(res, { message: 'Request cancelled successfully.' });
  } catch (error) {
    next(error);
  }
}

export { create, findPendingForInstitution, processRequest, findMyPendingRequest, cancelRequest };