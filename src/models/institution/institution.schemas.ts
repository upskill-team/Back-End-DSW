/**
 * @module InstitutionSchemas
 * @description Defines the validation schemas for the institution module using Valibot.
 * These schemas are used by the validationMiddleware to ensure data integrity for incoming requests.
 * @see {@link ./institution.routes.ts}
 */
import * as v from 'valibot'

// Schema for creating a new institution.
export const CreateInstitutionSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'El nombre es requerido.')),
  description: v.pipe(
    v.string(),
    v.minLength(1, 'La descripción es requerida.')
  ),
})

// Schema for updating an institution, making all fields optional.
export const UpdateInstitutionSchema = v.partial(CreateInstitutionSchema)

export type CreateInstitutionType = v.InferOutput<
  typeof CreateInstitutionSchema
>
