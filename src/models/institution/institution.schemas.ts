/**
 * @module Models/Institution/Schemas
 * @remarks Defines the validation schemas for the institution module using Valibot.
 */
import * as v from 'valibot'

// Schema for creating a new institution by a professor
export const CreateInstitutionSchema = v.object({
  name: v.pipe(
    v.string('El nombre es requerido.'),
    v.minLength(3, 'El nombre debe tener al menos 3 caracteres.'),
    v.maxLength(200, 'El nombre no puede exceder 200 caracteres.'),
    v.trim()
  ),
  description: v.pipe(
    v.string('La descripción es requerida.'),
    v.minLength(10, 'La descripción debe tener al menos 10 caracteres.'),
    v.maxLength(1000, 'La descripción no puede exceder 1000 caracteres.'),
    v.trim()
  ),
  aliases: v.optional(
    v.pipe(
      v.array(v.string()),
      v.maxLength(10, 'No puede haber más de 10 alias.')
    )
  ),
})

// Schema for updating an institution (admin only)
export const UpdateInstitutionSchema = v.object({
  name: v.optional(
    v.pipe(
      v.string(),
      v.minLength(3, 'El nombre debe tener al menos 3 caracteres.'),
      v.maxLength(200, 'El nombre no puede exceder 200 caracteres.'),
      v.trim()
    )
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.minLength(10, 'La descripción debe tener al menos 10 caracteres.'),
      v.maxLength(1000, 'La descripción no puede exceder 1000 caracteres.'),
      v.trim()
    )
  ),
  aliases: v.optional(
    v.pipe(
      v.array(v.string()),
      v.maxLength(10, 'No puede haber más de 10 alias.')
    )
  ),
})

// Schema for requesting to join an institution
export const JoinRequestSchema = v.object({
  institutionId: v.pipe(
    v.string('El ID de la institución es requerido.'),
    v.minLength(1, 'El ID de la institución es requerido.')
  ),
  message: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(500, 'El mensaje no puede exceder 500 caracteres.')
    )
  ),
})

// Schema for accepting/rejecting join requests (manager only)
export const ProcessJoinRequestSchema = v.object({
  professorId: v.pipe(
    v.string('El ID del profesor es requerido.'),
    v.minLength(1, 'El ID del profesor es requerido.')
  ),
  action: v.picklist(
    ['accept', 'reject'],
    "La acción solo puede ser 'accept' o 'reject'."
  ),
})

// Schema for updating the managed institution (manager only)
export const UpdateManagedInstitutionSchema = v.object({
  description: v.optional(
    v.pipe(
      v.string('La descripción es requerida.'),
      v.minLength(10, 'La descripción debe tener al menos 10 caracteres.'),
      v.maxLength(1000, 'La descripción no puede exceder 1000 caracteres.'),
      v.trim()
    )
  ),
  aliases: v.optional(
    v.pipe(
      v.array(v.string()),
      v.maxLength(10, 'No puede haber más de 10 alias.')
    )
  ),
});

export type CreateInstitutionType = v.InferOutput<typeof CreateInstitutionSchema>
export type UpdateInstitutionType = v.InferOutput<typeof UpdateInstitutionSchema>
export type JoinRequestType = v.InferOutput<typeof JoinRequestSchema>
export type ProcessJoinRequestType = v.InferOutput<typeof ProcessJoinRequestSchema>
export type UpdateManagedInstitutionType = v.InferOutput<typeof UpdateManagedInstitutionSchema>;