// src/enrollement/enrollement.service.spec.ts

import { EntityManager } from '@mikro-orm/core';
import { EnrollementService } from './enrollement.service';
import { Enrollement, EnrollmentState } from './enrollement.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';

// --- Helpers para crear Mocks ---
// Crearemos instancias falsas de Student y Course para usar en las pruebas.
const mockStudent = {
  id: 'student-id-123',
  courses: {
    add: jest.fn(),
    remove: jest.fn(),
  },
} as unknown as Student;

const mockCourse = {
  id: 'course-id-456',
} as unknown as Course;

// Describimos el conjunto de pruebas para EnrollementService
describe('EnrollementService', () => {
  let service: EnrollementService;
  let mockEm: jest.Mocked<EntityManager>;

  // Antes de cada prueba, reseteamos el servicio y el mock del EntityManager.
  beforeEach(() => {
    // Simulamos `transactional` para que simplemente ejecute la función que le pasamos.
    // Esto nos permite probar la lógica DENTRO de la transacción sin una BD real.
    const transactionalMock = jest.fn().mockImplementation(cb => cb(mockEm));

    // Creamos un mock completo del EntityManager
    mockEm = {
      findOne: jest.fn(),
      find: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
      transactional: transactionalMock,
    } as unknown as jest.Mocked<EntityManager>;

    // Instanciamos el servicio con el EntityManager falso
    service = new EnrollementService(mockEm);
    
    // Reseteamos los mocks antes de cada test para asegurar que están limpios
    jest.clearAllMocks();
  });

  // Testeamos que la instancia del servicio se crea correctamente.
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Pruebas para el método `create` ---
  describe('create', () => {
    it('should create a new enrollment successfully', async () => {
      // Arrange: Preparamos el escenario
      mockEm.findOne
        .mockResolvedValueOnce(mockStudent) // Primera llamada a findOne devuelve el estudiante
        .mockResolvedValueOnce(mockCourse)   // Segunda llamada devuelve el curso
        .mockResolvedValueOnce(null);        // Tercera llamada (la de 'already') no encuentra nada

      // Act: Ejecutamos el método
      const enrollmentData = { studentId: 'student-id-123', courseId: 'course-id-456' };
      const result = await service.create(enrollmentData);

      // Assert: Verificamos que todo se llamó como se esperaba
      expect(mockEm.persistAndFlush).toHaveBeenCalledTimes(2); // Una para el enrol y otra para el student
      expect(mockStudent.courses.add).toHaveBeenCalledWith(mockCourse);
      expect(result).toBeInstanceOf(Enrollement);
      expect(result.state).toBe(EnrollmentState.ENROLLED);
    });

    it('should throw an error if student is not found', async () => {
      // Arrange
      mockEm.findOne.mockResolvedValue(null); // Simulamos que no se encuentra al estudiante
      
      // Act & Assert
      await expect(service.create({ studentId: 'non-existent', courseId: 'course-id-456' }))
        .rejects.toThrow('Student not found');
    });

    it('should throw an error if course is not found', async () => {
      // Arrange
      mockEm.findOne
        .mockResolvedValueOnce(mockStudent) // Estudiante sí se encuentra
        .mockResolvedValueOnce(null);        // Curso no se encuentra
      
      // Act & Assert
      await expect(service.create({ studentId: 'student-id-123', courseId: 'non-existent' }))
        .rejects.toThrow('Course not found');
    });

    it('should throw an error if enrollment already exists', async () => {
      // Arrange
      mockEm.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(new Enrollement()); // La inscripción ya existe

      // Act & Assert
      await expect(service.create({ studentId: 'student-id-123', courseId: 'course-id-456' }))
        .rejects.toThrow('Enrollment already exists');
    });
  });

  // --- Pruebas para el método `update` ---
  describe('update', () => {
    it('should update an enrollment state and progress', async () => {
      // Arrange
      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent;
      existingEnrollment.course = mockCourse;
      mockEm.findOne.mockResolvedValue(existingEnrollment);

      const updateData = { state: EnrollmentState.COMPLETED, progress: 50 }; // El estado COMPLETED forzará el progreso a 100

      // Act
      const result = await service.update('enrollment-id', updateData);
      
      // Assert
      expect(mockEm.findOne).toHaveBeenCalledWith(Enrollement, { id: 'enrollment-id' }, expect.any(Object));
      expect(result.state).toBe(EnrollmentState.COMPLETED);
      expect(result.progress).toBe(100); // Verificamos la lógica de negocio
      expect(mockEm.persistAndFlush).toHaveBeenCalledTimes(2);
    });

    it('should remove course from student when state is DROPPED', async () => {
      // Arrange
      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent;
      existingEnrollment.course = mockCourse;
      mockEm.findOne.mockResolvedValue(existingEnrollment);

      // Act
      await service.update('enrollment-id', { state: EnrollmentState.DROPPED });

      // Assert
      expect(mockStudent.courses.remove).toHaveBeenCalledWith(mockCourse);
    });

    it('should throw an error if enrollment to update is not found', async () => {
      // Arrange
      mockEm.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent', {}))
        .rejects.toThrow('Enrollment not found');
    });

        // --- NUEVO TEST PARA PREVENIR LA REGRESIÓN ---
    it('should NOT update progress if the enrollment is already COMPLETED', async () => {
      // Arrange: Preparamos un escenario donde la inscripción ya está completada
      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent;
      existingEnrollment.course = mockCourse;
      existingEnrollment.state = EnrollmentState.COMPLETED; // <-- Estado inicial clave
      existingEnrollment.progress = 100;                     // <-- Progreso inicial clave

      mockEm.findOne.mockResolvedValue(existingEnrollment);

      // Intentamos actualizar el progreso a un valor incorrecto
      const updateData = { progress: 50 };

      // Act: Ejecutamos el método
      const result = await service.update('enrollment-id', updateData);
      
      // Assert: Verificamos que la lógica de negocio protegió los datos
      expect(result.state).toBe(EnrollmentState.COMPLETED); // El estado no debe cambiar
      expect(result.progress).toBe(100); // ¡La aserción más importante! El progreso NO debe bajar a 50.
      expect(mockEm.persistAndFlush).toHaveBeenCalled(); // La operación debe guardarse, pero con los datos correctos.
    });

    // --- TEST COMPLEMENTARIO PARA EL CAMINO FELIZ ---
    it('should update progress correctly if the enrollment is NOT completed', async () => {
      // Arrange: Preparamos un escenario donde la inscripción está en curso
      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent;
      existingEnrollment.course = mockCourse;
      existingEnrollment.state = EnrollmentState.ENROLLED; // <-- Estado inicial clave
      existingEnrollment.progress = 20;

      mockEm.findOne.mockResolvedValue(existingEnrollment);

      const updateData = { progress: 75 };

      // Act
      const result = await service.update('enrollment-id', updateData);
      
      // Assert
      expect(result.state).toBe(EnrollmentState.ENROLLED);
      expect(result.progress).toBe(75); // El progreso SÍ debe actualizarse en este caso.
    });
  });

  // --- Pruebas para el método `remove` ---
  describe('remove', () => {
    it('should remove an enrollment and update student courses', async () => {
      // Arrange
      const existingEnrollment = new Enrollement();
      existingEnrollment.student = mockStudent;
      existingEnrollment.course = mockCourse;
      mockEm.findOne.mockResolvedValue(existingEnrollment);

      // Act
      await service.remove('enrollment-id');
      
      // Assert
      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(existingEnrollment);
      expect(mockStudent.courses.remove).toHaveBeenCalledWith(mockCourse);
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(mockStudent);
    });

    it('should throw an error if enrollment to remove is not found', async () => {
      // Arrange
      mockEm.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('non-existent'))
        .rejects.toThrow('Enrollment not found');
    });
  });
});