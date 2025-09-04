/**
 * @module Models/CourseType/Service
 * @remarks Encapsulates the business logic for managing course types.
 */

import { EntityManager } from '@mikro-orm/core';
import { CourseType } from './courseType.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { safeParse } from 'valibot';
import { CreateCourseType, UpdateCourseType, UpdateCourseTypeSchema } from './courseType.schemas.js';
import { Logger } from 'pino';

/**
 * Provides methods for CRUD operations on CourseType entities.
 * @class CourseTypeService
 */
export class CourseTypeService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'CourseTypeService' } });
  }

   /**
   * Creates a new course type.
   * @param {CreateCourseType} data - The validated data for the new course type.
   * @returns {Promise<CourseType>} A promise that resolves to the newly created course type.
   */
  public async create(data: CreateCourseType): Promise<CourseType> {
    this.logger.info({ name: data.name }, 'Creating new course type.');

    const courseType = this.em.create(CourseType, data);
    await this.em.flush();

    this.logger.info({ courseTypeId: courseType.id }, 'Course type created successfully.');

    return courseType;
  }

  /**
   * Updates an existing course type.
   * @param {string} id - The ID of the course type to update.
   * @param {UpdateCourseType} data - The data for updating the course type.
   * @returns {Promise<CourseType>} A promise that resolves to the updated course type.
   * @throws {Error} If validation fails or the course type is not found.
   */
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

  /**
   * Deletes a course type by its ID.
   * @param {string} id - The ID of the course type to remove.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ courseTypeId: id }, 'Deleting course type.')

    const objectId = new ObjectId(id)
    const courseType = this.em.getReference(CourseType, objectId)
    await this.em.removeAndFlush(courseType)

    this.logger.info({ courseTypeId: id }, 'Course type deleted successfully.')
  }

  /**
   * Retrieves all course types from the database.
   * @returns {Promise<CourseType[]>} A promise that resolves to an array of all course types.
   */
  public async findAll(): Promise<CourseType[]> {
    this.logger.info('Fetching all course types.')

    return this.em.find(CourseType, {}, { populate: ['courses'] })
  }

  /**
   * Retrieves a single course type by its ID.
   * @param {string} id - The ID of the course type to find.
   * @returns {Promise<CourseType | null>} A promise that resolves to the course type or null if not found.
   */
  public async findOne(id: string): Promise<CourseType | null> {
    this.logger.info({ courseTypeId: id }, 'Fetching course type.')

    const objectId = new ObjectId(id)
    return this.em.findOneOrFail(CourseType, { _id: objectId }, { populate: ['courses'] })
  }
}