/**
 * @module Models/User/Schemas
 * @remarks Defines validation schemas for the User module using Valibot.
 */
import * as v from 'valibot';

/**
 * Schema for updating a user's profile. All fields are optional.
 */
export const UpdateProfileSchema = v.partial(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, 'El nombre es requerido.')),
    surname: v.pipe(v.string(), v.minLength(1, 'El apellido es requerido.')),
    mail: v.pipe(v.string(), v.email('Debe ser un email válido.')),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    birthdate: v.optional(v.pipe(v.string(), v.isoDate('La fecha debe tener un formato YYYY-MM-DD.'))),
  })
);

/**
 * The inferred TypeScript type from the UpdateProfileSchema.
 */
export type UpdateProfileType = v.InferInput<typeof UpdateProfileSchema>;