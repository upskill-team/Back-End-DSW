import { EntityManager } from "@mikro-orm/core"
import { Student } from "./student.entity.js"
import { Logger } from "pino";
import { ObjectId } from "@mikro-orm/mongodb";
import { safeParse } from "valibot";
import { UpdateStudentSchema, UpdateStudentType } from "./student.schemas.js";

export class StudentService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'StudentService' } })
  }

  public async findAll(): Promise<Student[]> {
    this.logger.info('Fetching all students.')

    return this.em.find(Student, {}, { populate: ['courses'] })
  }

  public async findOne(id: string): Promise<Student> {
    this.logger.info({ studentId: id }, 'Fetching student.')

    const objectId = new ObjectId(id)
    return this.em.findOneOrFail(Student, { _id: objectId }, { populate: ['courses'] })
  }

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

  public async remove(id: string): Promise<void> {
    this.logger.info({ studentId: id }, 'Deleting student.')
    
    const objectId = new ObjectId(id)
    const student = this.em.getReference(Student, objectId)
    await this.em.removeAndFlush(student)
    
    this.logger.info({ studentId: id }, 'Student deleted successfully.')
  }
}