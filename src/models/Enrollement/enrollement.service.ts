/**
 * @module Models/Enrollement/Service
 * @remarks Encapsulates the business logic for managing enrollements.
 */

import { EntityManager } from '@mikro-orm/core';
import { Enrollement, EnrollmentState } from './enrollement.entity.js';
import { Student } from '../student/student.entity.js';
import { Course } from '../course/course.entity.js';
import { logger } from '../../shared/utils/logger.js';

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
    logger.info({ studentId, courseId }, 'EnrollementService.create - start');
    try {
      const result = await this.em.transactional(async (em) => {
        const student = await em.findOne(Student, { id: studentId });
        if (!student) {
          logger.warn({ studentId }, 'Student not found');
          throw new Error('Student not found');
        }

        const course = await em.findOne(Course, { id: courseId });
        if (!course) {
          logger.warn({ courseId }, 'Course not found');
          throw new Error('Course not found');
        }

        const already = await em.findOne(Enrollement, { student, course });
        if (already) {
          logger.warn({ studentId, courseId }, 'Enrollment already exists');
          throw new Error('Enrollment already exists');
        }

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

      logger.info({ id: result.id, studentId, courseId }, 'EnrollementService.create - created');
      return result;
    } catch (err: any) {
      logger.error({ err, studentId, courseId }, 'EnrollementService.create - error');
      throw err;
    }
  }

  async findAll(): Promise<Enrollement[]> {
    logger.debug('EnrollementService.findAll - start');
    try {
      const res = await this.em.find(Enrollement, {}, { populate: ['student', 'course'] });
      logger.debug({ count: res.length }, 'EnrollementService.findAll - done');
      return res;
    } catch (err: any) {
      logger.error({ err }, 'EnrollementService.findAll - error');
      throw err;
    }
  }

  async findById(id: string): Promise<Enrollement | null> {
    logger.debug({ id }, 'EnrollementService.findById - start');
    try {
      const res = await this.em.findOne(Enrollement, { id }, { populate: ['student', 'course'] });
      logger.debug({ found: !!res }, 'EnrollementService.findById - done');
      return res;
    } catch (err: any) {
      logger.error({ err, id }, 'EnrollementService.findById - error');
      throw err;
    }
  }

  async findByStudent(studentId: string): Promise<Enrollement[]> {
    logger.debug({ studentId }, 'EnrollementService.findByStudent - start');
    try {
      const res = await this.em.find(
        Enrollement,
        { student: studentId },
        { populate: ['student', 'course'] },
      );
      logger.debug({ studentId, count: res.length }, 'EnrollementService.findByStudent - done');
      return res;
    } catch (err: any) {
      logger.error({ err, studentId }, 'EnrollementService.findByStudent - error');
      throw err;
    }
  }

  async findByCourse(courseId: string): Promise<Enrollement[]> {
    logger.debug({ courseId }, 'EnrollementService.findByCourse - start');
    try {
      const res = await this.em.find(
        Enrollement,
        { course: courseId },
        { populate: ['student', 'course'] },
      );
      logger.debug({ courseId, count: res.length }, 'EnrollementService.findByCourse - done');
      return res;
    } catch (err: any) {
      logger.error({ err, courseId }, 'EnrollementService.findByCourse - error');
      throw err;
    }
  }

  async update(
    id: string,
    data: Partial<{ state: EnrollmentState; grade?: number; progress?: number }>,
  ): Promise<Enrollement> {
    logger.info({ id, data }, 'EnrollementService.update - start');
    try {
      const result = await this.em.transactional(async (em) => {
        const enrol = await em.findOne(Enrollement, { id }, { populate: ['student', 'course'] });
        if (!enrol) {
          logger.warn({ id }, 'Enrollment not found');
          throw new Error('Enrollment not found');
        }

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
        // Only update progress if state is not COMPLETED
        if (data.progress !== undefined && enrol.state !== EnrollmentState.COMPLETED) {
          enrol.progress = Math.max(0, Math.min(100, data.progress));
        }

        await em.persistAndFlush(enrol);
        // persist student changes if any (e.g. removal from collection)
        await em.persistAndFlush(enrol.student);

        return enrol;
      });

      logger.info({ id }, 'EnrollementService.update - done');
      return result;
    } catch (err: any) {
      logger.error({ err, id, data }, 'EnrollementService.update - error');
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    logger.info({ id }, 'EnrollementService.remove - start');
    try {
      await this.em.transactional(async (em) => {
        const enrol = await em.findOne(Enrollement, { id }, { populate: ['student', 'course'] });
        if (!enrol) {
          logger.warn({ id }, 'Enrollment not found');
          throw new Error('Enrollment not found');
        }

        // remove association from student's courses collection
        enrol.student.courses.remove(enrol.course as Course);
        await em.persistAndFlush(enrol.student);

        await em.removeAndFlush(enrol);
      });

      logger.info({ id }, 'EnrollementService.remove - done');
    } catch (err: any) {
      logger.error({ err, id }, 'EnrollementService.remove - error');
      throw err;
    }
  }
}

export default EnrollementService;

