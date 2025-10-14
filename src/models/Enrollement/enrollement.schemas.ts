/**
 * @module Models/Enrollement/Schemas
 * @remarks Validation schemas for Enrollement module (valibot)
 */

import * as v from 'valibot';

const EnrollmentStates = ['enrolled', 'completed', 'dropped'] as const;

/**
 * Helper: accepts string|number and converts to number, validates range 0-100.
 */
const PercentOrNumber = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform((input) => (typeof input === 'string' ? Number(input) : input)),
  v.number('Debe ser un número.'),
  v.minValue(0, 'El valor no puede ser menor a 0.'),
  v.maxValue(100, 'El valor no puede ser mayor a 100.')
);

/**
 * Helper: accepts string (ISO) or timestamp number and converts to Date.
 */
const DateLike = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform((input) => new Date(input)),
  // optional: you can validate date validity afterwards if required
);

/**
 * Schema for creating an inscription (body).
 */
export const CreateEnrollementSchema = v.object({
  studentId: v.pipe(v.string(), v.minLength(1, 'studentId es requerido.')),
  courseId: v.pipe(v.string(), v.minLength(1, 'courseId es requerido.')),
});

/**
 * Schema for partial update of an enrollment.
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
 * Schema for queries/filters (query params)
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
    v.pipe(v.string(), v.regex(/^(ASC|DESC)$/, 'sortOrder debe ser ASC o DESC')),
    'DESC'
  ),
});

export type CreateEnrollementType = v.InferOutput<typeof CreateEnrollementSchema>;
export type UpdateEnrollementType = v.InferOutput<typeof UpdateEnrollementSchema>;
export type SearchEnrollementsQuery = v.InferOutput<typeof SearchEnrollementsSchema>;