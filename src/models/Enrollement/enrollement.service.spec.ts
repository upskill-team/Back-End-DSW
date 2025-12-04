import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { EnrollementService } from './enrollement.service';
import { Enrollement, EnrollmentState } from './enrollement.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';

// Valid 24-char hex IDs to avoid BSONError
const validStudentId = '507f1f77bcf86cd799439011';
const validCourseId = '507f1f77bcf86cd799439012';
const validEnrollmentId = '507f1f77bcf86cd799439013';

// Entity Mocks
const mockStudent = { 
  id: validStudentId, 
  courses: { add: jest.fn(), remove: jest.fn() } 
} as unknown as Student;

const mockCourse = { 
  id: validCourseId 
} as unknown as Course;

describe('EnrollementService', () => {
  let service: EnrollementService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    // Full Mock of EntityManager
    mockEm = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((entity, data) => data),
      persistAndFlush: jest.fn(),
      flush: jest.fn(), // Required for update()
      removeAndFlush: jest.fn(),
      transactional: jest.fn().mockImplementation(cb => cb(mockEm)),
      getReference: jest.fn(),
    } as any;
    
    // Mock Logger
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;
    
    service = new EnrollementService(mockEm, mockLogger);

    // Date Mock for consistency
    const OriginalDate = global.Date;
    const testDate = new Date('2025-10-26T10:00:00Z');
    dateSpy = jest.spyOn(global, 'Date')
      .mockImplementation((...args) => {
        if (args.length) return new OriginalDate(...args);
        return testDate;
      });
    Object.setPrototypeOf(dateSpy, OriginalDate);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new enrollment with correct default values', async () => {
      // Mock findOne: returns User wrapper, then Course, then null (no existing enrollment)
      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(null);

      await service.create({ studentId: validStudentId, courseId: validCourseId });

      const persistedEnrollment = mockEm.persistAndFlush.mock.calls[0][0] as Enrollement;
      
      expect(persistedEnrollment.state).toBe(EnrollmentState.ENROLLED);
      expect(persistedEnrollment.enrolledAt).toEqual(new Date('2025-10-26T10:00:00Z'));
      expect(mockStudent.courses.add).toHaveBeenCalledWith(mockCourse);
    });

    it('should throw an error if student is not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(service.create({ studentId: validStudentId, courseId: 'any' }))
        .rejects.toThrow('User not found');
    });

    it('should throw an error if course is not found', async () => {
      mockEm.findOne
        .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
        .mockResolvedValueOnce(null);

      await expect(service.create({ studentId: validStudentId, courseId: validCourseId }))
        .rejects.toThrow('Course not found');
    });
    
    it('should return existing enrollment if it already exists', async () => {
        // Complete structure needed to avoid logger errors
        const existingEnrollment = {
            id: validEnrollmentId,
            student: { id: validStudentId },
            course: { id: validCourseId }
        } as unknown as Enrollement;

        mockEm.findOne
            .mockResolvedValueOnce({ studentProfile: mockStudent } as any)
            .mockResolvedValueOnce(mockCourse)
            .mockResolvedValueOnce(existingEnrollment);

        const result = await service.create({ studentId: validStudentId, courseId: validCourseId });
        
        expect(result).toBe(existingEnrollment);
    });
  });

  describe('update', () => {
    it('should update an enrollment', async () => {
        const existingEnrollment = new Enrollement();
        existingEnrollment.student = mockStudent as any;
        
        mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);
        mockEm.findOne.mockResolvedValue(existingEnrollment);

        const result = await service.update(validEnrollmentId, { progress: 50 });
        
        expect(mockEm.findOneOrFail).toHaveBeenCalled();
        expect(mockEm.flush).toHaveBeenCalled();
        expect(result.progress).toBe(50);
    });

     it('should throw an error if enrollment to update is not found', async () => {
      mockEm.findOneOrFail.mockRejectedValue(new Error('Enrollment not found'));
      await expect(service.update(validEnrollmentId, {})).rejects.toThrow('Enrollment not found');
    });
  });

  describe('remove', () => {
      it('should remove an enrollment', async () => {
          const existingEnrollment = new Enrollement();
          existingEnrollment.student = mockStudent as any;
          existingEnrollment.course = mockCourse as any;
          
          mockEm.findOneOrFail.mockResolvedValue(existingEnrollment);
          
          await service.remove(validEnrollmentId);
          
          expect(mockStudent.courses.remove).toHaveBeenCalledWith(mockCourse);
          expect(mockEm.removeAndFlush).toHaveBeenCalledWith(existingEnrollment);
      });

       it('should throw an error if enrollment to remove is not found', async () => {
        mockEm.findOneOrFail.mockRejectedValue(new Error('Enrollment not found'));
        await expect(service.remove(validEnrollmentId)).rejects.toThrow('Enrollment not found');
    });
  });
});