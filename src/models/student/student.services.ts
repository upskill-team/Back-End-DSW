import { EntityManager } from "@mikro-orm/core"
import { Student } from "./student.entity.js"
import { Logger } from "pino";

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

    return this.em.findOneOrFail(Student, { id }, { populate: ['courses'] })
  }

  public async update(id: string, studentData: Partial<Student>): Promise<Student> {
    this.logger.info({ studentId: id, data: studentData }, 'Updating student.')

    const student = await this.em.findOneOrFail(Student, { id })
    this.em.assign(student, studentData);
    await this.em.flush()

    this.logger.info({ studentId: id }, 'Student updated successfully.')

    return student;
  }

  public async remove(id: string): Promise<Student> {
    this.logger.info({ studentId: id }, 'Deleting student.')
    
    const student = this.em.getReference(Student, id)
    await this.em.removeAndFlush(student);
    return student
  }
}