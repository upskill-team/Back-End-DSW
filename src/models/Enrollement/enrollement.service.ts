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
import { Professor } from '../professor/professor.entity.js';
import { EmailNotificationService } from '../../emails/services/email-notification.service.js';

export class EnrollementService {
  private emailService: EmailNotificationService;

  constructor(
    private readonly em: EntityManager,
    private readonly logger: Logger
  ) {
    this.emailService = new EmailNotificationService(logger);
  }

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
          this.logger.warn({ userId: studentId }, 'Student profile not found for this user.');
          throw new Error('Student not found');
        }

        const course = await em.findOne(Course, { _id: new ObjectId(courseId) }, { populate: ['professor', 'professor.user'] });
        if (!course) {
          this.logger.warn({ courseId }, 'Course not found');
          throw new Error('Course not found');
        }

        if (user.professorProfile && user.professorProfile.id === (course.professor as Professor).id) {
          this.logger.warn({ userId: studentId, courseId }, 'Professor attempted to enroll in their own course.');
          throw new Error('Un profesor no puede inscribirse en su propio curso.');
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

        // Send enrollment confirmation email for free courses
        if (course.isFree) {
          const professor = course.professor as Professor;
          const professorUser = professor.user;
          const professorName = professorUser ? `${professorUser.name} ${professorUser.surname}` : 'Profesor';
          const frontendUrl = process.env.NGROK_FRONTEND_URL || 'http://localhost:5173';
          
          await this.emailService.sendCourseEnrollmentEmail({
            recipientEmail: user.mail,
            recipientName: user.name,
            courseName: course.name,
            courseImageUrl: course.imageUrl,
            courseUrl: `${frontendUrl}/courses/${courseId}`,
            enrollmentDate: new Date(),
            professorName: professorName,
          }).catch(err => {
            this.logger.error({ err, userId: studentId, courseId }, 'Failed to send enrollment confirmation email')
          });
        }

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
    return this.em.find(Enrollement, {}, { populate: ['student.user', 'course.professor.user', 'course.units'] });
  }

  /**
   * Finds a single enrollment by its unique ID.
   * @param {string} id - The unique identifier of the enrollment.
   * @returns {Promise<Enrollement | null>} The enrollment entity if found, otherwise null.
   */
  async findById(id: string): Promise<Enrollement | null> {
    return this.em.findOne(
      Enrollement,
      { _id: new ObjectId(id) },
      { populate: ['student.user', 'course.professor.user', 'course.units'] }
    );
  }

  /**
   * Finds an enrollment by student (User or Student) and course.
   * @param {string} studentId - The ID of the User or Student.
   * @param {string} courseId - The ID of the Course.
   * @returns {Promise<Enrollement | null>} The enrollment entity if found, otherwise null.
   */
  async findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollement | null> {
    try {
      const user = await this.em.findOne(User, { _id: new ObjectId(studentId) }, { populate: ['studentProfile'] });
      if (user && user.studentProfile) {
        const studentProfile = user.studentProfile as Student;
        return this.em.findOne(
          Enrollement,
          {
            student: new ObjectId(studentProfile.id!),
            course: new ObjectId(courseId),
          },
          { populate: ['student.user', 'course.professor.user', 'course.units'] }
        );
      }
    } catch {
      // not a user id, continue
    }

    return this.em.findOne(
      Enrollement,
      {
        student: new ObjectId(studentId),
        course: new ObjectId(courseId),
      },
      { populate: ['student.user', 'course.professor.user', 'course.units'] }
    );
  }

  /**
   * Finds all enrollments for a specific student.
   * @param {string} studentId - The ID of the Student.
   * @returns {Promise<Enrollement[]>} An array of enrollment entities for the student.
   */
  async findByStudent(studentId: string): Promise<Enrollement[]> {
    return this.em.find(
      Enrollement,
      { student: new ObjectId(studentId) },
      { populate: ['student.user', 'course.professor.user', 'course.units'] }
    );
  }

  /**
   * Finds all enrollments for a specific course.
   * @param {string} courseId - The ID of the Course.
   * @returns {Promise<Enrollement[]>} An array of enrollment entities for the course.
   */
  async findByCourse(courseId: string): Promise<Enrollement[]> {
    return this.em.find(
      Enrollement,
      { course: new ObjectId(courseId) },
      { populate: ['student.user', 'course.professor.user', 'course.units'] }
    );
  }

  /**
   * Updates an existing enrollment's data (e.g., state, grade, progress).
   * @param {string} id - The unique identifier of the enrollment to update.
   * @param {object} data - The data to update.
   * @param {EnrollmentState} [data.state] - The new state of the enrollment.
   */
  async update(
    id: string,
    data: Partial<{ state: EnrollmentState; grade?: number; progress?: number }>
  ): Promise<Enrollement> {
    const enrol = await this.em.findOneOrFail(Enrollement, { _id: new ObjectId(id) });
    Object.assign(enrol, data);
    await this.em.flush();
    return (await this.findById(id)) as Enrollement;
  }

  /**
   * Deletes an enrollment and removes the course from student's course list.
   * @param {string} id - The unique identifier of the enrollment to delete.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const enrol = await this.em.findOneOrFail(
      Enrollement,
      { _id: new ObjectId(id) },
      { populate: ['student', 'course'] }
    );
    enrol.student.courses.remove(enrol.course as Course);
    await this.em.removeAndFlush(enrol);
  }

  /**
   * Marks a unit as completed for a specific enrollment.
   * @param {string} enrollmentId - The ID of the enrollment.
   * @param {number} unitNumber - The unit number to mark as completed.
   * @returns {Promise<Enrollement>} The updated enrollment entity.
   */
  async completeUnit(enrollmentId: string, unitNumber: number): Promise<Enrollement> {
    this.logger.info({ enrollmentId, unitNumber }, 'EnrollementService.completeUnit - start');

    try {
      const result = await this.em.transactional(async (em) => {
        const enrollment = await em.findOne(
          Enrollement,
          { _id: new ObjectId(enrollmentId) },
          { populate: ['course', 'student'] }
        );

        if (!enrollment) throw new Error('Enrollment not found');

        const course = enrollment.course as Course;
        const unitExists = course.units.some((u) => u.unitNumber === unitNumber);
        if (!unitExists) throw new Error(`Unit ${unitNumber} does not exist in this course`);

        if (!enrollment.completedUnits.includes(unitNumber)) {
          enrollment.completedUnits.push(unitNumber);

          const totalUnits = course.units.length;
          const completedCount = enrollment.completedUnits.length;
          enrollment.progress = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

          if (enrollment.progress === 100 && enrollment.state === EnrollmentState.ENROLLED) {
            enrollment.state = EnrollmentState.COMPLETED;
          }

          await em.persistAndFlush(enrollment);
          this.logger.info({ enrollmentId, unitNumber, progress: enrollment.progress }, 'Unit marked as completed');
        }

        return enrollment;
      });

      return result;
    } catch (err: any) {
      this.logger.error({ err, enrollmentId, unitNumber }, 'EnrollementService.completeUnit - error');
      throw err;
    }
  }

  /**
   * Unmarks a unit as completed for a specific enrollment.
   * @param {string} enrollmentId - The ID of the enrollment.
   * @param {number} unitNumber - The unit number to unmark as completed.
   * @returns {Promise<Enrollement>} The updated enrollment entity.
   */
  async uncompleteUnit(enrollmentId: string, unitNumber: number): Promise<Enrollement> {
    this.logger.info({ enrollmentId, unitNumber }, 'EnrollementService.uncompleteUnit - start');

    try {
      const result = await this.em.transactional(async (em) => {
        const enrollment = await em.findOne(
          Enrollement,
          { _id: new ObjectId(enrollmentId) },
          { populate: ['course', 'student'] }
        );

        if (!enrollment) throw new Error('Enrollment not found');

        const index = enrollment.completedUnits.indexOf(unitNumber);
        if (index > -1) {
          enrollment.completedUnits.splice(index, 1);

          const course = enrollment.course as Course;
          const totalUnits = course.units.length;
          const completedCount = enrollment.completedUnits.length;
          enrollment.progress = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

          if (enrollment.progress < 100 && enrollment.state === EnrollmentState.COMPLETED) {
            enrollment.state = EnrollmentState.ENROLLED;
          }

          await em.persistAndFlush(enrollment);
          this.logger.info({ enrollmentId, unitNumber, progress: enrollment.progress }, 'Unit unmarked as completed');
        }

        return enrollment;
      });

      return result;
    } catch (err: any) {
      this.logger.error({ err, enrollmentId, unitNumber }, 'EnrollementService.uncompleteUnit - error');
      throw err;
    }
  }
}

export default EnrollementService;
