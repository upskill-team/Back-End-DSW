import { Request, Response } from 'express';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import * as questionController from './question.controller';
import { QuestionService } from './question.services';
import { UserRole } from '../user/user.entity';
import { QuestionType } from './question.entity';
import * as professorHelper from '../../shared/utils/professor.helper.js';

// Mock ORM first
jest.mock('../../shared/db/orm.js', () => ({
  orm: {
    em: {
      fork: jest.fn(() => ({
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        persistAndFlush: jest.fn(),
        removeAndFlush: jest.fn(),
      })),
    },
  },
}));

// Mock mappers
jest.mock('./question.mappers.js', () => ({
  mapQuestionToStudent: jest.fn((q) => ({
    ...q,
    payload: { options: q.payload.options },
  })),
  mapQuestionToProfessor: jest.fn((q) => q),
}));

// Mock dependencies
jest.mock('./question.services');
jest.mock('../../shared/utils/professor.helper.js', () => ({
  getProfessorIdFromUserId: jest.fn().mockResolvedValue('prof-123'),
}));

describe('Question Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockEm: jest.Mocked<EntityManager>;
  let requestContextSpy: jest.SpyInstance;

  beforeEach(() => {
    mockEm = {} as jest.Mocked<EntityManager>;
    requestContextSpy = jest
      .spyOn(RequestContext, 'getEntityManager')
      .mockReturnValue(mockEm);

    mockReq = {
      body: {},
      params: {},
      user: { id: 'user-123', role: UserRole.PROFESSOR },
      log: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } as any,
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

  describe('add', () => {
    it('should create a question and return 201', async () => {
      // Arrange
      const questionData = {
        questionText: 'What is 2+2?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['2', '3', '4', '5'], correctAnswer: 2 },
      };
      const newQuestion = { id: 'q-1', ...questionData };
      mockReq.params = { courseId: 'course-1' };
      mockReq.body = questionData;
      const createSpy = jest
        .spyOn(QuestionService.prototype, 'create')
        .mockResolvedValue(newQuestion as any);

      // Act
      await questionController.add(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 201,
          data: newQuestion,
        })
      );

      createSpy.mockRestore();
    });

    it('should return 404 if course not found', async () => {
      // Arrange
      mockReq.params = { courseId: 'invalid-course' };
      mockReq.body = { questionText: 'Test?' };
      const createSpy = jest
        .spyOn(QuestionService.prototype, 'create')
        .mockRejectedValue(
          Object.assign(new Error('Course not found'), {
            name: 'NotFoundError',
          })
        );

      // Act
      await questionController.add(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      createSpy.mockRestore();
    });

    it('should return 401 if user is not a professor', async () => {
      // Arrange
      const mockGetProfessorId =
        professorHelper.getProfessorIdFromUserId as jest.MockedFunction<
          typeof professorHelper.getProfessorIdFromUserId
        >;
      mockGetProfessorId.mockRejectedValueOnce(
        new Error('User does not have a professor profile')
      );
      mockReq.params = { courseId: 'course-1' };
      mockReq.body = { questionText: 'Test?' };

      // Act
      await questionController.add(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('findByCourse', () => {
    it('should return questions for a course', async () => {
      // Arrange
      const questions = [{ id: 'q-1', questionText: 'Test' }];
      mockReq.params = { courseId: 'course-1' };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findByCourse')
        .mockResolvedValue(questions as any);

      // Act
      await questionController.findByCourse(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: questions })
      );

      findSpy.mockRestore();
    });

    it('should return 401 if user is not a professor', async () => {
      // Arrange
      const mockGetProfessorId =
        professorHelper.getProfessorIdFromUserId as jest.MockedFunction<
          typeof professorHelper.getProfessorIdFromUserId
        >;
      mockGetProfessorId.mockRejectedValueOnce(
        new Error('User does not have a professor profile')
      );
      mockReq.params = { courseId: 'course-1' };

      // Act
      await questionController.findByCourse(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('findMyQuestions', () => {
    it('should return all questions by professor', async () => {
      // Arrange
      const questions = [{ id: 'q-1' }, { id: 'q-2' }];
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findByProfessor')
        .mockResolvedValue(questions as any);

      // Act
      await questionController.findMyQuestions(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: questions })
      );

      findSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should return filtered question for students', async () => {
      // Arrange
      mockReq.user = { id: 'user-123', role: UserRole.STUDENT };
      mockReq.params = { id: 'q-1', courseId: 'course-1' };
      const question = {
        id: 'q-1',
        questionText: 'Test',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['A', 'B'], correctAnswer: 0 },
      };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockResolvedValue(question as any);
      const isProfSpy = jest
        .spyOn(QuestionService.prototype, 'isProfessorOwnerOfCourse')
        .mockResolvedValue(false);

      // Act
      await questionController.findOne(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      findSpy.mockRestore();
      isProfSpy.mockRestore();
    });

    it('should return full question for course owner professor', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1' };
      const question = {
        id: 'q-1',
        questionText: 'Test',
        questionType: QuestionType.MultipleChoiceOption,
        payload: { options: ['A', 'B'], correctAnswer: 0 },
      };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockResolvedValue(question as any);
      const isProfSpy = jest
        .spyOn(QuestionService.prototype, 'isProfessorOwnerOfCourse')
        .mockResolvedValue(true);

      // Act
      await questionController.findOne(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      findSpy.mockRestore();
      isProfSpy.mockRestore();
    });

    it('should return 404 if question not found', async () => {
      // Arrange
      mockReq.params = { id: 'invalid', courseId: 'course-1' };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockRejectedValue(
          Object.assign(new Error('Not found'), { name: 'NotFoundError' })
        );

      // Act
      await questionController.findOne(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      findSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should update question and return 200', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1' };
      mockReq.body = { questionText: 'Updated question' };
      const updatedQuestion = { id: 'q-1', questionText: 'Updated question' };
      const updateSpy = jest
        .spyOn(QuestionService.prototype, 'update')
        .mockResolvedValue(updatedQuestion as any);

      // Act
      await questionController.update(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: updatedQuestion })
      );

      updateSpy.mockRestore();
    });

    it('should return 404 if question not found', async () => {
      // Arrange
      mockReq.params = { id: 'invalid', courseId: 'course-1' };
      mockReq.body = { questionText: 'Test' };
      const updateSpy = jest
        .spyOn(QuestionService.prototype, 'update')
        .mockRejectedValue(
          Object.assign(new Error('Not found'), { name: 'NotFoundError' })
        );

      // Act
      await questionController.update(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      updateSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should delete question and return success message', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1' };
      const removeSpy = jest
        .spyOn(QuestionService.prototype, 'remove')
        .mockResolvedValue(undefined);

      // Act
      await questionController.remove(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { message: 'Question deleted successfully' },
        })
      );

      removeSpy.mockRestore();
    });
  });

  describe('validateAnswer', () => {
    it('should validate answer and return result', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1' };
      mockReq.body = { answer: 2 };
      const validateSpy = jest
        .spyOn(QuestionService.prototype, 'validateAnswer')
        .mockResolvedValue({ isCorrect: true });

      // Act
      await questionController.validateAnswer(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isCorrect: true },
        })
      );

      validateSpy.mockRestore();
    });

    it('should return 404 if question not found', async () => {
      // Arrange
      mockReq.params = { id: 'invalid', courseId: 'course-1' };
      mockReq.body = { answer: 2 };
      const validateSpy = jest
        .spyOn(QuestionService.prototype, 'validateAnswer')
        .mockRejectedValue(
          Object.assign(new Error('Not found'), { name: 'NotFoundError' })
        );

      // Act
      await questionController.validateAnswer(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      validateSpy.mockRestore();
    });
  });

  describe('addToUnit', () => {
    it('should create question in unit', async () => {
      // Arrange
      mockReq.params = { courseId: 'course-1', unitNumber: '1' };
      mockReq.body = { questionText: 'Test' };
      const newQuestion = { id: 'q-1', questionText: 'Test', unitNumber: 1 };
      const createSpy = jest
        .spyOn(QuestionService.prototype, 'create')
        .mockResolvedValue(newQuestion as any);

      // Act
      await questionController.addToUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);

      createSpy.mockRestore();
    });

    it('should return 404 if unit not found', async () => {
      // Arrange
      mockReq.params = { courseId: 'course-1', unitNumber: '99' };
      mockReq.body = { questionText: 'Test' };
      const createSpy = jest
        .spyOn(QuestionService.prototype, 'create')
        .mockRejectedValue(new Error('Unit 99 not found'));

      // Act
      await questionController.addToUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      createSpy.mockRestore();
    });
  });

  describe('findGeneralQuestions', () => {
    it('should return general questions', async () => {
      // Arrange
      mockReq.params = { courseId: 'course-1' };
      const questions = [{ id: 'q-1', unitNumber: null }];
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findGeneralQuestions')
        .mockResolvedValue(questions as any);

      // Act
      await questionController.findGeneralQuestions(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      findSpy.mockRestore();
    });
  });

  describe('findByUnit', () => {
    it('should return questions for unit', async () => {
      // Arrange
      mockReq.params = { courseId: 'course-1', unitNumber: '1' };
      const questions = [{ id: 'q-1', unitNumber: 1 }];
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findByUnit')
        .mockResolvedValue(questions as any);

      // Act
      await questionController.findByUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      findSpy.mockRestore();
    });

    it('should return 404 if unit not found', async () => {
      // Arrange
      mockReq.params = { courseId: 'course-1', unitNumber: '99' };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findByUnit')
        .mockRejectedValue(new Error('Unit 99 not found'));

      // Act
      await questionController.findByUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      findSpy.mockRestore();
    });
  });

  describe('findOneFromUnit', () => {
    it('should return question from unit for professor owner', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1', unitNumber: '1' };
      const question = {
        id: 'q-1',
        unitNumber: 1,
        payload: { options: ['A'], correctAnswer: 0 },
      };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockResolvedValue(question as any);
      const isProfSpy = jest
        .spyOn(QuestionService.prototype, 'isProfessorOwnerOfCourse')
        .mockResolvedValue(true);

      // Act
      await questionController.findOneFromUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      findSpy.mockRestore();
      isProfSpy.mockRestore();
    });

    it('should return 404 if question not in specified unit', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1', unitNumber: '1' };
      const question = { id: 'q-1', unitNumber: 2 };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockResolvedValue(question as any);

      // Act
      await questionController.findOneFromUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      findSpy.mockRestore();
    });
  });

  describe('updateFromUnit', () => {
    it('should update question from unit', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1', unitNumber: '1' };
      mockReq.body = { questionText: 'Updated' };
      const updatedQuestion = {
        id: 'q-1',
        questionText: 'Updated',
        unitNumber: 1,
      };
      const updateSpy = jest
        .spyOn(QuestionService.prototype, 'update')
        .mockResolvedValue(updatedQuestion as any);

      // Act
      await questionController.updateFromUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      updateSpy.mockRestore();
    });
  });

  describe('removeFromUnit', () => {
    it('should remove question from unit', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1', unitNumber: '1' };
      const question = { id: 'q-1', unitNumber: 1 };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockResolvedValue(question as any);
      const removeSpy = jest
        .spyOn(QuestionService.prototype, 'remove')
        .mockResolvedValue(undefined);

      // Act
      await questionController.removeFromUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      findSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should return 404 if question not in specified unit', async () => {
      // Arrange
      mockReq.params = { id: 'q-1', courseId: 'course-1', unitNumber: '1' };
      const question = { id: 'q-1', unitNumber: 2 };
      const findSpy = jest
        .spyOn(QuestionService.prototype, 'findOne')
        .mockResolvedValue(question as any);

      // Act
      await questionController.removeFromUnit(
        mockReq as Request,
        mockRes as Response
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);

      findSpy.mockRestore();
    });
  });
});
