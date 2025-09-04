/**
 * @module Models/Student/Service
 * @remarks Encapsulates the business logic for managing student profiles.
 */

import { EntityManager } from "@mikro-orm/core"
import { Student } from "./student.entity.js"
import { Logger } from "pino";
import { ObjectId } from "@mikro-orm/mongodb";
import { safeParse } from "valibot";
import { UpdateStudentSchema, UpdateStudentType } from "./student.schemas.js";

/**
 * Provides methods for CRUD operations on Student entities.
 * @class StudentService
 */
export class StudentService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'StudentService' } })
  }

   /**
   * Retrieves all student profiles from the database.
   * @returns {Promise<Student[]>} A promise that resolves to an array of all students.
   */
  public async findAll(): Promise<Student[]> {
    this.logger.info('Fetching all students.')

    return this.em.find(Student, {}, { populate: ['courses'] })
  }

  /**
   * Retrieves a single student profile by its ID.
   * @param {string} id - The ID of the student to find.
   * @returns {Promise<Student>} A promise that resolves to the found student.
   * @throws {NotFoundError} If no student with the given ID is found.
   */
  public async findOne(id: string): Promise<Student> {
    this.logger.info({ studentId: id }, 'Fetching student.')

    const objectId = new ObjectId(id)
    return this.em.findOneOrFail(Student, { _id: objectId }, { populate: ['courses'] })
  }

  /**
   * Updates an existing student's profile data.
   * @param {string} id - The ID of the student to update.
   * @param {UpdateStudentType} data - An object containing the fields to update.
   * @returns {Promise<Student>} A promise that resolves to the updated student entity.
   * @throws {Error} If validation fails or the student is not found.
   */
  public async update(id: string, data: UpdateStudentType): Promise<Student> {
    this.logger.info({ studentId: id, data: data }, 'Updating student.')

    const result = safeParse(UpdateStudentSchema, data)
      if (!result.success) {
        this.logger.error({ issues: result.issues }, 'Validation failed for student update.')
        throw new Error('Invalid data for student update.')
      }

    const objectId = new ObjectId(id)
    const student = await this.em.findOneOrFail(Student, { _id: objectId })
    this.em.assign(student, result.output as Partial<Student>)
    await this.em.flush()

    this.logger.info({ studentId: id }, 'Student updated successfully.')

    return student
  }

  /**
   * Deletes a student's profile from the database.
   * @param {string} id - The ID of the student to remove.
   * @returns {Promise<void>} A promise that resolves when the profile is deleted.
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ studentId: id }, 'Deleting student.')
    
    const objectId = new ObjectId(id)
    const student = this.em.getReference(Student, objectId)
    await this.em.removeAndFlush(student)
    
    this.logger.info({ studentId: id }, 'Student deleted successfully.')
  }
}