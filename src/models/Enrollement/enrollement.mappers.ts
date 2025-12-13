/**
 * @module Models/Enrollement/Mappers
 * @remarks Functions to map Enrollement entities to filtered DTOs.
 */

import { Enrollement } from './enrollement.entity.js';
import { Course } from '../course/course.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { wrap } from '@mikro-orm/core';
import type {
  ProfessorEnrollmentResponse,
  CourseEnrollmentListResponse,
  CourseEnrollmentDetailResponse,
  EnrollmentListResponse,
  EnrollmentDetailResponse,
} from './enrollement.dtos.js';

/**
 * Maps professor to enrollment view (NO sensitive data like mail, phone)
 */
function mapProfessorToEnrollment(
  professor: Professor
): ProfessorEnrollmentResponse {
  const wrappedProf = wrap(professor).toObject();
  const user = wrappedProf.user as any;

  return {
    id: professor.id!,
    name: user?.name || '',
    surname: user?.surname || '',
    profilePicture: user?.profile_picture,
  };
}

/**
 * Maps course to enrollment list view (preview with metadata, no full content)
 */
export function mapCourseToEnrollmentList(
  course: Course,
  studentsCount: number
): CourseEnrollmentListResponse {
  const wrappedCourse = wrap(course).toObject();
  const courseType = wrappedCourse.courseType as any;
  const professor = course.professor as Professor;
  const institution = wrappedCourse.institution as any;

  return {
    id: course.id!,
    name: course.name,
    description: course.description,
    imageUrl: course.imageUrl,
    isFree: course.isFree,
    priceInCents: course.priceInCents,
    status: course.status,
    createdAt: course.createdAt,
    studentsCount: studentsCount,
    units: (course.units || []).map((unit) => ({
      unitNumber: unit.unitNumber,
      name: unit.name,
      description: unit.description,
      materialsCount: unit.materials?.length ?? 0,
      questionsCount: unit.questions?.length ?? 0,
    })),
    courseType: {
      id: courseType?.id || '',
      name: courseType?.name || '',
    },
    professor: mapProfessorToEnrollment(professor),
    institution: institution
      ? {
          name: institution.name,
        }
      : undefined,
  };
}

/**
 * Maps course to enrollment detail view (full content for enrolled student)
 */
export function mapCourseToEnrollmentDetail(
  course: Course
): CourseEnrollmentDetailResponse {
  const wrappedCourse = wrap(course).toObject();
  const courseType = wrappedCourse.courseType as any;
  const professor = course.professor as Professor;
  const institution = wrappedCourse.institution as any;

  return {
    id: course.id!,
    name: course.name,
    description: course.description,
    imageUrl: course.imageUrl,
    isFree: course.isFree,
    priceInCents: course.priceInCents,
    status: course.status,
    createdAt: course.createdAt,
    units: (course.units || []).map((unit) => ({
      unitNumber: unit.unitNumber,
      name: unit.name,
      description: unit.description,
      detail: unit.detail,
      materials: (unit.materials || []).map((material) => ({
        title: material.title,
        url: material.url,
      })),
      questions: (unit.questions || []).map((q: any) => q.toHexString()),
    })),
    courseType: {
      id: courseType?.id || '',
      name: courseType?.name || '',
    },
    professor: mapProfessorToEnrollment(professor),
    institution: institution
      ? {
          name: institution.name,
        }
      : undefined,
  };
}

/**
 * Maps enrollment to list response (for GET /enrollments/student/:id)
 */
export function mapEnrollmentToList(
  enrollment: Enrollement,
  studentsCount: number
): EnrollmentListResponse {
  const course = enrollment.course as unknown as Course;
  const student = enrollment.student as any;

  return {
    id: enrollment.id!,
    course: mapCourseToEnrollmentList(course, studentsCount),
    student: {
      id: student?.id || student?._id?.toString() || '',
    },
    createdAt: enrollment.createdAt!,
    enrolledAt: enrollment.enrolledAt!,
    state: enrollment.state,
    progress: enrollment.progress || 0,
    completedUnits: enrollment.completedUnits || [],
  };
}

/**
 * Maps enrollment to detail response (for GET /enrollments/student/:studentId/course/:courseId)
 */
export function mapEnrollmentToDetail(
  enrollment: Enrollement
): EnrollmentDetailResponse {
  const course = enrollment.course as unknown as Course;
  const student = enrollment.student as any;

  return {
    id: enrollment.id!,
    course: mapCourseToEnrollmentDetail(course),
    student: {
      id: student?.id || student?._id?.toString() || '',
    },
    createdAt: enrollment.createdAt!,
    enrolledAt: enrollment.enrolledAt!,
    state: enrollment.state,
    progress: enrollment.progress || 0,
    completedUnits: enrollment.completedUnits || [],
  };
}
