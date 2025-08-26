import exp from 'constants';
import * as v from 'valibot';

/**
 * Schema for creating a professor.
 * Validates the input data when creating a new professor.
 * - name: required, non-empty string
 * - surname: required, non-empty string
 * - mail: required, valid email format
 * - state: optional, must be either 'active' or 'inactive' if provided
 * - profile_picture: optional, must be a valid URL if provided
 * - courses: optional, array of strings (course IDs)
 */
export const CreateProfessorSchema = v.object({

    // v.pipe is used to chain multiple validations
    name : v.pipe(
        v.string('El nombre debe ser un texto.'),
        v.minLength(1, 'El nombre no puede estar vacío.')
    ),
    surname : v.pipe(
        v.string('El apellido debe ser un texto.'),
        v.minLength(1, 'El apellido no puede estar vacío.')
    ),
    mail : v.pipe(
        v.string('El correo debe ser un texto.'),
        v.email('El correo debe tener un formato válido.')
    ),
    // v.optional is used to make a field optional
    state: v.optional(
        v.pipe(
            v.string('El estado debe ser un texto.'),
            v.picklist(['active', 'inactive'], "El estado solo puede ser 'active' o 'inactive'.")      
        )
    ),
    profile_picture: v.optional(
        v.pipe(
            v.string('La URL de la foto de perfil debe ser un texto.'),
            v.url('La URL de la foto de perfil debe ser una URL válida.')
        )
    ),
    // v.array is used to validate arrays
    courses: v.optional(
        v.array(v.string('Cada ID de curso debe ser un texto.'))
    ),
    institution: v.optional(
        v.string('El ID de la institución debe ser un texto.')
    )

})

// Schema for updating a professor.
// Similar to CreateProfessorSchema but all fields are optional.
export const UpdateProfessorSchema = v.object({
    name : v.optional(
        v.pipe(
            v.string('El nombre debe ser un texto.'),
            v.minLength(1, 'El nombre no puede estar vacío.')
        )
    ),
    surname : v.optional(
        v.pipe(
            v.string('El apellido debe ser un texto.'),     
            v.minLength(1, 'El apellido no puede estar vacío.')
        )
    ),
    mail : v.optional(
        v.pipe(
            v.string('El correo debe ser un texto.'),
            v.email('El correo debe tener un formato válido.')
        )
    ),
    state: v.optional(
        v.pipe(
            v.string('El estado debe ser un texto.'),
            v.picklist(['active', 'inactive'], "El estado solo puede ser 'active' o 'inactive'.")      
        )
    ),
    profile_picture: v.optional(
        v.pipe(
            v.string('La URL de la foto de perfil debe ser un texto.'),
            v.url('La URL de la foto de perfil debe ser una URL válida.')
        )
    ),
    courses: v.optional(
        v.array(v.string('Cada ID de curso debe ser un texto.'))
    ),
    institution: v.optional(
        v.string('El ID de la institución debe ser un texto.')
    )
})

// InferOutput is used to create TypeScript types from the schemas
// These is necessary to use the validated data in a type-safe manner
export type CreateProfessorSchemaType = v.InferOutput<typeof CreateProfessorSchema>;
export type UpdateProfessorSchemaType = v.InferOutput<typeof UpdateProfessorSchema>;   