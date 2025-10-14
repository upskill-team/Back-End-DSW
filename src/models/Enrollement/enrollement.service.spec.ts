import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { EnrollementService } from './enrollement.service';
import { Enrollement, EnrollmentState } from './enrollement.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';

// Helpers for creating Mocks 
const mockStudent = { id: 'student-id-123', courses: { add: jest.fn(), remove: jest.fn() } } as unknown as Student;
const mockCourse = { id: 'course-id-456' } as unknown as Course;

describe('EnrollementService', () => {
  let service: EnrollementService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {

    mockEm = {
      findOne: jest.fn(), 
      find: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
      transactional: jest.fn().mockImplementation(cb => cb(mockEm)),
    } as any;
    
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;
    service = new EnrollementService(mockEm, mockLogger);


    const OriginalDate = global.Date;
    // We set a fixed date for our tests.
    const testDate = new Date('2025-10-26T10:00:00Z');
    
    // We create a spy that only intercepts `new Date()` without arguments.
    dateSpy = jest.spyOn(global, 'Date')
      .mockImplementation((...args) => {
        if (args.length) {
          // If called with arguments (e.g., `new Date(‘...’)`), use the actual constructor.
          return new OriginalDate(...args);
        }
        // If called without arguments (`new Date()`), it returns our fixed date.
        return testDate;
      });
    // We ensure that the mocked `Date` still has
    // all the static methods (`now`, `parse`, etc.) of the original.
    Object.setPrototypeOf(dateSpy, OriginalDate);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // We restore the global Date object to its original state.
    dateSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new enrollment with correct default values', async () => {
      // Arrange
      const studentId = 'student-id-123';
      const courseId = 'course-id-456';
      mockEm.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(null);

      // Act
      /*const result = await service.create({ studentId, courseId });*/

      // Assert
      const persistedEnrollment = mockEm.persistAndFlush.mock.calls[0][0] as Enrollement;
      
      expect(persistedEnrollment.state).toBe(EnrollmentState.ENROLLED);
      expect(persistedEnrollment.enrolledAt).toEqual(new Date('2025-10-26T10:00:00Z'));
      
      expect(mockStudent.courses.add).toHaveBeenCalledWith(mockCourse);
    });


    it('should throw an error if student is not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(service.create({ studentId: 'non-existent', courseId: 'any' })).rejects.toThrow('Student not found');
    });

    it('should throw an error if course is not found', async () => {
      mockEm.findOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(null);
      await expect(service.create({ studentId: 'any', courseId: 'non-existent' })).rejects.toThrow('Course not found');
    });
    
    it('should throw an error if enrollment already exists', async () => {
        mockEm.findOne
            .mockResolvedValueOnce(mockStudent)
            .mockResolvedValueOnce(mockCourse)
            .mockResolvedValueOnce(new Enrollement());
        await expect(service.create({ studentId: 'any', courseId: 'any' })).rejects.toThrow('Enrollment already exists');
    });
  });

  describe('update', () => {
    it('should update an enrollment', async () => {
        const existingEnrollment = new Enrollement();
        existingEnrollment.student = mockStudent;
        mockEm.findOne.mockResolvedValue(existingEnrollment);
        const result = await service.update('enroll-id', { progress: 50 });
        expect(result.progress).toBe(50);
    });

 
     it('should throw an error if enrollment to update is not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(service.update('non-existent', {})).rejects.toThrow('Enrollment not found');
    });
  });

  describe('remove', () => {
      it('should remove an enrollment', async () => {
          const existingEnrollment = new Enrollement();
          existingEnrollment.student = mockStudent;
          existingEnrollment.course = mockCourse;
          mockEm.findOne.mockResolvedValue(existingEnrollment);
          await service.remove('enroll-id');
          expect(mockEm.removeAndFlush).toHaveBeenCalledWith(existingEnrollment);
      });


       it('should throw an error if enrollment to remove is not found', async () => {
        mockEm.findOne.mockResolvedValue(null);
        await expect(service.remove('non-existent')).rejects.toThrow('Enrollment not found');
    });
  });
});