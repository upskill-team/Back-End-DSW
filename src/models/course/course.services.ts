/**
 * @module Models/Course/Service
 * @remarks Encapsulates the business logic for managing courses.
 */

import { EntityManager } from '@mikro-orm/core'
import { Course } from './course.entity.js'
import { CreateCourseType, UpdateCourseSchema, UpdateCourseType } from './course.schemas.js'
import { Professor } from '../professor/professor.entity.js'
import { CourseType } from '../courseType/courseType.entity.js'
import { Logger } from 'pino'
import { ObjectId } from '@mikro-orm/mongodb'
import { safeParse } from 'valibot'
import { User } from '../user/user.entity.js'

/**
 * Provides methods for CRUD operations on Course entities.
 * @class CourseService
 */
export class CourseService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'CourseService' } })
  }

  /**
   * Creates a new course.
   * @param {CreateCourseType} courseData - The validated data for the new course.
   * @param {string} professorId - The ID of the professor creating the course.
   * @returns {Promise<Course>} A promise that resolves to the newly created course.
   */
  public async create(
    courseData: CreateCourseType,
    professorId: string
  ): Promise<Course> {
    this.logger.info({ name: courseData.name }, 'Creating new course.')

    const { courseTypeId, units, ...topLevelData } = courseData

    // Create the course entity. It's important to provide default values for properties
    // like 'isFree' and 'units' here to satisfy TypeScript's strict type check,
    // as it doesn't infer the defaults from the class definition in this context.
    const course = this.em.create(Course, {
      ...topLevelData,
      isFree: topLevelData.isFree ?? true,
      units: [], // Start with an empty array. We'll assign the real units below if they exist.
      courseType: this.em.getReference(CourseType, courseTypeId),
      professor: this.em.getReference(Professor, professorId),
    })

    // If the payload includes units, we use `em.assign`. This is the best way to handle
    // nested embeddable data, as it correctly converts the plain objects from the
    // validated payload into the required Embeddable class instances (Unit, Material, etc.).
    if (units && units.length > 0) {
      this.em.assign(course, { units })
    }

    await this.em.flush()

    this.logger.info({ courseId: course.id }, 'Course created successfully.')

    return course
  }

  /**
   * Retrieves all courses from the database.
   * @returns {Promise<Course[]>} A promise that resolves to an array of all courses.
   */
  public async findAll(): Promise<Course[]> {
    this.logger.info('Fetching all courses.')

    return this.em.find(
      Course,
      {},
      {
        populate: ['courseType', 'professor'],
      }
    )
  }

  /**
   * Retrieves a single course by its ID.
   * @param {string} id - The ID of the course to find.
   * @returns {Promise<Course>} A promise that resolves to the found course.
   * @throws {NotFoundError} If no course with the given ID is found.
   */
  public async findOne(id: string): Promise<Course> {
    this.logger.info({ courseId: id }, 'Fetching course.')

    const objectId = new ObjectId(id)
    return this.em.findOneOrFail(
      Course,
      { _id: objectId },
      {
        populate: ['courseType', 'professor'],
      }
    );
  }

  /**
   * Updates an existing course.
   * @param {string} id - The ID of the course to update.
   * @param {UpdateCourseType} data - An object containing the fields to update.
   * @returns {Promise<Course>} A promise that resolves to the updated course entity.
   * @throws {Error} If validation fails or the course is not found.
   */
  public async update(
    id: string,
    data: UpdateCourseType
  ): Promise<Course> {
    this.logger.info({ courseId: id, data: data }, 'Updating course.')

    const result = safeParse(UpdateCourseSchema, data)
      if (!result.success) {
        this.logger.error({ issues: result.issues }, 'Validation failed for course update.')
        throw new Error('Invalid data for course update.')
      }

    const objectId = new ObjectId(id)
    const course = await this.em.findOneOrFail(Course, { _id: objectId });
    this.em.assign(course, data);
    await this.em.flush();

    this.logger.info({ courseId: id }, 'Course updated successfully.')

    return course;
  }

  /**
   * Deletes a course from the database.
   * @param {string} id - The ID of the course to remove.
   * @returns {Promise<void>} A promise that resolves when the course is deleted.
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ courseId: id }, 'Deleting course.')

    const objectId = new ObjectId(id)
    const courseRef = this.em.getReference(Course, objectId)
    await this.em.removeAndFlush(courseRef)

    this.logger.info({ courseId: id }, 'Course deleted successfully.')
  }

  /**
   * Retrieves all courses for a user, ensuring they have a professor profile.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Course[]>} A promise that resolves to an array of courses.
   * @throws {Error} If the user is not found or is not a professor.
   */
  public async findByAuthenticatedProfessor(userId: string): Promise<Course[]> {
    this.logger.info({ userId }, "Fetching courses for an authenticated professor.")

    const userObjectId = new ObjectId(userId)

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ['professorProfile'] }
    );
    
    if (!user || !user.professorProfile) {
      throw new Error('User is not a professor');
    }

    const professorId = user.professorProfile.id;

    return this.em.find(
      Course,
      { professor: professorId },
      { populate: ['courseType', 'professor'] }
    );
  }
}