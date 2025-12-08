import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { EnrollementService } from './enrollement.service.js';
import { Enrollement, EnrollmentState } from './enrollement.entity.js';
import { Student } from '../student/student.entity.js';
import { Course } from '../course/course.entity.js';

describe('EnrollementService - Unit Tests', () => {
  let enrollementService: EnrollementService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;

  // IDs válidos de 24 caracteres hex para evitar BSONError
  const validStudentId = '507f1f77bcf86cd799439011';
  const validCourseId = '507f1f77bcf86cd799439012';
  const validEnrollmentId = '507f1f77bcf86cd799439013';

  beforeEach(() => {
    mockEm = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((entity, data) => data),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
      transactional: jest.fn().mockImplementation((cb) => cb(mockEm)),
      getReference: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    enrollementService = new EnrollementService(mockEm, mockLogger);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create enrollement with ENROLLED state by default', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockCourse = {
        id: validCourseId,
      } as unknown as Course;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any) // User wrapper
        .mockResolvedValueOnce(mockCourse) // Course
        .mockResolvedValueOnce(null); // No existing enrollment

      // 2. Act
      await enrollementService.create({
        studentId: validStudentId,
        courseId: validCourseId,
      });

      // 3. Assert
      const persistedEnrollment = mockEm.persistAndFlush.mock
        .calls[0][0] as Enrollement;
      expect(persistedEnrollment.state).toBe(EnrollmentState.ENROLLED);
    });

    it('should set enrolledAt timestamp', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(null);

      // 2. Act
      await enrollementService.create({
        studentId: validStudentId,
        courseId: validCourseId,
      });

      // 3. Assert
      const persistedEnrollment = mockEm.persistAndFlush.mock
        .calls[0][0] as Enrollement;
      expect(persistedEnrollment.enrolledAt).toBeInstanceOf(Date);
    });

    it('should add course to student courses collection', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(null);

      // 2. Act
      await enrollementService.create({
        studentId: validStudentId,
        courseId: validCourseId,
      });

      // 3. Assert
      expect(mockStudent.courses.add).toHaveBeenCalledWith(mockCourse);
    });

    it('should persist created enrollement', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(null);

      // 2. Act
      await enrollementService.create({
        studentId: validStudentId,
        courseId: validCourseId,
      });

      // 3. Assert
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw error when student not found', async () => {
      // 1. Arrange
      mockEm.findOne.mockResolvedValue(null);

      // 2. Act & Assert
      await expect(
        enrollementService.create({
          studentId: validStudentId,
          courseId: validCourseId,
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error when course not found', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(null); // Course not found

      // 2. Act & Assert
      await expect(
        enrollementService.create({
          studentId: validStudentId,
          courseId: validCourseId,
        })
      ).rejects.toThrow('Course not found');
    });

    it('should return existing enrollement if already exists', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      const existingEnrollment = {
        id: validEnrollmentId,
        student: { id: validStudentId },
        course: { id: validCourseId },
      } as unknown as Enrollement;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(existingEnrollment); // Already exists

      // 2. Act
      const result = await enrollementService.create({
        studentId: validStudentId,
        courseId: validCourseId,
      });

      // 3. Assert
      expect(result).toBe(existingEnrollment);
    });

    it('should not persist if enrollement already exists', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      const existingEnrollment = {
        id: validEnrollmentId,
        student: { id: validStudentId },
        course: { id: validCourseId },
      } as unknown as Enrollement;

      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(existingEnrollment);

      // 2. Act
      await enrollementService.create({
        studentId: validStudentId,
        courseId: validCourseId,
      });

      // 3. Assert
      expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update enrollement progress', async () => {
      // 1. Arrange
      const existingEnrollment = new Enrollement();
      existingEnrollment.progress = 0;

      mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);
      mockEm.findOne.mockResolvedValue(existingEnrollment);

      // 2. Act
      const result = await enrollementService.update(validEnrollmentId, {
        progress: 50,
      });

      // 3. Assert
      expect(result.progress).toBe(50);
    });

    it('should find enrollement by id before updating', async () => {
      // 1. Arrange
      const existingEnrollment = new Enrollement();

      mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);
      mockEm.findOne.mockResolvedValue(existingEnrollment);

      // 2. Act
      await enrollementService.update(validEnrollmentId, { progress: 50 });

      // 3. Assert
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(
        Enrollement,
        expect.objectContaining({ _id: expect.anything() })
      );
    });

    it('should flush changes after modifying', async () => {
      // 1. Arrange
      const existingEnrollment = new Enrollement();

      mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);
      mockEm.findOne.mockResolvedValue(existingEnrollment);

      // 2. Act
      await enrollementService.update(validEnrollmentId, { progress: 50 });

      // 3. Assert
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw error if enrollement not found', async () => {
      // 1. Arrange
      mockEm.findOneOrFail.mockRejectedValue(new Error('Enrollment not found'));

      // 2. Act & Assert
      await expect(
        enrollementService.update(validEnrollmentId, { progress: 50 })
      ).rejects.toThrow('Enrollment not found');
    });
  });

  describe('remove', () => {
    it('should remove enrollement from database', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { remove: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent as any;
      existingEnrollment.course = mockCourse as any;

      mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);

      // 2. Act
      await enrollementService.remove(validEnrollmentId);

      // 3. Assert
      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(existingEnrollment);
    });

    it('should remove course from student courses collection', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { remove: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent as any;
      existingEnrollment.course = mockCourse as any;

      mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);

      // 2. Act
      await enrollementService.remove(validEnrollmentId);

      // 3. Assert
      expect(mockStudent.courses.remove).toHaveBeenCalledWith(mockCourse);
    });

    it('should find enrollement by id before removing', async () => {
      // 1. Arrange
      const mockStudent = {
        id: validStudentId,
        courses: { remove: jest.fn() },
      } as unknown as Student;

      const mockCourse = { id: validCourseId } as unknown as Course;

      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent as any;
      existingEnrollment.course = mockCourse as any;

      mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);

      // 2. Act
      await enrollementService.remove(validEnrollmentId);

      // 3. Assert
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(
        Enrollement,
        expect.objectContaining({ _id: expect.anything() }),
        expect.objectContaining({ populate: expect.any(Array) })
      );
    });

    it('should throw error if enrollement not found', async () => {
      // 1. Arrange
      mockEm.findOneOrFail.mockRejectedValue(new Error('Enrollment not found'));

      // 2. Act & Assert
      await expect(
        enrollementService.remove(validEnrollmentId)
      ).rejects.toThrow('Enrollment not found');
    });
  });
});
