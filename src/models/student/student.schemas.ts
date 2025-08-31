import * as v from 'valibot';

// Used to validate data when updating a student
export const UpdateStudentSchema = v.partial(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, 'El nombre es requerido.')),
    surname: v.pipe(v.string(), v.minLength(1, 'El apellido es requerido.')),
  })
);

export type UpdateStudentType = v.InferOutput<typeof UpdateStudentSchema>;
