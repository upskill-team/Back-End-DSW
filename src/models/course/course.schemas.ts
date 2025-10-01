/**
 * @module Models/Course/Schemas
 * @remarks Defines validation schemas for the Course module and its embeddable components.
 */

import * as v from 'valibot';
import { status } from './course.entity.js';
import { QuestionType } from '../question/question.entity.js';

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

  status: v.optional(
    v.picklist(Object.values(status), 'The provided status is not valid.')
  ),
});

// --- ESQUEMA PARA BÚSQUEDA (AÑADIR ESTA SECCIÓN) ---

// Helper: Valida un string que representa un número entero y lo transforma.
// Es crucial para los query params como 'limit', 'offset', o IDs.
const NumericString = v.pipe(
  v.string('El valor debe ser un string.'),
  v.regex(/^\d+$/, 'Debe contener solo dígitos.'),
  v.transform(Number)
);

// Helper: Valida un string "true" o "false" y lo transforma a un booleano.
// Perfecto para filtros como `isFree`.
const BooleanString = v.pipe(
  v.string('El valor debe ser un string.'),
  v.regex(/^(true|false)$/, 'El valor debe ser "true" o "false".'),
  v.transform((val) => val === 'true')
);

/**
 * Schema for searching/filtering courses via query parameters (for GET requests).
 * Valida y transforma los parámetros que vienen de la URL.
 */
export const SearchCoursesSchema = v.object({
  // --- Filtros ---
  status: v.optional(v.enum_(status, 'El status proporcionado no es válido.')),
  isFree: v.optional(BooleanString),
  professorId: v.optional(NumericString),
  courseTypeId: v.optional(NumericString),

  q: v.optional(v.string()),

  // --- Paginación ---
  limit: v.optional(NumericString, '10'),
  offset: v.optional(NumericString, '0'),

  // --- Ordenación ---
  sortBy: v.optional(v.string(), 'createdAt'),
  // replace enum array with string+regex validation
  sortOrder: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^(ASC|DESC)$/, 'sortOrder debe ser "ASC" o "DESC".')
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
 */
export const CreateUnitSchema = v.object({
  unitNumber: v.pipe(v.number(), v.integer('Unit number must be an integer.')),
  name: v.pipe(v.string(), v.minLength(1, 'Unit name is required.')),
  detail: v.pipe(v.string(), v.minLength(1, 'Unit detail is required.')),
  materials: v.optional(v.array(MaterialSchema), []),
});

/**
 * Schema for updating a single unit within a course.
 */
export const UpdateUnitSchema = v.partial(CreateUnitSchema);

/**
 * Schema for reordering units within a course.
 */
export const ReorderUnitsSchema = v.object({
  unitOrders: v.array(
    v.object({
      currentUnitNumber: v.pipe(v.number(), v.integer()),
      newUnitNumber: v.pipe(v.number(), v.integer()),
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
