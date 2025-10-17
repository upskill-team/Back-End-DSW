/**
 * @module Models/Course/Schemas
 * @remarks Defines validation schemas for the Course module and its embeddable components.
 */

import * as v from 'valibot';
import { status } from './course.entity.js';
import { QuestionType } from '../question/question.entity.js';

const NumericString = v.pipe(
  v.string('El valor debe ser un string.'),
  v.regex(/^\d+$/, 'Debe contener solo dígitos.'),
  v.transform(Number)
);

const BooleanString = v.pipe(
  v.string('El valor debe ser un string.'),
  v.regex(/^(true|false)$/, 'El valor debe ser "true" o "false".'),
  v.transform((val) => val === 'true')
);

const QuestionUpdateSchema = v.object({
  questionText: v.pipe(v.string(), v.minLength(1)),
  questionType: v.picklist(Object.values(QuestionType)),
  payload: v.object({
    options: v.pipe(v.array(v.string()), v.minLength(2)),
    correctAnswer: v.union([v.number(), v.string()]),
  }),
});

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
  description: v.optional(v.string()),
  materials: v.optional(v.array(MaterialSchema), []),
  questions: v.optional(v.array(QuestionUpdateSchema), []),
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

  useInstitution: v.optional(BooleanString),
  status: v.optional(
    v.picklist(Object.values(status), 'The provided status is not valid.')
  ),
});


/**
 * Schema for searching/filtering courses via query parameters (for GET requests).
 * Valida y transforma los parámetros que vienen de la URL.
 */
export const SearchCoursesSchema = v.object({
  q: v.optional(v.string()),
  courseTypeId: v.optional(v.string()),
  isFree: v.optional(BooleanString),
  status: v.optional(v.enum_(status, 'El status proporcionado no es válido.')),
  
  limit: v.optional(NumericString, '10'),
  offset: v.optional(NumericString, '0'),

  sortBy: v.optional(v.picklist(['name', 'price', 'createdAt']), 'createdAt'),
  sortOrder: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^(ASC|DESC)$/i, 'sortOrder debe ser "ASC" o "DESC".'),
      v.transform(val => val.toUpperCase() as 'ASC' | 'DESC')
    ),
    'DESC'
  ),
});

/**
 * Schema for updating an existing course, making all fields optional.
 */
export const UpdateCourseSchema = v.partial(CreateCourseSchema);

/**
 * Schema for creating a single unit within a course.
 * unitNumber is optional as it will be auto-assigned by the backend.
 */
export const CreateUnitSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Unit name is required.')),
  description: v.optional(v.string()),
  detail: v.pipe(v.string(), v.minLength(1, 'Unit detail is required.')),
  materials: v.optional(v.array(MaterialSchema), []),
});

/**
 * Schema for updating a single unit within a course.
 */
export const UpdateUnitSchema = v.partial(CreateUnitSchema);

/**
 * Schema for reordering units within a course.
 * Expected format from frontend: { units: [{ unitNumber: 3, newOrder: 1 }, ...] }
 */
export const ReorderUnitsSchema = v.object({
  units: v.array(
    v.object({
      unitNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
      newOrder: v.pipe(v.number(), v.integer(), v.minValue(1)),
    })
  ),
});

/**
 * Schema for creating a single material within a unit.
 */
export const CreateMaterialSchema = MaterialSchema;

/**
 * Schema for quick save operations without full validation.
 */
export const QuickSaveSchema = v.object({
  type: v.picklist([
    'course-config',
    'unit-content',
    'unit-materials',
    'unit-questions',
  ]),
  data: v.any(), // Validation will be specific per type
});

// Infer TypeScript types from the schemas for strong typing.
export type SearchCoursesQuery = v.InferOutput<typeof SearchCoursesSchema>;
export type CreateCourseType = v.InferOutput<typeof CreateCourseSchema>;
export type UpdateCourseType = v.InferOutput<typeof UpdateCourseSchema>;
export type CreateUnitType = v.InferOutput<typeof CreateUnitSchema>;
export type UpdateUnitType = v.InferOutput<typeof UpdateUnitSchema>;
export type ReorderUnitsType = v.InferOutput<typeof ReorderUnitsSchema>;
export type CreateMaterialType = v.InferOutput<typeof CreateMaterialSchema>;
export type QuickSaveType = v.InferOutput<typeof QuickSaveSchema>;
