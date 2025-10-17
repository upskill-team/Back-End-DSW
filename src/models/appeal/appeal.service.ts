/**
 * @module Models/Appeal/Service
 * @remarks Encapsulates the business logic for managing professor appeals.
 */

import { EntityManager, FilterQuery } from '@mikro-orm/core'
import { Appeal } from './appeal.entity.js'
import { CreateAppealType, SearchAppealsQuery, UpdateAppealSchema, UpdateAppealType } from './appeal.schemas.js'
import { User } from '../user/user.entity.js'
import { ProfessorService } from '../professor/professor.services.js'
import { ObjectId } from '@mikro-orm/mongodb'
import { Logger } from 'pino'
import { safeParse } from 'valibot'

/**
 * Provides methods for CRUD operations on Appeal entities.
 * @class AppealService
 */
export class AppealService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'AppealService' } })
  }

  /**
   * Creates a new appeal for a user to become a professor.
   * @param {CreateAppealType} appealInput - The validated appeal data.
   * @param {string} userId - The ID of the user submitting the appeal.
   * @param {string} [documentPath] - The optional path to the uploaded CV document.
   * @returns {Promise<Appeal>} A promise that resolves to the newly created appeal.
   */
  public async create(
    appealInput: CreateAppealType,
    userId: string,
    documentPath?: string
  ): Promise<Appeal> {
    this.logger.info({ userId }, 'User is creating a new appeal.')

    const userObjectId = new ObjectId(userId)
    const existingAppeal = await this.em.findOne(Appeal, { user: userObjectId, state: 'pending' });
    const aceptedAppeal = await this.em.findOne(Appeal, { user: userObjectId, state: 'accepted' });
    if (aceptedAppeal) {
      this.logger.warn({ userId }, 'Attempted to create a new appeal but user is already a professor.');
      throw new Error('User is already a professor.');
    }

    if (existingAppeal) {
      this.logger.warn({ userId }, 'Attempted to create a new appeal while another is active.');
      throw new Error('User already has an active appeal.');
    }
    const userReference = this.em.getReference(User, userObjectId)

    const appeal = this.em.create(Appeal, {
      ...appealInput,
      date: new Date(),
      state: 'pending',
      user: userReference,
      documentUrl: documentPath,
    })

    await this.em.flush()

    this.logger.info({ appealId: appeal.id, userId }, 'Appeal created successfully.')

    return appeal
  }

  /**
   * Retrieves all appeals based on filter, sort, and pagination parameters.
   * @param {SearchAppealsQuery} query - The validated query parameters.
   * @returns {Promise<{appeals: Appeal[], total: number}>} An object with the list of appeals and the total count.
   */
  public async findAll(query: SearchAppealsQuery): Promise<{ appeals: Appeal[], total: number }> {
    this.logger.info({ query }, 'Fetching all appeals with filters.');

    const where: FilterQuery<Appeal> = {};

    if (query.status) {
      where.state = query.status;
    }

    if (query.q) {
      const searchQuery = new RegExp(query.q, 'i');
      
      const matchingUsers = await this.em.find(User, {
        $or: [
          { name: searchQuery },
          { surname: searchQuery }
        ],
      });

      if (matchingUsers.length === 0) {
        return { appeals: [], total: 0 };
      }

      const userIds = matchingUsers.map(user => user._id!);
      where.user = { $in: userIds };
    }

    const [appeals, total] = await this.em.findAndCount(Appeal, where, {
      populate: ['user'],
      orderBy: { [query.sortBy]: query.sortOrder },
      limit: query.limit,
      offset: query.offset,
    });

    return { appeals, total };
  }

  /**
   * Retrieves a single appeal by its ID.
   * @param {string} id - The ID of the appeal to find.
   * @returns {Promise<Appeal | null>} A promise that resolves to the appeal or null if not found.
   */
  public async findOne(id: string): Promise<Appeal | null> {
    this.logger.info({ appealId: id }, 'Fetching appeal.')
    const objectId = new ObjectId(id);
    return this.em.findOne(Appeal, { _id: objectId }, { populate: ['user'] })
  }

  /**
   * Updates an appeal's state. If the state is changed to 'accepted', it also promotes the user to a professor.
   * @param {string} id - The ID of the appeal to update.
   * @param {UpdateAppealType} data - The data for updating the appeal (e.g., the new state).
   * @returns {Promise<Appeal>} A promise that resolves to the updated appeal.
   * @throws {Error} If validation fails or the appeal is not found.
   */
  public async update(
    id: string,
    data: UpdateAppealType
  ): Promise<Appeal> {
    this.logger.info({ appealId: id, data: data }, 'Updating appeal.')

    const result = safeParse(UpdateAppealSchema, data)
      if (!result.success) {
        this.logger.error({ issues: result.issues }, 'Validation failed for appeal update.')
        throw new Error('Invalid data for appeal update.')
      }

    const objectId = new ObjectId(id)
    const appeal = await this.em.findOneOrFail(Appeal, { _id: objectId }, {populate: ['user']})
    this.em.assign(appeal, data);

    if (data.state === 'accepted' && appeal.user) {
      const professorService = new ProfessorService(this.em, this.logger)
      professorService.createFromUser(appeal.user)
    } else if (data.state === 'rejected') {
      this.logger.info({ appealId: id, userId: appeal.user.id }, 'Appeal rejected.')
    }

    await this.em.flush()

    this.logger.info({ appealId: id }, 'Appeal updated successfully.')

    return appeal
  }

  /**
   * Deletes an appeal from the database.
   * @param {string} id - The ID of the appeal to remove.
   * @returns {Promise<void>} A promise that resolves when the appeal has been deleted.
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ appealId: id }, 'Deleting appeal.')

    const objectId = new ObjectId(id);
    const appeal = this.em.getReference(Appeal, objectId);
    await this.em.removeAndFlush(appeal);

    this.logger.info({ appealId: id }, 'Appeal deleted successfully.')
  }
}
