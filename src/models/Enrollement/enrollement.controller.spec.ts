// src/enrollement/enrollement.controller.spec.ts

import { Request, Response } from 'express';
// ¡Importante! Importamos RequestContext para poder espiarlo.
import { EntityManager, RequestContext } from '@mikro-orm/core';
import {
  createEnrollement,
  getEnrollementById,
  updateEnrollement,
  deleteEnrollement,
  // Ya no importamos 'setGetEmFromReq'
} from './enrollement.controller';
import EnrollementService from './enrollement.service';
import { Enrollement } from './enrollement.entity';

describe('Enrollement Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockEm: jest.Mocked<EntityManager>;
  let requestContextSpy: jest.SpyInstance; // Variable para nuestro "espía"

  beforeEach(() => {
    // Creamos nuestro EntityManager falso, que es lo que queremos "inyectar"
    mockEm = {} as jest.Mocked<EntityManager>;

    // --- ¡LA CLAVE DE LA SOLUCIÓN! ---
    // Interceptamos la llamada a RequestContext.getEntityManager()
    // y forzamos a que devuelva nuestro EntityManager falso.
    requestContextSpy = jest.spyOn(RequestContext, 'getEntityManager').mockReturnValue(mockEm);

    // Configuramos los mocks de req y res
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // Limpiamos todos los mocks (excepto el espía)
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Es VITAL restaurar el espía después de cada prueba para no afectar a otros tests.
    requestContextSpy.mockRestore();
  });

  // --- Pruebas para createEnrollement ---
  describe('createEnrollement', () => {
    it('should create an enrollment and return 201', async () => {
      // Arrange
      const newEnrolmentData = { studentId: 'student-1', courseId: 'course-1' };
      const createdEnrolment = new Enrollement();
      mockReq.body = newEnrolmentData;
      const createServiceSpy = jest.spyOn(EnrollementService.prototype, 'create')
                                   .mockResolvedValue(createdEnrolment);

      // Act
      await createEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(RequestContext.getEntityManager).toHaveBeenCalled(); // Verificamos que se pidió el EM
      expect(createServiceSpy).toHaveBeenCalledWith(newEnrolmentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdEnrolment);
      
      createServiceSpy.mockRestore();
    });

    it('should return 400 if studentId or courseId is missing', async () => {
      // Arrange
      mockReq.body = { studentId: 'student-1' };
      const createServiceSpy = jest.spyOn(EnrollementService.prototype, 'create');

      // Act
      await createEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(createServiceSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'studentId and courseId are required' });
      
      createServiceSpy.mockRestore();
    });
    
    it('should return 500 if the service throws an error', async () => {
        // Arrange
        mockReq.body = { studentId: 'student-1', courseId: 'course-1' };
        const errorMessage = 'Database error';
        const createServiceSpy = jest.spyOn(EnrollementService.prototype, 'create')
                                     .mockRejectedValue(new Error(errorMessage));
        
        // Act
        await createEnrollement(mockReq as Request, mockRes as Response);
        
        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });

        createServiceSpy.mockRestore();
    });
  });

  // --- Pruebas para getEnrollementById ---
  describe('getEnrollementById', () => {
    it('should return an enrollment and 200 if found', async () => {
      // Arrange
      const enrollmentId = 'enroll-123';
      const foundEnrolment = new Enrollement();
      mockReq.params = { id: enrollmentId };
      const findByIdSpy = jest.spyOn(EnrollementService.prototype, 'findById')
                              .mockResolvedValue(foundEnrolment);

      // Act
      await getEnrollementById(mockReq as Request, mockRes as Response);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(enrollmentId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(foundEnrolment);
      
      findByIdSpy.mockRestore();
    });
    
    it('should return 404 if enrollment is not found', async () => {
        // Arrange
        mockReq.params = { id: 'non-existent-id' };
        const findByIdSpy = jest.spyOn(EnrollementService.prototype, 'findById')
                                .mockResolvedValue(null);

        // Act
        await getEnrollementById(mockReq as Request, mockRes as Response);
        
        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' });
        
        findByIdSpy.mockRestore();
    });
  });

  // --- Pruebas para updateEnrollement ---
  describe('updateEnrollement', () => {
    it('should update an enrollment and return 200', async () => {
      // Arrange
      const enrollmentId = 'enroll-123';
      const updateData = { progress: 50 };
      const updatedEnrolment = new Enrollement();
      
      mockReq.params = { id: enrollmentId };
      mockReq.body = updateData;

      const updateSpy = jest.spyOn(EnrollementService.prototype, 'update')
                            .mockResolvedValue(updatedEnrolment);

      // Act
      await updateEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(updateSpy).toHaveBeenCalledWith(enrollmentId, expect.objectContaining(updateData));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedEnrolment);

      updateSpy.mockRestore();
    });

    it('should return 400 for an invalid state', async () => {
      // Arrange
      mockReq.params = { id: 'enroll-123' };
      mockReq.body = { state: 'invalid-state' };
      const updateSpy = jest.spyOn(EnrollementService.prototype, 'update');

      // Act
      await updateEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(updateSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'invalid state' });

      updateSpy.mockRestore();
    });
  });

  // --- Pruebas para deleteEnrollement ---
  describe('deleteEnrollement', () => {
    it('should delete an enrollment and return 204', async () => {
      // Arrange
      const enrollmentId = 'enroll-123';
      mockReq.params = { id: enrollmentId };
      const removeSpy = jest.spyOn(EnrollementService.prototype, 'remove')
                            .mockResolvedValue(undefined);

      // Act
      await deleteEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(removeSpy).toHaveBeenCalledWith(enrollmentId);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
      
      removeSpy.mockRestore();
    });
  });
});