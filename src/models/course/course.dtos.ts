/**
 * @module Models/Course/DTOs
 * @remarks Schemas for filtering course data based on user context.
 */

import * as v from 'valibot';

/**
 * Schema for professor public information (without sensitive data)
 */
export const ProfessorPublicSchema = v.object({
  id: v.string(),
  name: v.string(),
  surname: v.string(),
  profilePicture: v.optional(v.string()),
  institution: v.optional(
    v.object({
      id: v.string(),
      name: v.string(),
    })
  ),
});

/**
 * Schema for material information
 */
export const MaterialSchema = v.object({
  title: v.string(),
  url: v.string(),
});

/**
 * Schema for unit preview (public view - shows structure but not content)
 */
export const UnitPreviewSchema = v.object({
  unitNumber: v.number(),
  name: v.string(),
  description: v.string(),
  materialsCount: v.number(),
  questionsCount: v.number(),
});

/**
 * Schema for unit information (for enrolled students - includes full content)
 */
export const UnitEnrolledSchema = v.object({
  unitNumber: v.number(),
  name: v.string(),
  description: v.string(),
  detail: v.string(),
  materials: v.array(MaterialSchema),
  questions: v.array(v.string()), // Array of question IDs
});

/**
 * Schema for public course information (unauthenticated or not enrolled users)
 * Includes unit previews with metadata but NOT the actual content
 */
export const CoursePublicSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  imageUrl: v.optional(v.string()),
  isFree: v.boolean(),
  priceInCents: v.optional(v.number()),
  status: v.string(),
  createdAt: v.optional(v.date()),
  studentsCount: v.number(),
  units: v.optional(v.array(UnitPreviewSchema)),
  unitsCount: v.optional(v.number()),
  courseType: v.object({
    id: v.string(),
    name: v.string(),
  }),
  professor: ProfessorPublicSchema,
  institution: v.optional(
    v.object({
      name: v.string(),
      aliases: v.array(v.string()),
    })
  ),
});

/**
 * Schema for enrolled student course view (includes unit content)
 */
export const CourseEnrolledSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  imageUrl: v.optional(v.string()),
  isFree: v.boolean(),
  priceInCents: v.optional(v.number()),
  status: v.string(),
  createdAt: v.optional(v.date()),
  studentsCount: v.number(),
  courseType: v.object({
    id: v.string(),
    name: v.string(),
  }),
  professor: ProfessorPublicSchema,
  institution: v.optional(
    v.object({
      name: v.string(),
      aliases: v.array(v.string()),
    })
  ),
  units: v.array(UnitEnrolledSchema),
});

/**
 * Student summary for professor view
 */
export const StudentSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  surname: v.string(),
  profilePicture: v.optional(v.string()),
  enrolledAt: v.date(),
  progress: v.optional(v.number()),
  grade: v.optional(v.number()),
});

/**
 * Schema for professor's own course view (includes students summary)
 */
export const CourseProfessorSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  imageUrl: v.optional(v.string()),
  isFree: v.boolean(),
  priceInCents: v.optional(v.number()),
  status: v.string(),
  createdAt: v.optional(v.date()),
  studentsCount: v.number(),
  courseType: v.object({
    id: v.string(),
    name: v.string(),
  }),
  professor: ProfessorPublicSchema,
  institution: v.optional(
    v.object({
      name: v.string(),
      aliases: v.array(v.string()),
    })
  ),
  units: v.array(UnitEnrolledSchema),
});

export type CoursePublicResponse = v.InferOutput<typeof CoursePublicSchema>;
export type CourseEnrolledResponse = v.InferOutput<typeof CourseEnrolledSchema>;
export type CourseProfessorResponse = v.InferOutput<
  typeof CourseProfessorSchema
>;
export type ProfessorPublicResponse = v.InferOutput<
  typeof ProfessorPublicSchema
>;
export type StudentSummaryResponse = v.InferOutput<typeof StudentSummarySchema>;
