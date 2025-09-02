import { EntityManager } from '@mikro-orm/core'
import { Appeal } from './appeal.entity.js'
import { CreateAppealType, UpdateAppealSchema, UpdateAppealType } from './appeal.schemas.js'
import { User } from '../user/user.entity.js'
import { ProfessorService } from '../professor/professor.services.js'
import { ObjectId } from '@mikro-orm/mongodb'
import { Logger } from 'pino'
import { safeParse } from 'valibot'

export class AppealService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'AppealService' } })
  }

  public async create(
    appealInput: CreateAppealType,
    userId: string,
    documentPath?: string
  ): Promise<Appeal> {
    this.logger.info({ userId }, 'User is creating a new appeal.')

    const userObjectId = new ObjectId(userId)
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

  public async findAll(): Promise<Appeal[]> {
    this.logger.info('Fetching all appeals.')

    return this.em.find(Appeal, {}, { populate: ['user'] })
  }

  public async findOne(id: string): Promise<Appeal | null> {
    this.logger.info({ appealId: id }, 'Fetching appeal.')

    const objectId = new ObjectId(id);
    return this.em.findOne(Appeal, { _id: objectId }, { populate: ['user'] })
  }

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

  public async remove(id: string): Promise<void> {
    this.logger.info({ appealId: id }, 'Deleting appeal.')

    const objectId = new ObjectId(id);
    const appeal = this.em.getReference(Appeal, objectId);
    await this.em.removeAndFlush(appeal);

    this.logger.info({ appealId: id }, 'Appeal deleted successfully.')
  }
}
