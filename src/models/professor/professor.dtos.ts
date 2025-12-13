/**
 * @module Models/Professor/DTOs
 * @remarks Schemas for filtering professor data based on context.
 */

import * as v from 'valibot';

/**
 * Schema for professor filter (public - only for dropdowns/searches)
 * NO sensitive data like mail, phone, birthdate
 */
export const ProfessorFilterSchema = v.object({
  id: v.string(),
  name: v.string(),
  surname: v.string(),
  profilePicture: v.optional(v.string()),
});

export type ProfessorFilterResponse = v.InferOutput<
  typeof ProfessorFilterSchema
>;
