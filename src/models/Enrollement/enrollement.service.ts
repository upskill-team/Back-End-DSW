/**
 * @module Models/Enrollement/Service
 * @remarks Encapsulates the business logic for managing enrollements.
 */

import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Enrollement, EnrollmentState } from './enrollement.entity.js';
import { Student } from '../student/student.entity.js';
import { Course } from '../course/course.entity.js';
import { Logger } from 'pino';

export class EnrollementService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: Logger
  ) {}

  async create({
    studentId,
    courseId,
  }: {
    studentId: string;
    courseId: string;
  }): Promise<Enrollement> {
    this.logger.info(
      { studentId, courseId },
      'EnrollementService.create - start'
    );
    try {
      const result = await this.em.transactional(async (em) => {
        const student = await em.findOne(Student, {
          _id: new ObjectId(studentId),
        });
        if (!student) {
          this.logger.warn({ studentId }, 'Student not found');
          throw new Error('Student not found');
        }

        const course = await em.findOne(Course, {
          _id: new ObjectId(courseId),
        });
        if (!course) {
          this.logger.warn({ courseId }, 'Course not found');
          throw new Error('Course not found');
        }

        const already = await em.findOne(Enrollement, { student, course });
        if (already) {
          this.logger.warn(
            { studentId, courseId },
            'Enrollment already exists'
          );
          throw new Error('Enrollment already exists');
        }

        const enrol = new Enrollement();
        enrol.student = student;
        enrol.course = course;
        // persist enrollement
        await em.persistAndFlush(enrol);

        // keep many-to-many collection in sync: add course to student.courses
        // (Student is the owner of the relation)
        student.courses.add(course);
        await em.persistAndFlush(student);

        return enrol;
      });

      this.logger.info(
        { id: result.id, studentId, courseId },
        'EnrollementService.create - created'
      );
      return result;
    } catch (err: any) {
      this.logger.error(
        { err, studentId, courseId },
        'EnrollementService.create - error'
      );
      throw err;
    }
  }

  async findAll(): Promise<Enrollement[]> {
    this.logger.debug('EnrollementService.findAll - start');
    try {
      const res = await this.em.find(
        Enrollement,
        {},
        { populate: ['student', 'course'] }
      );
      this.logger.debug(
        { count: res.length },
        'EnrollementService.findAll - done'
      );
      return res;
    } catch (err: any) {
      this.logger.error({ err }, 'EnrollementService.findAll - error');
      throw err;
    }
  }

  async findById(id: string): Promise<Enrollement | null> {
    this.logger.debug({ id }, 'EnrollementService.findById - start');
    try {
      const res = await this.em.findOne(
        Enrollement,
        { _id: new ObjectId(id) },
        { populate: ['student', 'course'] }
      );
      this.logger.debug({ found: !!res }, 'EnrollementService.findById - done');
      return res;
    } catch (err: any) {
      this.logger.error({ err, id }, 'EnrollementService.findById - error');
      throw err;
    }
  }

  /**
   * Finds a single enrollment by the combination of a student's user ID and a course ID.
   * This is used to check if an enrollment already exists.
   * Populates complete course data including units for the student classroom view.
   * @param userId The ID of the User (not the Student profile).
   * @param courseId The ID of the Course.
   * @returns The enrollment entity if found, otherwise null.
   */
  async findByStudentAndCourse(
    userId: string,
    courseId: string
  ): Promise<Enrollement | null> {
    this.logger.info(
      { userId, courseId },
      'Checking for existing enrollment by student and course.'
    );

    const enrollment = await this.em.findOne(
      Enrollement,
      {
        student: new ObjectId(userId),
        course: new ObjectId(courseId),
      },
      {
        populate: [
          'student',
          'student.user',
          'course',
          'course.professor',
          'course.professor.user',
          'course.courseType',
        ],
      }
    );

    return enrollment;
  }

  async findByStudent(studentId: string): Promise<Enrollement[]> {
    this.logger.debug(
      { studentId },
      'EnrollementService.findByStudent - start'
    );
    try {
      const res = await this.em.find(
        Enrollement,
        { student: new ObjectId(studentId) },
        {
          populate: [
            'student',
            'course',
            'course.courseType',
            'course.professor',
            'course.professor.user',
          ],
        }
      );
      this.logger.debug(
        { studentId, count: res.length },
        'EnrollementService.findByStudent - done'
      );
      return res;
    } catch (err: any) {
      this.logger.error(
        { err, studentId },
        'EnrollementService.findByStudent - error'
      );
      throw err;
    }
  }

  async findByCourse(courseId: string): Promise<Enrollement[]> {
    this.logger.debug({ courseId }, 'EnrollementService.findByCourse - start');
    try {
      const res = await this.em.find(
        Enrollement,
        { course: new ObjectId(courseId) },
        {
          populate: [
            'student',
            'student.user',
            'course',
            'course.courseType',
            'course.professor',
            'course.professor.user',
          ],
        }
      );
      this.logger.debug(
        { courseId, count: res.length },
        'EnrollementService.findByCourse - done'
      );
      return res;
    } catch (err: any) {
      this.logger.error(
        { err, courseId },
        'EnrollementService.findByCourse - error'
      );
      throw err;
    }
  }

  async update(
    id: string,
    data: Partial<{ state: EnrollmentState; grade?: number; progress?: number }>
  ): Promise<Enrollement> {
    this.logger.info({ id, data }, 'EnrollementService.update - start');
    try {
      const result = await this.em.transactional(async (em) => {
        const enrol = await em.findOne(
          Enrollement,
          { _id: new ObjectId(id) },
          { populate: ['student', 'course'] }
        );
        if (!enrol) {
          this.logger.warn({ id }, 'Enrollment not found');
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
        if (
          data.progress !== undefined &&
          enrol.state !== EnrollmentState.COMPLETED
        ) {
          enrol.progress = Math.max(0, Math.min(100, data.progress));
        }

        await em.persistAndFlush(enrol);
        // persist student changes if any (e.g. removal from collection)
        await em.persistAndFlush(enrol.student);

        return enrol;
      });

      this.logger.info({ id }, 'EnrollementService.update - done');
      return result;
    } catch (err: any) {
      this.logger.error({ err, id, data }, 'EnrollementService.update - error');
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'EnrollementService.remove - start');
    try {
      await this.em.transactional(async (em) => {
        const enrol = await em.findOne(
          Enrollement,
          { _id: new ObjectId(id) },
          { populate: ['student', 'course'] }
        );
        if (!enrol) {
          this.logger.warn({ id }, 'Enrollment not found');
          throw new Error('Enrollment not found');
        }

        // remove association from student's courses collection
        enrol.student.courses.remove(enrol.course as Course);
        await em.persistAndFlush(enrol.student);

        await em.removeAndFlush(enrol);
      });

      this.logger.info({ id }, 'EnrollementService.remove - done');
    } catch (err: any) {
      this.logger.error({ err, id }, 'EnrollementService.remove - error');
      throw err;
    }
  }

  /**
   * Marks a unit as completed for a specific enrollment.
   * Updates the completedUnits array and recalculates progress automatically.
   * @param enrollmentId The ID of the enrollment.
   * @param unitNumber The unit number to mark as completed.
   * @returns The updated enrollment.
   */
  async completeUnit(
    enrollmentId: string,
    unitNumber: number
  ): Promise<Enrollement> {
    this.logger.info(
      { enrollmentId, unitNumber },
      'EnrollementService.completeUnit - start'
    );

    try {
      const result = await this.em.transactional(async (em) => {
        // 1. Find the enrollment with the course to know the total units
        const enrollment = await em.findOne(
          Enrollement,
          { _id: new ObjectId(enrollmentId) },
          { populate: ['course', 'student'] }
        );

        if (!enrollment) {
          this.logger.warn({ enrollmentId }, 'Enrollment not found');
          throw new Error('Enrollment not found');
        }

        // 2. Validate that the unitNumber exists in the course
        const course = enrollment.course as Course;
        const unitExists = course.units.some(
          (u) => u.unitNumber === unitNumber
        );

        if (!unitExists) {
          this.logger.warn(
            { enrollmentId, unitNumber },
            'Invalid unit number for this course'
          );
          throw new Error(`Unit ${unitNumber} does not exist in this course`);
        }

        // 3. Add unitNumber to completedUnits if not already present (avoid duplicates)
        if (!enrollment.completedUnits.includes(unitNumber)) {
          enrollment.completedUnits.push(unitNumber);

          // 4. Recalculate progress automatically
          const totalUnits = course.units.length;
          const completedCount = enrollment.completedUnits.length;
          enrollment.progress =
            totalUnits > 0
              ? Math.round((completedCount / totalUnits) * 100)
              : 0;

          // 5. If progress reaches 100%, change state to COMPLETED (optional)
          if (
            enrollment.progress === 100 &&
            enrollment.state === EnrollmentState.ENROLLED
          ) {
            enrollment.state = EnrollmentState.COMPLETED;
            this.logger.info(
              { enrollmentId },
              'Course completed - state updated to COMPLETED'
            );
          }

          await em.persistAndFlush(enrollment);
          this.logger.info(
            { enrollmentId, unitNumber, progress: enrollment.progress },
            'Unit marked as completed'
          );
        } else {
          this.logger.info(
            { enrollmentId, unitNumber },
            'Unit already completed - no changes'
          );
        }

        return enrollment;
      });

      return result;
    } catch (err: any) {
      this.logger.error(
        { err, enrollmentId, unitNumber },
        'EnrollementService.completeUnit - error'
      );
      throw err;
    }
  }

  /**
   * Unmarks a unit as completed for a specific enrollment.
   * Updates the completedUnits array and recalculates progress automatically.
   * @param enrollmentId The ID of the enrollment.
   * @param unitNumber The unit number to unmark as completed.
   * @returns The updated enrollment.
   */
  async uncompleteUnit(
    enrollmentId: string,
    unitNumber: number
  ): Promise<Enrollement> {
    this.logger.info(
      { enrollmentId, unitNumber },
      'EnrollementService.uncompleteUnit - start'
    );

    try {
      const result = await this.em.transactional(async (em) => {
        const enrollment = await em.findOne(
          Enrollement,
          { _id: new ObjectId(enrollmentId) },
          { populate: ['course', 'student'] }
        );

        if (!enrollment) {
          this.logger.warn({ enrollmentId }, 'Enrollment not found');
          throw new Error('Enrollment not found');
        }

        // Remove unitNumber from the array
        const index = enrollment.completedUnits.indexOf(unitNumber);
        if (index > -1) {
          enrollment.completedUnits.splice(index, 1);

          // Recalculate progress
          const course = enrollment.course as Course;
          const totalUnits = course.units.length;
          const completedCount = enrollment.completedUnits.length;
          enrollment.progress =
            totalUnits > 0
              ? Math.round((completedCount / totalUnits) * 100)
              : 0;

          // If progress drops below 100% and state is COMPLETED, revert to ENROLLED
          if (
            enrollment.progress < 100 &&
            enrollment.state === EnrollmentState.COMPLETED
          ) {
            enrollment.state = EnrollmentState.ENROLLED;
            this.logger.info(
              { enrollmentId },
              'Progress below 100% - state reverted to ENROLLED'
            );
          }

          await em.persistAndFlush(enrollment);
          this.logger.info(
            { enrollmentId, unitNumber, progress: enrollment.progress },
            'Unit unmarked as completed'
          );
        } else {
          this.logger.info(
            { enrollmentId, unitNumber },
            'Unit was not completed - no changes'
          );
        }

        return enrollment;
      });

      return result;
    } catch (err: any) {
      this.logger.error(
        { err, enrollmentId, unitNumber },
        'EnrollementService.uncompleteUnit - error'
      );
      throw err;
    }
  }
}

export default EnrollementService;
