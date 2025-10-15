/**
 * @module Models/Assessment/Schemas
 * @remarks Defines validation schemas for the Assessment module.
 */

import * as v from 'valibot';

/**
 * Schema for creating a new assessment.
 */
export const CreateAssessmentSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Assessment title is required.')),
  description: v.optional(v.string()),
  courseId: v.pipe(v.string(), v.minLength(1, 'Course ID is required.')),
  questionIds: v.pipe(
    v.array(v.string()),
    v.minLength(1, 'At least one question is required.')
  ),
  durationMinutes: v.optional(v.nullable(v.pipe(v.number(), v.minValue(1)))),
  passingScore: v.optional(
    v.pipe(
      v.number(),
      v.minValue(0, 'Passing score must be at least 0.'),
      v.maxValue(100, 'Passing score cannot exceed 100.')
    ),
    70
  ),
  maxAttempts: v.optional(v.nullable(v.pipe(v.number(), v.minValue(1)))),
  isActive: v.optional(v.boolean(), true),
  availableFrom: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
  availableUntil: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
});

/**
 * Schema for updating an existing assessment.
 */
export const UpdateAssessmentSchema = v.partial(
  v.omit(CreateAssessmentSchema, ['courseId'])
);

/**
 * Schema for starting an assessment attempt.
 */
export const StartAttemptSchema = v.object({
  assessmentId: v.pipe(
    v.string(),
    v.minLength(1, 'Assessment ID is required.')
  ),
  studentId: v.pipe(v.string(), v.minLength(1, 'Student ID is required.')),
});

/**
 * Schema for submitting an answer to a question during an attempt.
 */
export const SubmitAnswerSchema = v.object({
  attemptId: v.pipe(v.string(), v.minLength(1, 'Attempt ID is required.')),
  questionId: v.pipe(v.string(), v.minLength(1, 'Question ID is required.')),
  answer: v.union([v.string(), v.number()]),
});

/**
 * Schema for submitting all answers at once and completing an attempt.
 */
export const SubmitAttemptSchema = v.object({
  attemptId: v.pipe(v.string(), v.minLength(1, 'Attempt ID is required.')),
  answers: v.pipe(
    v.array(
      v.object({
        questionId: v.pipe(v.string(), v.minLength(1)),
        answer: v.union([v.string(), v.number()]),
      })
    ),
    v.minLength(1, 'At least one answer is required.')
  ),
});

/**
 * TypeScript types inferred from the schemas.
 */
export type CreateAssessmentType = v.InferOutput<typeof CreateAssessmentSchema>;
export type UpdateAssessmentType = v.InferOutput<typeof UpdateAssessmentSchema>;
export type StartAttemptType = v.InferOutput<typeof StartAttemptSchema>;
export type SubmitAnswerType = v.InferOutput<typeof SubmitAnswerSchema>;
export type SubmitAttemptType = v.InferOutput<typeof SubmitAttemptSchema>;
