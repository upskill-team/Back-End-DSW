import { EntityManager } from '@mikro-orm/core';
import { CourseType } from './courseType.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { CreateCourseType, UpdateCourseType } from './courseType.schemas.js';
import { Logger } from 'pino';

export class CourseTypeService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'CourseTypeService' } });
  }

  public async create(data: CreateCourseType): Promise<CourseType> {
    this.logger.info({ name: data.name }, 'Creating new course type.');

    const courseType = this.em.create(CourseType, data);
    await this.em.flush();

    this.logger.info({ courseTypeId: courseType.id }, 'Course type created successfully.');

    return courseType;
  }

  public async update(id: string, data: UpdateCourseType): Promise<CourseType> {
    const objectId = new ObjectId(id);
    const courseType = await this.em.findOneOrFail(CourseType, { _id: objectId });
    this.em.assign(courseType, data);
    await this.em.flush();
    return courseType;
  }

  public async remove(id: string): Promise<void> {
    this.logger.info({ courseTypeId: id }, 'Deleting institution.')

    const objectId = new ObjectId(id)
    const courseType = this.em.getReference(CourseType, objectId)
    await this.em.removeAndFlush(courseType)

    this.logger.info({ courseTypeId: id }, 'Course type deleted successfully.')
  }

  public async findAll(): Promise<CourseType[]> {
    this.logger.info('Fetching all course types.')

    return this.em.find(CourseType, {}, { populate: ['courses'] })
  }

  public async findOne(id: string): Promise<CourseType | null> {
    const objectId = new ObjectId(id)
    return this.em.findOne(CourseType, { _id: objectId }, { populate: ['courses'] })
  }
}