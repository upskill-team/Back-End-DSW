/**
 * @module Models/Enrollement/Service
 * @remarks Encapsulates the business logic for managing enrollements.
 */
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Enrollement, EnrollmentState } from './enrollement.entity.js';
import { Course } from '../course/course.entity.js';
import { Logger } from 'pino';
import { User } from '../user/user.entity.js';
import { Student } from '../student/student.entity.js';

export class EnrollementService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: Logger
  ) {}

  /**
   * Creates a new enrollment record, linking a student to a course.
   * It finds the student profile via the user ID.
   * @param {object} payload - The data for creating the enrollment.
   * @param {string} payload.studentId - The ID of the User (not the Student profile). This is used to find the associated student profile.
   * @param {string} payload.courseId - The ID of the Course.
   * @returns {Promise<Enrollement>} The newly created or existing enrollment entity.
   */
  async create({
    studentId,
    courseId,
  }: {
    studentId: string;
    courseId: string;
  }): Promise<Enrollement> {
    this.logger.info({ userId: studentId, courseId }, 'EnrollementService.create - start');
    try {
      const result = await this.em.transactional(async (em) => {

        const user = await em.findOne(User, { _id: new ObjectId(studentId) }, { populate: ['studentProfile'] });
        if (!user) {
          this.logger.warn({ userId: studentId }, 'User not found');
          throw new Error('User not found');
        }

        const student = user.studentProfile;
        if (!student) {
          this.logger.warn({ userId: studentId }, 'Student profile not found for this user. The relationship might be broken in the database.');
          throw new Error('Student not found');
        }

        const course = await em.findOne(Course, { _id: new ObjectId(courseId) });
        if (!course) {
          this.logger.warn({ courseId }, 'Course not found');
          throw new Error('Course not found');
        }

        const already = await em.findOne(Enrollement, { student: student.id, course: course.id });
        if (already) {
          this.logger.warn({ studentId: student.id, courseId }, 'Enrollment already exists, returning existing one.');
          return already;
        }

        const enrol = new Enrollement();
        enrol.student = student;
        enrol.course = course;
        
        await em.persistAndFlush(enrol);

        student.courses.add(course);
        await em.persistAndFlush(student);

        return enrol;
      });

      this.logger.info({ id: result.id, studentId: result.student.id, courseId }, 'EnrollementService.create - created');
      return result;
    } catch (err: any) {
      this.logger.error({ err, userId: studentId, courseId }, 'EnrollementService.create - error');
      throw err;
    }
  }

  /**
   * Retrieves all enrollment records from the database.
   * @returns {Promise<Enrollement[]>} An array of all enrollment entities.
   */
  async findAll(): Promise<Enrollement[]> {
    return this.em.find(Enrollement, {}, { populate: ['student', 'course'] });
  }

  /**
   * Finds a single enrollment by its unique ID.
   * @param {string} id - The ID of the enrollment to find.
   * @returns {Promise<Enrollement | null>} The enrollment entity if found, otherwise null.
   */
  async findById(id: string): Promise<Enrollement | null> {
    return this.em.findOne(Enrollement, { _id: new ObjectId(id) }, { populate: ['student', 'course'] });
  }

  /**
   * Finds a single enrollment by the combination of a student ID and a course ID.
   * @param {string} studentId - The ID of the Student profile.
   * @param {string} courseId - The ID of the Course.
   * @returns {Promise<Enrollement | null>} The enrollment entity if found, otherwise null.
   */
  async findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollement | null> {
    // The input studentId may be either a Student profile id or a User id.
    // Try to resolve as User -> Student first, otherwise treat as Student id.
    try {
      const user = await this.em.findOne(User, { _id: new ObjectId(studentId) }, { populate: ['studentProfile'] });
      if (user && (user as any).studentProfile) {
        const studentProfile = (user as any).studentProfile as Student;
        return this.em.findOne(Enrollement, {
          student: new ObjectId(studentProfile.id!),
          course: new ObjectId(courseId),
        });
      }
    } catch {
      // not a User id, continue to try as Student id
    }

    return this.em.findOne(Enrollement, {
      student: new ObjectId(studentId),
      course: new ObjectId(courseId),
    });
  }

  /**
   * Finds all enrollments for a specific student.
   * @param {string} studentId - The ID of the Student profile.
   * @returns {Promise<Enrollement[]>} An array of enrollment entities for the specified student.
   */
  async findByStudent(studentId: string): Promise<Enrollement[]> {
    return this.em.find(Enrollement, { student: new ObjectId(studentId) }, { populate: ['student', 'course'] });
  }

  /**
   * Finds all enrollments for a specific course.
   * @param {string} courseId - The ID of the Course.
   * @returns {Promise<Enrollement[]>} An array of enrollment entities for the specified course.
   */
  async findByCourse(courseId: string): Promise<Enrollement[]> {
    return this.em.find(Enrollement, { course: new ObjectId(courseId) }, { populate: ['student', 'course'] });
  }

  /**
   * Updates an existing enrollment's data (e.g., state, grade, progress).
   * @param {string} id - The ID of the enrollment to update.
   * @param {Partial<...>} data - An object containing the fields to update.
   * @returns {Promise<Enrollement>} The updated enrollment entity.
   */
  async update(id: string, data: Partial<{ state: EnrollmentState; grade?: number; progress?: number }>): Promise<Enrollement> {
    const enrol = await this.em.findOneOrFail(Enrollement, { _id: new ObjectId(id) }, { populate: ['student', 'course'] });
    Object.assign(enrol, data);
    await this.em.flush();
    return enrol;
  }

  /**
   * Deletes an enrollment record from the database and removes the course from the student's course list.
   * @param {string} id - The ID of the enrollment to remove.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const enrol = await this.em.findOneOrFail(Enrollement, { _id: new ObjectId(id) }, { populate: ['student', 'course'] });
    enrol.student.courses.remove(enrol.course as Course);
    await this.em.removeAndFlush(enrol);
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
