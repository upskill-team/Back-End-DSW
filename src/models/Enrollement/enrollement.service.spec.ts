import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { EnrollementService } from './enrollement.service';
import { Enrollement, EnrollmentState } from './enrollement.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';

// --- Helpers para crear Mocks ---
const mockStudent = { id: 'student-id-123', courses: { add: jest.fn(), remove: jest.fn() } } as unknown as Student;
const mockCourse = { id: 'course-id-456' } as unknown as Course;

describe('EnrollementService', () => {
  let service: EnrollementService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    // --- SOLUCIÓN PARA el Error 'mockResolvedValueOnce' ---
    // En lugar de definir findOne como un mock simple, lo definimos
    // con las propiedades que Jest necesita.
    mockEm = {
      findOne: jest.fn(), // <--- findOne ahora es un mock de Jest completo
      find: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
      transactional: jest.fn().mockImplementation(cb => cb(mockEm)),
    } as any;
    
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;
    service = new EnrollementService(mockEm, mockLogger);

    // --- SOLUCIÓN FINAL PARA Date.now ---
    // Guardamos el Date original.
    const OriginalDate = global.Date;
    // Creamos una fecha fija para nuestras pruebas.
    const testDate = new Date('2025-10-26T10:00:00Z');
    
    // Creamos un spy que solo intercepta `new Date()` sin argumentos.
    dateSpy = jest.spyOn(global, 'Date')
      .mockImplementation((...args) => {
        if (args.length) {
          // Si se llama con argumentos (ej. `new Date('...')`), usa el constructor real.
          return new OriginalDate(...args);
        }
        // Si se llama sin argumentos (`new Date()`), devuelve nuestra fecha fija.
        return testDate;
      });
    // Esto es crucial: nos aseguramos de que el `Date` mockeado siga teniendo
    // todos los métodos estáticos (`now`, `parse`, etc.) del original.
    Object.setPrototypeOf(dateSpy, OriginalDate);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restauramos el objeto Date global a su estado original.
    dateSpy.mockRestore();
  });

  // --- El resto de las pruebas no necesita cambios ---
  
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
      await service.create({ studentId, courseId });

      // Assert
      const persistedEnrollment = mockEm.persistAndFlush.mock.calls[0][0] as Enrollement;
      
      expect(persistedEnrollment.state).toBe(EnrollmentState.ENROLLED);
      expect(persistedEnrollment.enrolledAt).toEqual(new Date('2025-10-26T10:00:00Z'));
      
      expect(mockStudent.courses.add).toHaveBeenCalledWith(mockCourse);
    });

    // ... las demás pruebas de 'create' no cambian
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

    // ... las demás pruebas de 'update' no cambian
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

      // ... las demás pruebas de 'remove' no cambian
       it('should throw an error if enrollment to remove is not found', async () => {
        mockEm.findOne.mockResolvedValue(null);
        await expect(service.remove('non-existent')).rejects.toThrow('Enrollment not found');
    });
  });
});