/**
 * @module Models/Question/Mappers
 * @remarks Functions to map Question entities to filtered DTOs based on user role.
 */

import { Question } from './question.entity.js';
import { wrap } from '@mikro-orm/core';
import {
  QuestionStudentResponse,
  QuestionProfessorResponse,
} from './question.dtos.js';

/**
 * Maps a question to student view (NO correct answer information)
 */
export function mapQuestionToStudent(
  question: Question
): QuestionStudentResponse {
  const wrappedQuestion = wrap(question).toObject();

  return {
    id: question.id!,
    questionText: question.questionText,
    questionType: question.questionType,
    points: wrappedQuestion.points,
    payload: {
      options: question.payload.options,
      // correctAnswer is intentionally omitted
    },
  };
}

/**
 * Maps a question to professor view (includes correct answer)
 */
export function mapQuestionToProfessor(
  question: Question
): QuestionProfessorResponse {
  const wrappedQuestion = wrap(question).toObject();

  return {
    id: question.id!,
    questionText: question.questionText,
    questionType: question.questionType,
    points: wrappedQuestion.points,
    unitNumber: question.unitNumber,
    payload: {
      options: question.payload.options,
      correctAnswer: question.payload.correctAnswer,
    },
  };
}

/**
 * Maps an array of questions to student view
 */
export function mapQuestionsToStudent(
  questions: Question[]
): QuestionStudentResponse[] {
  return questions.map(mapQuestionToStudent);
}

/**
 * Maps an array of questions to professor view
 */
export function mapQuestionsToProfessor(
  questions: Question[]
): QuestionProfessorResponse[] {
  return questions.map(mapQuestionToProfessor);
}
