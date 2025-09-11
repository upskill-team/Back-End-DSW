/**
 * @module Models/Course/Schemas
 * @remarks Defines validation schemas for the Course module and its embeddable components.
 */

import * as v from 'valibot'
import { status } from './course.entity.js'
import { QuestionType } from '../question/question.entity.js'

const QuestionUpdateSchema = v.object({
  questionText: v.pipe(v.string(), v.minLength(1)),
  questionType: v.picklist(Object.values(QuestionType)),
  payload: v.object({
    options: v.pipe(v.array(v.string()), v.minLength(2)),
    correctAnswer: v.union([v.number(), v.string()]),
  }),
})

/**
 * Schema for a single learning material resource within a course unit.
 */
const MaterialSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Material title is required.')),
  url: v.pipe(v.string(), v.url('Must be a valid URL.')),
});

/**
 * Schema for a single course unit, which can contain materials.
 */
const UnitSchema = v.object({
  unitNumber: v.pipe(v.number(), v.integer('Unit number must be an integer.')),
  name: v.pipe(v.string(), v.minLength(1, 'Unit name is required.')),
  detail: v.pipe(v.string(), v.minLength(1, 'Unit detail is required.')),
  materials: v.optional(v.array(MaterialSchema), []),
  questions: v.optional(v.array(QuestionUpdateSchema), []) 
});

/**
 * Main schema for creating a new course.
 */
export const CreateCourseSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Course name is required.')),
  description: v.pipe(
    v.string(),
    v.minLength(1, 'Course description is required.')
  ),
  price: v.optional(
    v.pipe(
      v.union([v.string(), v.number()]),
      v.transform((input) =>
        typeof input === 'string' ? Number(input) : input
      ),
      v.number('Price must be a number.'),
      v.minValue(0, 'Price cannot be negative.')
    )
  ),
  courseTypeId: v.pipe(
    v.string(),
    v.minLength(1, 'Course type ID is required.')
  ),
  units: v.optional(v.array(UnitSchema)),

  status: v.optional(
    v.picklist(
      Object.values(status),
      'The provided status is not valid.'
    )
  ),
})

/**
 * Schema for updating an existing course, making all fields optional.
 */
export const UpdateCourseSchema = v.partial(CreateCourseSchema);

// Infer TypeScript types from the schemas for strong typing.
export type CreateCourseType = v.InferOutput<typeof CreateCourseSchema>;
export type UpdateCourseType = v.InferOutput<typeof UpdateCourseSchema>;
