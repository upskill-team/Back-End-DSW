/**
 * @module Models/Question/Schemas
 * @remarks Defines validation schemas for the Question module.
 */

import * as v from 'valibot';
import { QuestionType } from './question.entity.js';

/**
 * Schema for question payload containing options and correct answer.
 */
const QuestionPayloadSchema = v.object({
  options: v.pipe(
    v.array(v.string()),
    v.minLength(2, 'At least 2 options are required.')
  ),
  correctAnswer: v.union([
    v.pipe(v.number(), v.integer('Correct answer index must be an integer.')),
    v.string(),
  ]),
});

/**
 * Main schema for creating a new question.
 */
export const CreateQuestionSchema = v.object({
  questionText: v.pipe(
    v.string(),
    v.minLength(1, 'Question text is required.')
  ),
  questionType: v.picklist(
    Object.values(QuestionType),
    'Invalid question type.'
  ),
  payload: QuestionPayloadSchema,
  courseId: v.pipe(v.string(), v.minLength(1, 'Course ID is required.')),
});

/**
 * Schema for updating an existing question, making all fields optional except course ID.
 */
export const UpdateQuestionSchema = v.partial(
  v.omit(CreateQuestionSchema, ['courseId'])
);

// Infer TypeScript types from the schemas for strong typing.
export type CreateQuestionType = v.InferOutput<typeof CreateQuestionSchema>;
export type UpdateQuestionType = v.InferOutput<typeof UpdateQuestionSchema>;
