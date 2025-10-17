/**
 * @module Models/CourseType/Schemas
 * @remarks Defines validation schemas for the CourseType module using Valibot.
 */

import * as v from 'valibot';

/**
 * Schema for creating a new course type.
 */
export const CreateCourseTypeSchema = v.object({
  name: v.pipe(
    v.string('El nombre debe ser un texto.'),
    v.minLength(1, 'El nombre no puede estar vacío.')
  ),
  description: v.pipe(
    v.string('La descripción debe ser un texto.'),
    v.minLength(1, 'La descripción no puede estar vacía.')
  ),
});

/**
 * Schema for updating a course type, making all fields optional.
 */
export const UpdateCourseTypeSchema = v.partial(CreateCourseTypeSchema);

const NumericString = v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number));

export const SearchCourseTypesSchema = v.object({
  q: v.optional(v.string()),
  limit: v.optional(NumericString, '10'),
  offset: v.optional(NumericString, '0'),
  sortBy: v.optional(v.picklist(['name', 'createdAt']), 'name'),
  sortOrder: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^(ASC|DESC)$/i, 'sortOrder debe ser "ASC" o "DESC".'),
      v.transform(val => val.toUpperCase() as 'ASC' | 'DESC')
    ),
    'ASC' 
  ),
});

export type CreateCourseType = v.InferOutput<typeof CreateCourseTypeSchema>;
export type UpdateCourseType = v.InferOutput<typeof UpdateCourseTypeSchema>;
export type SearchCourseTypesQuery = v.InferOutput<typeof SearchCourseTypesSchema>;