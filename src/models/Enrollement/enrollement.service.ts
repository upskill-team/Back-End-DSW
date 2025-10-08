/**
 * @module Models/Enrollement/Service
 * @remarks Encapsulates the business logic for managing enrollements.
 */

import { EntityManager } from '@mikro-orm/core';
import { Enrollement, EnrollmentState } from './enrollement.entity.js';
import { Student } from '../student/student.entity.js';
import { Course } from '../course/course.entity.js';

export class EnrollementService {
  constructor(private readonly em: EntityManager) {}

  async create({
    studentId,
    courseId,
    state,
    grade,
    progress,
  }: {
    studentId: string;
    courseId: string;
    state?: EnrollmentState;
    grade?: number;
    progress?: number;
  }): Promise<Enrollement> {
    return await this.em.transactional(async (em) => {
      const student = await em.findOne(Student, { id: studentId });
      if (!student) throw new Error('Student not found');

      const course = await em.findOne(Course, { id: courseId });
      if (!course) throw new Error('Course not found');

      const already = await em.findOne(Enrollement, { student, course });
      if (already) throw new Error('Enrollment already exists');

      const enrol = new Enrollement();
      enrol.student = student;
      enrol.course = course;
      if (state) enrol.state = state;
      if (grade !== undefined) enrol.grade = grade;
      enrol.progress = progress !== undefined ? Math.max(0, Math.min(100, progress)) : 0;

      // persist enrollement
      await em.persistAndFlush(enrol);

      // keep many-to-many collection in sync: add course to student.courses
      // (Student is the owner of the relation)
      student.courses.add(course);
      await em.persistAndFlush(student);

      return enrol;
    });
  }

  async findAll(): Promise<Enrollement[]> {
    return this.em.find(Enrollement, {}, { populate: ['student', 'course'] });
  }

  async findById(id: string): Promise<Enrollement | null> {
    return this.em.findOne(Enrollement, { id }, { populate: ['student', 'course'] });
  }

  async findByStudent(studentId: string): Promise<Enrollement[]> {
    return this.em.find(
      Enrollement,
      { student: studentId },
      { populate: ['student', 'course'] },
    );
  }

  async findByCourse(courseId: string): Promise<Enrollement[]> {
    return this.em.find(
      Enrollement,
      { course: courseId },
      { populate: ['student', 'course'] },
    );
  }

  async update(
    id: string,
    data: Partial<{ state: EnrollmentState; grade?: number; progress?: number }>,
  ): Promise<Enrollement> {
    return await this.em.transactional(async (em) => {
      const enrol = await em.findOne(Enrollement, { id }, { populate: ['student', 'course'] });
      if (!enrol) throw new Error('Enrollment not found');

      if (data.state !== undefined) {
        enrol.state = data.state;
        // if dropped -> remove course from student's courses collection
        if (data.state === EnrollmentState.DROPPED) {
          enrol.student.courses.remove(enrol.course as Course);
        }
        // if completed -> ensure progress 100
        if (data.state === EnrollmentState.COMPLETED) {
          enrol.progress = 100;
        }
      }

      if (data.grade !== undefined) enrol.grade = data.grade;
      if (data.progress !== undefined) enrol.progress = Math.max(0, Math.min(100, data.progress));

      await em.persistAndFlush(enrol);
      // persist student changes if any (e.g. removal from collection)
      await em.persistAndFlush(enrol.student);

      return enrol;
    });
  }

  async remove(id: string): Promise<void> {
    return await this.em.transactional(async (em) => {
      const enrol = await em.findOne(Enrollement, { id }, { populate: ['student', 'course'] });
      if (!enrol) throw new Error('Enrollment not found');

      // remove association from student's courses collection
      enrol.student.courses.remove(enrol.course as Course);
      await em.persistAndFlush(enrol.student);

      await em.removeAndFlush(enrol);
    });
  }
}

export default EnrollementService;

