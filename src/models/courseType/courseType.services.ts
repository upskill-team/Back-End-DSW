import { EntityManager } from '@mikro-orm/core';
import { CourseType } from './courseType.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { safeParse } from 'valibot';
import { CreateCourseType, UpdateCourseType, UpdateCourseTypeSchema } from './courseType.schemas.js';
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
    this.logger.info({ courseTypeId: id, data }, 'Updating course type.')

    const result = safeParse(UpdateCourseTypeSchema, data)
      if (!result.success) {
        this.logger.error({ issues: result.issues }, 'Validation failed for course type update.')
        throw new Error('Invalid data for course type update.')
      }

    const objectId = new ObjectId(id)
    const courseType = await this.em.findOneOrFail(CourseType, { _id: objectId })
    this.em.assign(courseType, data)
    await this.em.flush()
    
    this.logger.info({ courseTypeId: id }, 'Course type updated successfully.')

    return courseType
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
    this.logger.info({ courseTypeId: id }, 'Fetching course type.')

    const objectId = new ObjectId(id)
    return this.em.findOneOrFail(CourseType, { _id: objectId }, { populate: ['courses'] })
  }
}