/**
 * @module Models/Enrollement/Schemas
 * @remarks Validation schemas for Enrollement module (valibot)
 */

import * as v from 'valibot';

const EnrollmentStates = ['enrolled', 'completed', 'dropped'] as const;

/**
 * Helper: acepta string|number and transforma a número, valida rango 0-100.
 */
const PercentOrNumber = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform((input) => (typeof input === 'string' ? Number(input) : input)),
  v.number('Debe ser un número.'),
  v.minValue(0, 'El valor no puede ser menor a 0.'),
  v.maxValue(100, 'El valor no puede ser mayor a 100.')
);

/**
 * Helper: acepta string (ISO) o timestamp number y transforma a Date.
 */
const DateLike = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform((input) => new Date(input))
  // optional: you can validate date validity afterwards if required
);

/**
 * Schema para crear una inscripción (body).
 */
export const CreateEnrollementSchema = v.object({
  studentId: v.pipe(v.string(), v.minLength(1, 'studentId es requerido.')),
  courseId: v.pipe(v.string(), v.minLength(1, 'courseId es requerido.')),
});

/**
 * Schema para actualización parcial de una inscripción.
 */
export const UpdateEnrollementSchema = v.partial(
  v.object({
    state: v.picklist(EnrollmentStates, 'Estado inválido.'),
    grade: PercentOrNumber,
    progress: PercentOrNumber,
    enrolledAt: DateLike,
  })
);

/**
 * Schema para consultas / filtros (query params).
 */
const NumericString = v.pipe(
  v.string('El valor debe ser string.'),
  v.regex(/^\d+$/, 'Debe contener solo dígitos.'),
  v.transform(Number)
);

export const SearchEnrollementsSchema = v.object({
  studentId: v.optional(v.string()),
  courseId: v.optional(v.string()),
  state: v.optional(v.picklist(EnrollmentStates)),
  limit: v.optional(NumericString, '10'),
  offset: v.optional(NumericString, '0'),
  sortBy: v.optional(v.string(), 'createdAt'),
  sortOrder: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^(ASC|DESC)$/, 'sortOrder debe ser ASC o DESC')
    ),
    'DESC'
  ),
});

/**
 * Schema for marking a unit as completed or uncompleted.
 * Validates that unitNumber is a positive integer.
 */
export const UnitProgressSchema = v.object({
  unitNumber: v.pipe(
    v.number('unitNumber debe ser un número.'),
    v.integer('unitNumber debe ser un entero.'),
    v.minValue(1, 'unitNumber debe ser un número positivo.')
  ),
});

export type CreateEnrollementType = v.InferOutput<
  typeof CreateEnrollementSchema
>;
export type UpdateEnrollementType = v.InferOutput<
  typeof UpdateEnrollementSchema
>;
export type SearchEnrollementsQuery = v.InferOutput<
  typeof SearchEnrollementsSchema
>;
export type UnitProgressType = v.InferOutput<typeof UnitProgressSchema>;
