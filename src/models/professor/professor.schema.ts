/**
 * @module ProfessorSchemas
 * @description Defines the validation schemas for updating a professor's profile.
 * @see {@link ./professor.routes.ts}
 */
import * as v from 'valibot';

/**
 * Schema for updating a professor's profile.
 * All fields are optional, allowing for partial updates.
 * The properties here reflect the fields that can be modified on the Professor entity itself.
 */
export const UpdateProfessorSchema = v.object({
  state: v.optional(
    v.pipe(
      v.string('El estado debe ser un texto.'),
      v.picklist(
        ['active', 'inactive'],
        "El estado solo puede ser 'active' o 'inactive'."
      )
    )
  ),
  institution: v.optional(
    v.string('El ID de la institución debe ser un texto.')
  ),
});

// We infer the type for type-safe usage in the service layer.
export type UpdateProfessorType = v.InferOutput<typeof UpdateProfessorSchema>;
