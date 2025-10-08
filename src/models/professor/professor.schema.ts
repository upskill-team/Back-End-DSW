/**
 * @module Models/Professor/Schemas
 * @remarks Defines the validation schemas for updating a professor's profile.
 */
import * as v from 'valibot';

/**
 * Schema for updating a professor's profile.
 * All fields are optional, allowing for partial updates.
 * Note: institution field is NOT included here because institution membership
 * is now managed through the Institution endpoints (join/leave operations).
 */
export const UpdateProfessorSchema = v.object({
  state: v.optional(
    v.pipe(
      v.string('El estado debe ser un texto.'),
      v.picklist(
        ['pending', 'active', 'inactive'],
        "El estado solo puede ser 'pending', 'active' o 'inactive'."
      )
    )
  ),
});

// We infer the type for type-safe usage in the service layer.
export type UpdateProfessorType = v.InferOutput<typeof UpdateProfessorSchema>;