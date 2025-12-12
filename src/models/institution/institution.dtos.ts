/**
 * @module Models/Institution/DTOs
 * @remarks Schemas for filtering institution data based on context.
 */

import * as v from 'valibot';

/**
 * Schema for institution filter (public - only for dropdowns/searches)
 */
export const InstitutionFilterSchema = v.object({
  id: v.string(),
  name: v.string(),
});

export type InstitutionFilterResponse = v.InferOutput<
  typeof InstitutionFilterSchema
>;
