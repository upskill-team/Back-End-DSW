/**
 * @module Models/CourseType/DTOs
 * @remarks Schemas for filtering course type data based on context.
 */

import * as v from 'valibot';

/**
 * Schema for course type filter (public - only for dropdowns/searches)
 */
export const CourseTypeFilterSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string()
});

export type CourseTypeFilterResponse = v.InferOutput<
  typeof CourseTypeFilterSchema
>;
