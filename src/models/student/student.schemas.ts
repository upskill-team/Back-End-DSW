/**
* @module Models/Student/Schemas
* @remarks Defines validation schemas for the Student module using Valibot.
*/

import * as v from 'valibot';

/**
Schema for updating a student's profile.
All fields are optional to allow for partial updates.
*/
export const UpdateStudentSchema = v.partial(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, 'El nombre es requerido.')),
    surname: v.pipe(v.string(), v.minLength(1, 'El apellido es requerido.')),
  })
);

export type UpdateStudentType = v.InferOutput<typeof UpdateStudentSchema>;
