import { EntityManager } from "@mikro-orm/core";
import { Student } from "./student.entity.js";

export class StudentService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  public async findAll(): Promise<Student[]> {
    return this.em.find(Student, {}, { populate: ['courses'] });
  }

  public async findOne(id: string): Promise<Student> {
    return this.em.findOneOrFail(Student, { id }, { populate: ['courses'] });
  }

  public async update(id: string, studentData: Partial<Student>): Promise<Student> {
    const student = await this.em.findOneOrFail(Student, { id });
    this.em.assign(student, studentData);
    await this.em.flush();
    return student;
  }

  public async remove(id: string): Promise<Student> {
    const student = this.em.getReference(Student, id);
    await this.em.removeAndFlush(student);
    return student;
  }
}