/**
 * @module Models/Enrollement/DTOs
 * @remarks Schemas for filtering enrollment data - removes sensitive user information.
 */

import * as v from 'valibot';
import { UnitEnrolledSchema } from '../course/course.dtos.js';

/**
 * Schema for professor in enrollment view (NO sensitive data)
 */
export const ProfessorEnrollmentSchema = v.object({
  id: v.string(),
  name: v.string(),
  surname: v.string(),
  profilePicture: v.optional(v.string()),
  // NO mail, phone, birthdate
});

/**
 * Schema for course in enrollment list (summary view)
 */
export const CourseEnrollmentListSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  imageUrl: v.optional(v.string()),
  isFree: v.boolean(),
  priceInCents: v.optional(v.number()),
  status: v.string(),
  createdAt: v.optional(v.date()),
  studentsCount: v.number(),
  units: v.array(
    v.object({
      unitNumber: v.number(),
      name: v.string(),
      description: v.string(),
      materialsCount: v.number(),
      questionsCount: v.number(),
    })
  ),
  courseType: v.object({
    id: v.string(),
    name: v.string(),
  }),
  professor: ProfessorEnrollmentSchema,
  institution: v.optional(
    v.object({
      name: v.string(),
    })
  ),
});

/**
 * Schema for course in enrollment detail (full content for enrolled student)
 */
export const CourseEnrollmentDetailSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  imageUrl: v.optional(v.string()),
  isFree: v.boolean(),
  priceInCents: v.optional(v.number()),
  status: v.string(),
  createdAt: v.optional(v.date()),
  units: v.array(UnitEnrolledSchema),
  courseType: v.object({
    id: v.string(),
    name: v.string(),
  }),
  professor: ProfessorEnrollmentSchema,
  institution: v.optional(
    v.object({
      name: v.string(),
    })
  ),
});

/**
 * Schema for enrollment list response
 */
export const EnrollmentListSchema = v.object({
  id: v.string(),
  course: CourseEnrollmentListSchema,
  student: v.object({
    id: v.string(),
    // NO exponer datos del estudiante
  }),
  createdAt: v.date(),
  enrolledAt: v.date(),
  state: v.string(),
  progress: v.number(),
  completedUnits: v.array(v.number()),
});

/**
 * Schema for enrollment detail response (when student accesses their own enrollment)
 */
export const EnrollmentDetailSchema = v.object({
  id: v.string(),
  course: CourseEnrollmentDetailSchema,
  student: v.object({
    id: v.string(),
    // Exponer datos propios del estudiante está OK solo si es el mismo usuario autenticado
  }),
  createdAt: v.date(),
  enrolledAt: v.date(),
  state: v.string(),
  progress: v.number(),
  completedUnits: v.array(v.number()),
});

export type ProfessorEnrollmentResponse = v.InferOutput<
  typeof ProfessorEnrollmentSchema
>;
export type CourseEnrollmentListResponse = v.InferOutput<
  typeof CourseEnrollmentListSchema
>;
export type CourseEnrollmentDetailResponse = v.InferOutput<
  typeof CourseEnrollmentDetailSchema
>;
export type EnrollmentListResponse = v.InferOutput<typeof EnrollmentListSchema>;
export type EnrollmentDetailResponse = v.InferOutput<
  typeof EnrollmentDetailSchema
>;
