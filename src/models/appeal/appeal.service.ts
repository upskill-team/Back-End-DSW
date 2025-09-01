import { EntityManager } from '@mikro-orm/core'
import { Appeal } from './appeal.entity.js'
import { CreateAppealType } from './appeal.schemas.js'
import { User } from '../user/user.entity.js'
import { ProfessorService } from '../professor/professor.services.js'
import { ObjectId } from '@mikro-orm/mongodb'

export class AppealService {
  private em: EntityManager

  constructor(em: EntityManager) {
    this.em = em
  }

  public async create(
    appealInput: CreateAppealType,
    userId: string,
    documentPath?: string
  ): Promise<Appeal> {
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

    return appeal
  }

  public async findAll(): Promise<Appeal[]> {
    return this.em.find(Appeal, {}, { populate: ['user'] })
  }

  public async findOne(id: string): Promise<Appeal | null> {
    return this.em.findOne(Appeal, { id }, { populate: ['user'] })
  }

  public async update(
    id: string,
    appealData: Partial<Appeal>
  ): Promise<Appeal> {
    const objectId = new ObjectId(id)
    const appeal = await this.em.findOneOrFail(Appeal, { _id: objectId }, {populate: ['user']})
    this.em.assign(appeal, appealData)

    if (appealData.state === 'accepted' && appeal.user) {
      const professorService = new ProfessorService(this.em)
      professorService.createFromUser(appeal.user)
    }

    await this.em.flush()
    return appeal
  }

  public async remove(id: string): Promise<void> {
    const appeal = this.em.getReference(Appeal, id)
    await this.em.removeAndFlush(appeal)
  }
}
