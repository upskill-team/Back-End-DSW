/**
 * @module Models/Question/DTOs
 * @remarks Schemas for filtering question data based on user role.
 */

import * as v from 'valibot';

/**
 * Schema for question options visible to students (without correctness indicator)
 */
export const QuestionOptionStudentSchema = v.object({
  id: v.string(),
  text: v.string(),
});

/**
 * Schema for question visible to students (no correct answers)
 */
export const QuestionStudentSchema = v.object({
  id: v.string(),
  questionText: v.string(),
  questionType: v.string(),
  points: v.optional(v.number()),
  payload: v.object({
    options: v.array(v.string()),
  }),
});

/**
 * Schema for full question with answers (for professors only)
 */
export const QuestionProfessorSchema = v.object({
  id: v.string(),
  questionText: v.string(),
  questionType: v.string(),
  points: v.optional(v.number()),
  unitNumber: v.optional(v.number()),
  payload: v.object({
    options: v.array(v.string()),
    correctAnswer: v.union([v.number(), v.string()]),
  }),
});

export type QuestionStudentResponse = v.InferOutput<
  typeof QuestionStudentSchema
>;
export type QuestionProfessorResponse = v.InferOutput<
  typeof QuestionProfessorSchema
>;
