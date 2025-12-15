/**
 * @module Models/Course/Mappers
 * @remarks Functions to map Course entities to filtered DTOs based on user context.
 */

import { Course } from './course.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { User } from '../user/user.entity.js';
import { Enrollement } from '../Enrollement/enrollement.entity.js';
import { wrap } from '@mikro-orm/core';
import {
  CoursePublicResponse,
  CourseEnrolledResponse,
  CourseProfessorResponse,
  ProfessorPublicResponse,
} from './course.dtos.js';

/**
 * Maps a professor entity to public-safe data (no sensitive information)
 */
export function mapProfessorToPublic(
  professor: Professor
): ProfessorPublicResponse {
  const wrappedProfessor = wrap(professor).toObject();
  const user = wrappedProfessor.user as any;
  const institution = wrappedProfessor.institution as any;

  return {
    id: professor.id!,
    name: user?.name || '',
    surname: user?.surname || '',
    profilePicture: user?.profile_picture,
    institution: institution
      ? {
          id: institution.id,
          name: institution.name,
        }
      : undefined,
  };
}

/**
 * Maps a course to public view (for unauthenticated or non-enrolled users)
 * Includes unit preview with metadata but NOT the actual content (materials/detail)
 */
export function mapCourseToPublic(
  course: Course,
  studentsCount: number
): CoursePublicResponse {
  const wrappedCourse = wrap(course).toObject();
  const courseType = wrappedCourse.courseType as any;
  const professor = course.professor as Professor;

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
    professor: mapProfessorToPublic(professor),
    institution: course.institution
      ? {
          name: course.institution.name,
          aliases: course.institution.aliases || [],
        }
      : undefined,
  };
}

/**
 * Maps a course to public view in trending list
 * Includes a counter for units
 */
export function mapCourseToPublicTrending(
  course: Course,
  studentsCount: number,
  unitsCount: number
): CoursePublicResponse {
  const wrappedCourse = wrap(course).toObject();
  const courseType = wrappedCourse.courseType as any;
  const professor = course.professor as Professor;

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
    unitsCount: unitsCount,
    courseType: {
      id: courseType?.id || '',
      name: courseType?.name || '',
    },
    professor: mapProfessorToPublic(professor),
    institution: course.institution
      ? {
          name: course.institution.name,
          aliases: course.institution.aliases || [],
        }
      : undefined,
  };
}

/**
 * Maps a course to enrolled student view
 * Includes unit content, materials, and questions (without correctAnswer)
 */
export function mapCourseToEnrolled(
  course: Course,
  studentsCount: number
): CourseEnrolledResponse {
  const publicData = mapCourseToPublic(course, studentsCount);

  return {
    ...publicData,
    units: course.units.map((unit) => ({
      unitNumber: unit.unitNumber,
      name: unit.name,
      description: unit.description,
      detail: unit.detail,
      materials: unit.materials.map((material) => ({
        title: material.title,
        url: material.url,
      })),
      questions: (unit.questions || []).map((q: any) => q.toHexString()),
    })),
  };
}

/**
 * Maps a course to professor view (owner of the course)
 * Includes all content but students are summarized without sensitive data
 */
export function mapCourseToProfessor(
  course: Course,
  studentsCount: number
): CourseProfessorResponse {
  const enrolledData = mapCourseToEnrolled(course, studentsCount);

  return {
    ...enrolledData,
  };
}
