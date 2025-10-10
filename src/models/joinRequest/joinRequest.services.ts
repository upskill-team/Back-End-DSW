/**
 * @module Models/JoinRequest/Service
 * @remarks Manages the business logic for institution join requests.
 */
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Logger } from 'pino';
import { JoinRequest, JoinRequestStatus } from './joinRequest.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Institution } from '../institution/institution.entity.js';
import { InstitutionService } from '../institution/institution.services.js';

/**
 * Provides methods for handling the lifecycle of a join request.
 * @class JoinRequestService
 */
export class JoinRequestService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'JoinRequestService' } });
  }

  /**
   * Creates a new request for a professor to join an institution.
   * @param {string} professorId - The ID of the professor making the request.
   * @param {string} institutionId - The ID of the institution to join.
   * @returns {Promise<JoinRequest>} The newly created join request.
   * @throws {Error} If the professor is already in an institution or has a pending request.
   */
  public async create(professorId: string, institutionId: string): Promise<JoinRequest> {
    this.logger.info({ professorId, institutionId }, 'Creating new join request.');

    const professor = await this.em.findOneOrFail(Professor, { _id: new ObjectId(professorId) }, { populate: ['institution'] });
    const institution = await this.em.findOneOrFail(Institution, { _id: new ObjectId(institutionId) });

    if (professor.institution) {
      throw new Error('You already belong to an institution. You must leave it first.');
    }

    const existingRequest = await this.em.findOne(JoinRequest, {
      professor: professor.id,
      status: JoinRequestStatus.PENDING,
    });

    if (existingRequest) {
      const requestedInst = await this.em.findOne(Institution, { id: existingRequest.institution.id });
      throw new Error(`You already have a pending request to join "${requestedInst?.name}". You cannot create another one.`);
    }

    const joinRequest = new JoinRequest();
    this.em.assign(joinRequest, { professor, institution });
    
    await this.em.persistAndFlush(joinRequest);

    this.logger.info({ requestId: joinRequest.id }, 'Join request created successfully.');
    return joinRequest;
  }

  /**
   * Finds all pending join requests for a specific institution.
   * @param {string} institutionId - The ID of the institution.
   * @param {string} managerId - The ID of the professor making the query, to verify they are the manager.
   * @returns {Promise<JoinRequest[]>} A list of pending join requests.
   * @throws {Error} If the requester is not the manager of the institution.
   */
  public async findPendingForInstitution(institutionId: string, managerId: string): Promise<JoinRequest[]> {
    this.logger.info({ institutionId, managerId }, 'Fetching pending requests for institution.');

    const institution = await this.em.findOneOrFail(Institution, { _id: new ObjectId(institutionId) }, { populate: ['manager'] });

    if (institution.manager.id !== managerId) {
      throw new Error('Only the institution manager can view pending requests.');
    }
    
    return this.em.find(JoinRequest, 
      { institution: new ObjectId(institutionId), status: JoinRequestStatus.PENDING },
      { populate: ['professor.user'] }
    );
  }

  /**
   * Processes a join request by accepting or rejecting it.
   * @param {string} requestId - The ID of the join request to process.
   * @param {'accept' | 'reject'} action - The action to perform.
   * @param {string} managerId - The ID of the manager performing the action.
   * @returns {Promise<JoinRequest>} The updated join request.
   * @throws {Error} If the requester is not the manager or the request is not pending.
   */
  public async processRequest(requestId: string, action: 'accept' | 'reject', managerId: string): Promise<JoinRequest> {
    this.logger.info({ requestId, action, managerId }, 'Processing join request.');

    const request = await this.em.findOneOrFail(JoinRequest, { _id: new ObjectId(requestId) }, { populate: ['professor', 'institution.manager'] });

    if (request.institution.manager.id !== managerId) {
      throw new Error('Only the institution manager can process this request.');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new Error(`This request has already been '${request.status}'.`);
    }

    if (action === 'accept') {
      await this.em.populate(request.professor, ['institution']);
      if (request.professor.institution) {
        request.status = JoinRequestStatus.REJECTED;
        await this.em.flush();
        throw new Error('Cannot accept: this professor has already joined another institution.');
      }

      const institutionService = new InstitutionService(this.em.fork(), this.logger);
      await institutionService.addProfessor(request.institution.id!, request.professor.id!, managerId);
      request.status = JoinRequestStatus.ACCEPTED;
    } else {
      request.status = JoinRequestStatus.REJECTED;
    }

    await this.em.flush();

    this.logger.info({ requestId, newStatus: request.status }, 'Join request processed successfully.');
    return request;
  }

  /**
   * Finds the pending join request for a specific professor.
   * @param {string} professorId - The ID of the professor.
   * @returns {Promise<JoinRequest | null>} The pending request, or null if none exists.
   */
  public async findMyPendingRequest(professorId: string): Promise<JoinRequest | null> {
    this.logger.info({ professorId }, 'Fetching own pending request for professor.');
    
    return this.em.findOne(JoinRequest, 
      { 
        professor: new ObjectId(professorId), 
        status: JoinRequestStatus.PENDING 
      },
      { populate: ['institution'] }
    );
  }

  /**
   * Cancels a join request. Only the professor who created it can cancel it.
   * @param {string} requestId - The ID of the request to cancel.
   * @param {string} professorId - The ID of the professor attempting the cancellation.
   * @returns {Promise<void>}
   * @throws {Error} If the request is not found, not pending, or does not belong to the professor.
   */
  public async cancelRequest(requestId: string, professorId: string): Promise<void> {
    this.logger.warn({ requestId, professorId }, 'Attempting to cancel join request.');

    const request = await this.em.findOneOrFail(JoinRequest, { _id: new ObjectId(requestId) }, { populate: ['professor'] });

    if (request.professor.id !== professorId) {
      throw new Error('You can only cancel your own requests.');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new Error('You can only cancel a pending request.');
    }

    await this.em.removeAndFlush(request);
    this.logger.info({ requestId }, 'Request cancelled successfully.');
  }
}