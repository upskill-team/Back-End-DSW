import { EntityManager } from '@mikro-orm/core';
import { CourseType } from './courseType.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { CreateCourseType, UpdateCourseType } from './courseType.schemas.js';

export class CourseTypeService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  public async create(data: CreateCourseType): Promise<CourseType> {
    const courseType = this.em.create(CourseType, data);
    await this.em.flush();
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
    const objectId = new ObjectId(id);
    const courseType = this.em.getReference(CourseType, objectId);
    await this.em.removeAndFlush(courseType);
  }

  public async findAll(): Promise<CourseType[]> {
    return this.em.find(CourseType, {}, { populate: ['courses'] });
  }

  public async findOne(id: string): Promise<CourseType | null> {
    const objectId = new ObjectId(id);
    return this.em.findOne(CourseType, { _id: objectId }, { populate: ['courses'] });
  }
}