// src/enrollement/enrollement.controller.spec.ts

import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import {
  createEnrollement,
  getEnrollementById,
  updateEnrollement,
  deleteEnrollement,
  setGetEmFromReq, // Importamos la función para "inyectar" nuestro mock
} from './enrollement.controller';
import EnrollementService from './enrollement.service';
import { Enrollement } from './enrollement.entity';

// --- Mocking de la Capa de Servicio (¡ahora es opcional!) ---
// Aunque podemos mockear el EM, a veces es más fácil mockear el servicio completo.
// Vamos a hacerlo de ambas maneras para que veas el poder.
// Por ahora, mockearemos el EM, que es el objetivo del refactor.

describe('Enrollement Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockEm: jest.Mocked<EntityManager>;
  
  // Guardamos la función original para restaurarla después de las pruebas
  let originalGetEmFromReq: (req: Request) => EntityManager;

  beforeAll(() => {
    // Importamos la función original UNA SOLA VEZ antes de todas las pruebas.
    // Necesitamos importar dinámicamente para obtener la referencia correcta.
    const controllerModule = jest.requireActual('./enrollement.controller');
    originalGetEmFromReq = controllerModule.getEmFromReq;
  });

  beforeEach(() => {
    // --- Mock del EntityManager ---
    // Creamos un EM falso. No necesita una implementación real porque
    // vamos a mockear los métodos del servicio que lo usan.
    mockEm = {} as jest.Mocked<EntityManager>;

    // --- ¡LA CLAVE DE LA SOLUCIÓN! ---
    // Antes de cada prueba, usamos nuestra función `setGetEmFromReq` para
    // decirle al controlador que, a partir de ahora, debe usar nuestro EM falso.
    setGetEmFromReq(() => mockEm);

    // Creamos objetos de req y res falsos
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // Limpiamos los mocks antes de cada test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Es una buena práctica restaurar la función original después de que
    // todas las pruebas en este archivo hayan terminado.
    setGetEmFromReq(originalGetEmFromReq);
  });
  
  // Ahora, en lugar de mockear el servicio, vamos a espiar su prototipo.
  // Esto nos permite verificar que los métodos correctos fueron llamados en la
  // instancia real que se crea dentro del controlador.
  describe('createEnrollement', () => {
    it('should create an enrollment and return 201', async () => {
      // Arrange
      const newEnrolmentData = { studentId: 'student-1', courseId: 'course-1' };
      const createdEnrolment = new Enrollement();
      mockReq.body = newEnrolmentData;

      // Espiamos el método 'create' del prototipo de EnrollementService
      const createSpy = jest.spyOn(EnrollementService.prototype, 'create')
                            .mockResolvedValue(createdEnrolment);

      // Act
      await createEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(newEnrolmentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdEnrolment);
      
      createSpy.mockRestore(); // Limpiamos el espía
    });

    it('should return 400 if studentId or courseId is missing', async () => {
      // Arrange
      mockReq.body = { studentId: 'student-1' };
      const createSpy = jest.spyOn(EnrollementService.prototype, 'create');

      // Act
      await createEnrollement(mockReq as Request, mockRes as Response);

      // Assert
      expect(createSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'studentId and courseId are required' });
      
      createSpy.mockRestore();
    });
    
    it('should return 500 if the service throws an error', async () => {
        // Arrange
        mockReq.body = { studentId: 'student-1', courseId: 'course-1' };
        const errorMessage = 'Database error';
        const createSpy = jest.spyOn(EnrollementService.prototype, 'create')
                              .mockRejectedValue(new Error(errorMessage));
        
        // Act
        await createEnrollement(mockReq as Request, mockRes as Response);
        
        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });

        createSpy.mockRestore();
    });
  });

  // El patrón se repite para las demás funciones...
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
    const updatedEnrolment = new Enrollement(); // Un objeto de resultado falso
    
    mockReq.params = { id: enrollmentId };
    mockReq.body = updateData;

    const updateSpy = jest.spyOn(EnrollementService.prototype, 'update')
                          .mockResolvedValue(updatedEnrolment);

    // Act
    await updateEnrollement(mockReq as Request, mockRes as Response);

    // Assert
    expect(updateSpy).toHaveBeenCalledWith(enrollmentId, {
      state: undefined, // El controlador pasa `undefined` si no viene en el body
      grade: undefined,
      progress: 50
    });
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
    expect(updateSpy).not.toHaveBeenCalled(); // El servicio nunca debe ser llamado si la validación falla
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'invalid state' });

    updateSpy.mockRestore();
  });
  
  it('should return 500 if the service throws an error', async () => {
    // Arrange
    const enrollmentId = 'enroll-123';
    const updateData = { progress: 50 };
    const errorMessage = 'Update failed in database';
    
    mockReq.params = { id: enrollmentId };
    mockReq.body = updateData;

    const updateSpy = jest.spyOn(EnrollementService.prototype, 'update')
                          .mockRejectedValue(new Error(errorMessage));

    // Act
    await updateEnrollement(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });

    updateSpy.mockRestore();
  });
});


// --- Pruebas para deleteEnrollement ---
describe('deleteEnrollement', () => {
  it('should delete an enrollment and return 204', async () => {
    // Arrange
    const enrollmentId = 'enroll-123';
    mockReq.params = { id: enrollmentId };

    // El método .remove() no devuelve nada, así que lo resolvemos con undefined.
    const removeSpy = jest.spyOn(EnrollementService.prototype, 'remove')
                          .mockResolvedValue(undefined);

    // Act
    await deleteEnrollement(mockReq as Request, mockRes as Response);

    // Assert
    expect(removeSpy).toHaveBeenCalledWith(enrollmentId);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    // Para 204 No Content, se espera que se llame a .send() sin argumentos, no a .json().
    expect(mockRes.send).toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();

    removeSpy.mockRestore();
  });

  it('should return 500 if the service fails to delete', async () => {
    // Arrange
    const enrollmentId = 'enroll-123';
    const errorMessage = 'Deletion failed';
    mockReq.params = { id: enrollmentId };

    const removeSpy = jest.spyOn(EnrollementService.prototype, 'remove')
                          .mockRejectedValue(new Error(errorMessage));

    // Act
    await deleteEnrollement(mockReq as Request, mockRes as Response);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });

    removeSpy.mockRestore();
  });
});
});