import 'reflect-metadata';
import { QuestionService } from './question.services';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { ObjectId } from '@mikro-orm/mongodb';
import { QuestionType } from './question.entity';

describe('QuestionService - Unit Tests', () => {
  let questionService: QuestionService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockEm = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    mockLogger = {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    questionService = new QuestionService(mockEm, mockLogger);
    jest.clearAllMocks();
  });

  describe('validateAnswer', () => {
    it('should validate correct numeric answer', async () => {
      // Arrange
      const questionId = new ObjectId();
      const question = {
        _id: questionId,
        payload: { options: ['A', 'B', 'C'], correctAnswer: 1 },
      };
      mockEm.findOneOrFail.mockResolvedValue(question as any);

      // Act
      const result = await questionService.validateAnswer(
        questionId.toString(),
        { answer: 1 }
      );

      // Assert
      expect(result.isCorrect).toBe(true);
    });

    it('should validate incorrect numeric answer', async () => {
      // Arrange
      const questionId = new ObjectId();
      const question = {
        _id: questionId,
        payload: { options: ['A', 'B', 'C'], correctAnswer: 1 },
      };
      mockEm.findOneOrFail.mockResolvedValue(question as any);

      // Act
      const result = await questionService.validateAnswer(
        questionId.toString(),
        { answer: 0 }
      );

      // Assert
      expect(result.isCorrect).toBe(false);
    });

    it('should validate string answers case-insensitively', async () => {
      // Arrange
      const questionId = new ObjectId();
      const question = {
        _id: questionId,
        payload: { options: [], correctAnswer: 'Paris' },
      };
      mockEm.findOneOrFail.mockResolvedValue(question as any);

      // Act
      const result = await questionService.validateAnswer(
        questionId.toString(),
        { answer: 'paris' }
      );

      // Assert
      expect(result.isCorrect).toBe(true);
    });

    it('should handle mixed type comparison', async () => {
      // Arrange
      const questionId = new ObjectId();
      const question = {
        _id: questionId,
        payload: { options: [], correctAnswer: '2' },
      };
      mockEm.findOneOrFail.mockResolvedValue(question as any);

      // Act
      const result = await questionService.validateAnswer(
        questionId.toString(),
        { answer: 2 }
      );

      // Assert - Verificar conversión de tipos automática
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('create', () => {
    it('should create question for course', async () => {
      // Arrange
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const questionData = {
        questionText: 'What is 2+2?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['2', '3', '4', '5'], correctAnswer: 2 },
      };
      const course = {
        _id: courseId,
        units: [],
        professor: professorId,
      };
      mockEm.findOneOrFail.mockResolvedValue(course as any);

      // Act
      await questionService.create(
        questionData,
        courseId.toString(),
        professorId.toString()
      );

      // Assert
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });

    it('should create question with unit number', async () => {
      // Arrange
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const questionData = {
        questionText: 'Test?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['A', 'B'], correctAnswer: 0 },
        unitNumber: 1,
      };
      const course = {
        _id: courseId,
        units: [{ unitNumber: 1, questions: [] }],
        professor: professorId,
      };
      mockEm.findOneOrFail.mockResolvedValue(course as any);

      // Act
      await questionService.create(
        questionData,
        courseId.toString(),
        professorId.toString()
      );

      // Assert
      expect(mockEm.persistAndFlush).toHaveBeenCalledTimes(2);
    });

    it('should throw error if unit does not exist', async () => {
      // Arrange
      const questionData = {
        questionText: 'Test?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['A'], correctAnswer: 0 },
        unitNumber: 99,
      };
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [{ unitNumber: 1, questions: [] }],
      };
      mockEm.findOneOrFail.mockResolvedValue(course as any);

      // Act & Assert
      await expect(
        questionService.create(
          questionData,
          courseId.toString(),
          professorId.toString()
        )
      ).rejects.toThrow('Unit 99 not found');
    });
  });

  describe('findByCourse', () => {
    it('should return all questions for course', async () => {
      // Arrange
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        professor: professorId,
      };
      const questions = [
        { _id: new ObjectId(), questionText: 'Q1' },
        { _id: new ObjectId(), questionText: 'Q2' },
      ];
      mockEm.findOneOrFail.mockResolvedValue(course as any);
      mockEm.find.mockResolvedValue(questions as any);

      // Act
      const result = await questionService.findByCourse(
        courseId.toString(),
        professorId.toString()
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(mockEm.find).toHaveBeenCalled();
    });
  });

  describe('findByUnit', () => {
    it('should return questions for specific unit', async () => {
      // Arrange
      const courseId = new ObjectId();
      const unitNumber = 1;
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [{ unitNumber: 1, questions: [] }],
        professor: professorId,
      };
      const questions = [{ _id: new ObjectId(), unitNumber: 1 }];
      mockEm.findOneOrFail.mockResolvedValue(course as any);
      mockEm.find.mockResolvedValue(questions as any);

      // Act
      const result = await questionService.findByUnit(
        courseId.toString(),
        unitNumber,
        professorId.toString()
      );

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should throw error if unit does not exist', async () => {
      // Arrange 
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [{ unitNumber: 1, questions: [] }],
      };
      mockEm.findOneOrFail.mockResolvedValue(course as any);

      // Act & Assert
      await expect(
        questionService.findByUnit(
          courseId.toString(),
          99,
          professorId.toString()
        )
      ).rejects.toThrow('Unit 99 not found');
    });
  });

  describe('findGeneralQuestions', () => {
    it('should return questions without unit number', async () => {
      // Arrange
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = { _id: courseId };
      const questions = [{ _id: new ObjectId(), unitNumber: null }];
      mockEm.findOneOrFail.mockResolvedValue(course as any);
      mockEm.find.mockResolvedValue(questions as any);

      // Act
      const result = await questionService.findGeneralQuestions(
        courseId.toString(),
        professorId.toString()
      );

      // Assert
      expect(result).toHaveLength(1);
    });
  });

  describe('findByProfessor', () => {
    it('should return all questions by professor', async () => {
      // Arrange
      const professorId = new ObjectId();
      const professorCourses = [
        { _id: new ObjectId() },
        { _id: new ObjectId() },
      ];
      const questions = [
        { _id: new ObjectId() },
        { _id: new ObjectId() },
        { _id: new ObjectId() },
      ];
      mockEm.find.mockResolvedValueOnce(professorCourses as any);
      mockEm.find.mockResolvedValueOnce(questions as any);

      // Act
      const result = await questionService.findByProfessor(
        professorId.toString()
      );

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should return empty array if professor has no courses', async () => {
      // Arrange 
      const professorId = new ObjectId();
      mockEm.find.mockResolvedValue([]);

      // Act 
      const result = await questionService.findByProfessor(
        professorId.toString()
      );

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('isProfessorOwnerOfCourse', () => {
    it('should return true if professor owns course', async () => {
      // Arrange 
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = { _id: courseId };
      mockEm.findOne.mockResolvedValue(course as any);

      // Act 
      const result = await questionService.isProfessorOwnerOfCourse(
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(result).toBe(true);
    });

    it('should return false if professor does not own course', async () => {
      // Arrange 
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      mockEm.findOne.mockResolvedValue(null);

      // Act 
      const result = await questionService.isProfessorOwnerOfCourse(
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      // Arrange 
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      mockEm.findOne.mockRejectedValue(new Error('DB error'));

      // Act 
      const result = await questionService.isProfessorOwnerOfCourse(
        courseId.toString(),
        professorId.toString()
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return question by id', async () => {
      // Arrange 
      const questionId = new ObjectId();
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const question = {
        _id: questionId,
        questionText: 'Test?',
        course: { _id: courseId },
      };
      mockEm.findOneOrFail.mockResolvedValue(question as any);

      // Act 
      const result = await questionService.findOne(
        questionId.toString(),
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(result).toEqual(question);
    });
  });

  describe('update', () => {
    it('should update question', async () => {
      // Arrange 
      const questionId = new ObjectId();
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [],
      };
      const question = {
        _id: questionId,
        questionText: 'Old text',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['A'], correctAnswer: 0 },
        unitNumber: null,
      };
      mockEm.findOneOrFail.mockResolvedValueOnce(course as any);
      mockEm.findOneOrFail.mockResolvedValueOnce(question as any);
      const updateData = { questionText: 'New text' };

      // Act 
      await questionService.update(
        questionId.toString(),
        updateData,
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });

    it('should update question unit number', async () => {
      // Arrange 
      const questionId = new ObjectId();
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [
          { unitNumber: 1, questions: [] },
          { unitNumber: 2, questions: [] },
        ],
      };
      const question = {
        _id: questionId,
        questionText: 'Test',
        unitNumber: 1,
      };
      mockEm.findOneOrFail.mockResolvedValueOnce(course as any);
      mockEm.findOneOrFail.mockResolvedValueOnce(question as any);
      const updateData = { unitNumber: 2 };

      // Act 
      await questionService.update(
        questionId.toString(),
        updateData,
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw error if new unit does not exist', async () => {
      // Arrange 
      const questionId = new ObjectId();
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [{ unitNumber: 1, questions: [] }],
      };
      const question = { _id: questionId, unitNumber: 1 };
      mockEm.findOneOrFail.mockResolvedValueOnce(course as any);
      mockEm.findOneOrFail.mockResolvedValueOnce(question as any);
      const updateData = { unitNumber: 99 };

      // Act & Assert 
      await expect(
        questionService.update(
          questionId.toString(),
          updateData,
          courseId.toString(),
          professorId.toString()
        )
      ).rejects.toThrow('Unit 99 not found');
    });
  });

  describe('remove', () => {
    it('should remove question without unit', async () => {
      // Arrange 
      const questionId = new ObjectId();
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [],
      };
      const question = {
        _id: questionId,
        unitNumber: null,
      };
      mockEm.findOneOrFail.mockResolvedValueOnce(course as any);
      mockEm.findOneOrFail.mockResolvedValueOnce(question as any);

      // Act 
      await questionService.remove(
        questionId.toString(),
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(question);
    });

    it('should remove question from unit and delete', async () => {
      // Arrange 
      const questionId = new ObjectId();
      const courseId = new ObjectId();
      const professorId = new ObjectId();
      const course = {
        _id: courseId,
        units: [
          {
            unitNumber: 1,
            questions: [questionId],
          },
        ],
      };
      const question = {
        _id: questionId,
        unitNumber: 1,
      };
      mockEm.findOneOrFail.mockResolvedValueOnce(course as any);
      mockEm.findOneOrFail.mockResolvedValueOnce(question as any);

      // Act 
      await questionService.remove(
        questionId.toString(),
        courseId.toString(),
        professorId.toString()
      );

      // Assert 
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(course);
      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(question);
    });
  });
});
