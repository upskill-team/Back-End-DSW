import * as v from 'valibot';

// Schema for a single learning material resource.
const MaterialSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Material title is required.')),
  description: v.optional(v.string()),
  url: v.pipe(v.string(), v.url('Must be a valid URL.')),
});

// Schema for a single option within a multiple-choice question.
const MultipleChoiceOptionSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1, 'Option text cannot be empty.')),
  isCorrect: v.boolean(),
});

// Schema for a multiple-choice quiz activity.
const ActivitySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Activity name is required.')),
  description: v.pipe(
    v.string(),
    v.minLength(1, 'Activity description is required.')
  ),
  startDate: v.optional(v.pipe(v.string(), v.isoDateTime())),
  endDate: v.optional(v.pipe(v.string(), v.isoDateTime())),
  question: v.pipe(v.string(), v.minLength(1, 'Quiz question is required.')),
  // Validation for an array: first validate it's an array of the correct objects,
  // then pipe it to further validations like minLength.
  options: v.pipe(
    v.array(MultipleChoiceOptionSchema),
    v.minLength(2, 'There must be at least two options.')
  ),
});

// Schema for a single course unit, which can contain materials and activities.
const UnitSchema = v.object({
  unitNumber: v.pipe(v.number(), v.integer('Unit number must be an integer.')),
  name: v.pipe(v.string(), v.minLength(1, 'Unit name is required.')),
  detail: v.pipe(v.string(), v.minLength(1, 'Unit detail is required.')),
  activities: v.optional(v.array(ActivitySchema)),
  materials: v.optional(v.array(MaterialSchema)),
});

// Main schema for creating a new course.
// This schema validates the entire nested structure.
export const CreateCourseSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Course name is required.')),
  description: v.pipe(
    v.string(),
    v.minLength(1, 'Course description is required.')
  ),
  isFree: v.optional(v.boolean()),
  price: v.optional(
    v.pipe(v.number(), v.minValue(0, 'Price cannot be negative.'))
  ),
  courseTypeId: v.pipe(
    v.string(),
    v.minLength(1, 'Course type ID is required.')
  ),
  // The professorId will be derived from the authenticated user's token, not the request body.
  units: v.optional(v.array(UnitSchema)),
});

// Schema for updating a course, making all fields optional.
export const UpdateCourseSchema = v.partial(CreateCourseSchema);

// Infer TypeScript types from the schemas for strong typing in services and controllers.
export type CreateCourseType = v.InferOutput<typeof CreateCourseSchema>;
export type UpdateCourseType = v.InferOutput<typeof UpdateCourseSchema>;
