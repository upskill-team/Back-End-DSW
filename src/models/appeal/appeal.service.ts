import { EntityManager } from '@mikro-orm/core'
import { Appeal } from './appeal.entity.js'
import { CreateAppealType } from './appeal.schemas.js'
import { User, UserRole } from '../user/user.entity.js'
import { Professor } from '../professor/professor.entity.js'
import { ObjectId } from '@mikro-orm/mongodb'
import { Logger } from 'pino'

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
    return this.em.find(Appeal, {}, { populate: ['user'] })
  }

  public async findOne(id: string): Promise<Appeal | null> {
    this.logger.info('Fetching all appeals.')

    return this.em.findOne(Appeal, { id }, { populate: ['user'] })
  }

  public async update(
    id: string,
    appealData: Partial<Appeal>
  ): Promise<Appeal> {
    this.logger.info({ appealId: id, data: appealData }, 'Updating appeal.')

    const objectId = new ObjectId(id);
    const appeal = await this.em.findOneOrFail(Appeal, { _id: objectId }, {populate: ['user']})
    this.em.assign(appeal, appealData);

    if (appealData.state === 'accepted' && appeal.user) {
      const userToPromote = appeal.user;
      userToPromote.role = UserRole.PROFESSOR
      const newProfessorProfile = this.em.create(Professor, {
        user: userToPromote,
        state: 'active', 
      });
      userToPromote.professorProfile = newProfessorProfile
      this.em.persist(newProfessorProfile)
    } else if (appealData.state === 'rejected') {
      this.logger.info({ appealId: id, userId: appeal.user.id }, 'Appeal rejected.')
    }

    await this.em.flush()

    this.logger.info({ appealId: id }, 'Appeal updated successfully.')

    return appeal
  }

  public async remove(id: string): Promise<void> {
    this.logger.info({ appealId: id }, 'Deleting appeal.')

    const appeal = this.em.getReference(Appeal, id);
    await this.em.removeAndFlush(appeal);

    this.logger.info({ appealId: id }, 'Appeal deleted successfully.')
  }
}
