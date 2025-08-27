import * as v from 'valibot';

export const CreateCourseTypeSchema = v.object({
  name: v.pipe(
    v.string('El nombre debe ser un texto.'),
    v.minLength(1, 'El nombre no puede estar vacío.')
  ),
  description: v.pipe(
    v.string('La descripción debe ser un texto.'),
    v.minLength(1, 'La descripción no puede estar vacía.')
  ),
});

export const UpdateCourseTypeSchema = v.partial(CreateCourseTypeSchema);

export type CreateCourseType = v.InferOutput<typeof CreateCourseTypeSchema>;
export type UpdateCourseType = v.InferOutput<typeof UpdateCourseTypeSchema>;