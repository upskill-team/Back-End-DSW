import { Request, Response } from 'express';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import {
  createEnrollement,
  getEnrollementById,
  updateEnrollement,
  deleteEnrollement,
} from './enrollement.controller';
import EnrollementService from './enrollement.service';
import { Enrollement } from './enrollement.entity';

describe('Enrollement Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockEm: jest.Mocked<EntityManager>;
  let requestContextSpy: jest.SpyInstance;

  beforeEach(() => {
    mockEm = {} as jest.Mocked<EntityManager>;
    // Spy on RequestContext to inject mocked EntityManager
    requestContextSpy = jest.spyOn(RequestContext, 'getEntityManager').mockReturnValue(mockEm);

    mockReq = {
      body: {},
      params: {},
      // Mock request logger. Using 'as any' to avoid linting errors without using @ts-ignore
      log: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } as any
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    requestContextSpy.mockRestore();
  });

  describe('createEnrollement', () => {
    it('should create an enrollment and return 201 with HttpResponse structure', async () => {
      const newEnrolmentData = { studentId: 'student-1', courseId: 'course-1' };
      const createdEnrolment = new Enrollement();
      mockReq.body = newEnrolmentData;
      
      const createServiceSpy = jest.spyOn(EnrollementService.prototype, 'create')
                                   .mockResolvedValue(createdEnrolment);

      await createEnrollement(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      // Verify HttpResponse.Created structure
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 201,
        message: 'Created',
        data: createdEnrolment
      }));
      
      createServiceSpy.mockRestore();
    });

    it('should return 400 if studentId or courseId is missing', async () => {
      mockReq.body = { studentId: 'student-1' }; // Missing courseId
      const createServiceSpy = jest.spyOn(EnrollementService.prototype, 'create');

      await createEnrollement(mockReq as Request, mockRes as Response);

      expect(createServiceSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        message: 'Bad Request'
      }));
      
      createServiceSpy.mockRestore();
    });
    
    it('should return 400 if the service throws an error', async () => {
        mockReq.body = { studentId: 'student-1', courseId: 'course-1' };
        const errorMessage = 'User not found';
        const createServiceSpy = jest.spyOn(EnrollementService.prototype, 'create')
                                     .mockRejectedValue(new Error(errorMessage));
        
        await createEnrollement(mockReq as Request, mockRes as Response);
        
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 400,
            errors: errorMessage
        }));

        createServiceSpy.mockRestore();
    });
  });

  describe('getEnrollementById', () => {
    it('should return an enrollment and 200 if found', async () => {
      const enrollmentId = 'enroll-123';
      const foundEnrolment = new Enrollement();
      mockReq.params = { id: enrollmentId };
      const findByIdSpy = jest.spyOn(EnrollementService.prototype, 'findById')
                              .mockResolvedValue(foundEnrolment);

      await getEnrollementById(mockReq as Request, mockRes as Response);

      expect(findByIdSpy).toHaveBeenCalledWith(enrollmentId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 200,
        data: foundEnrolment
      }));
      
      findByIdSpy.mockRestore();
    });
    
    it('should return 404 if enrollment is not found', async () => {
        mockReq.params = { id: 'non-existent-id' };
        const findByIdSpy = jest.spyOn(EnrollementService.prototype, 'findById')
                                .mockResolvedValue(null);

        await getEnrollementById(mockReq as Request, mockRes as Response);
        
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 404,
            message: 'Not Found'
        }));
        
        findByIdSpy.mockRestore();
    });
  });

  describe('updateEnrollement', () => {
    it('should update an enrollment and return 200', async () => {
      const enrollmentId = 'enroll-123';
      const updateData = { progress: 50 };
      const updatedEnrolment = new Enrollement();
      
      mockReq.params = { id: enrollmentId };
      mockReq.body = updateData;

      const updateSpy = jest.spyOn(EnrollementService.prototype, 'update')
                            .mockResolvedValue(updatedEnrolment);

      await updateEnrollement(mockReq as Request, mockRes as Response);

      expect(updateSpy).toHaveBeenCalledWith(enrollmentId, expect.objectContaining(updateData));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 200,
        data: updatedEnrolment
      }));

      updateSpy.mockRestore();
    });

    it('should return 400 for an invalid state', async () => {
      mockReq.params = { id: 'enroll-123' };
      mockReq.body = { state: 'invalid-state' };
      const updateSpy = jest.spyOn(EnrollementService.prototype, 'update');

      await updateEnrollement(mockReq as Request, mockRes as Response);

      expect(updateSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        errors: 'invalid state'
      }));

      updateSpy.mockRestore();
    });
  });

  describe('deleteEnrollement', () => {
    it('should delete an enrollment and return 404 (logic in controller returns NotFound on delete)', async () => {
      const enrollmentId = 'enroll-123';
      mockReq.params = { id: enrollmentId };
      const removeSpy = jest.spyOn(EnrollementService.prototype, 'remove')
                            .mockResolvedValue(undefined);

      await deleteEnrollement(mockReq as Request, mockRes as Response);

      expect(removeSpy).toHaveBeenCalledWith(enrollmentId);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 404,
          errors: 'Enrollment deleted'
      }));
      
      removeSpy.mockRestore();
    });
  });
});