import * as v from 'valibot';
import {
  CreateQuestionSchema,
  UpdateQuestionSchema,
  ValidateAnswerSchema,
} from './question.schemas';
import { QuestionType } from './question.entity';

describe('Question Schemas - Validation Tests', () => {
  describe('CreateQuestionSchema', () => {
    it('should validate correct question data with numeric correctAnswer', () => {
      // Arrange
      const validData = {
        questionText: 'What is 2+2?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['2', '3', '4', '5'],
          correctAnswer: 2,
        },
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate correct question data with string correctAnswer', () => {
      // Arrange
      const validData = {
        questionText: 'What is the capital of France?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['Paris', 'London'],
          correctAnswer: 'Paris',
        },
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate question with unitNumber', () => {
      // Arrange
      const validData = {
        questionText: 'Test question',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['A', 'B'],
          correctAnswer: 0,
        },
        unitNumber: 1,
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should fail if questionText is empty', () => {
      // Arrange
      const invalidData = {
        questionText: '',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['A', 'B'],
          correctAnswer: 0,
        },
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should fail if options array has less than 2 elements', () => {
      // Arrange
      const invalidData = {
        questionText: 'Test?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['A'],
          correctAnswer: 0,
        },
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should fail if questionType is invalid', () => {
      // Arrange
      const invalidData = {
        questionText: 'Test?',
        questionType: 'InvalidType',
        payload: {
          options: ['A', 'B'],
          correctAnswer: 0,
        },
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should fail if unitNumber is not positive', () => {
      // Arrange
      const invalidData = {
        questionText: 'Test?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['A', 'B'],
          correctAnswer: 0,
        },
        unitNumber: 0,
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should fail if unitNumber is not an integer', () => {
      // Arrange
      const invalidData = {
        questionText: 'Test?',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['A', 'B'],
          correctAnswer: 0,
        },
        unitNumber: 1.5,
      };

      // Act
      const result = v.safeParse(CreateQuestionSchema, invalidData);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateQuestionSchema', () => {
    it('should validate partial update data', () => {
      // Arrange
      const updateData = {
        questionText: 'Updated question',
      };

      // Act
      const result = v.safeParse(UpdateQuestionSchema, updateData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate empty update data', () => {
      // Arrange
      const updateData = {};

      // Act
      const result = v.safeParse(UpdateQuestionSchema, updateData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate update with all fields', () => {
      // Arrange
      const updateData = {
        questionText: 'Updated',
        questionType: QuestionType.MultipleChoiceOption,
        payload: {
          options: ['A', 'B', 'C'],
          correctAnswer: 1,
        },
        unitNumber: 2,
      };

      // Act
      const result = v.safeParse(UpdateQuestionSchema, updateData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('ValidateAnswerSchema', () => {
    it('should validate numeric answer', () => {
      // Arrange
      const answerData = {
        answer: 2,
      };

      // Act
      const result = v.safeParse(ValidateAnswerSchema, answerData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate string answer', () => {
      // Arrange
      const answerData = {
        answer: 'Paris',
      };

      // Act
      const result = v.safeParse(ValidateAnswerSchema, answerData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should fail if answer is missing', () => {
      // Arrange
      const answerData = {};

      // Act
      const result = v.safeParse(ValidateAnswerSchema, answerData);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
