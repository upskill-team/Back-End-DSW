import { EntityManager } from '@mikro-orm/core';
import { Course, status } from '../../../models/course/course.entity.js';
import { professorFactory } from './professor.factory.js';
import { courseTypeFactory } from './courseType.factory.js';

/**
 * Factory to create test courses
 */
export const courseFactory = {
  /**
   * Creates a course in memory (doesn't persist)
   */
  build: (overrides: Partial<Course> = {}): Course => {
    const random = Math.random().toString(36).substring(7);
    const course = new Course();

    course.name = overrides.name ?? `Curso ${random}`;
    course.description =
      overrides.description ?? `Descripción del curso ${random}`;
    course.isFree = overrides.isFree ?? false;
    course.priceInCents =
      overrides.priceInCents ?? (course.isFree ? 0 : 500000);
    course.status = overrides.status ?? status.PUBLISHED;
    course.imageUrl = overrides.imageUrl ?? 'https://via.placeholder.com/300';

    if (overrides.professor) {
      course.professor = overrides.professor;
    }

    if (overrides.courseType) {
      course.courseType = overrides.courseType;
    }

    return course;
  },

  /**
   * Creates and persists a course with its relationships to the database
   */
  create: async (
    em: EntityManager,
    overrides: Partial<Course> = {}
  ): Promise<Course> => {
    // Create dependencies if not provided
    if (!overrides.professor) {
      overrides.professor = await professorFactory.create(em);
    }

    if (!overrides.courseType) {
      overrides.courseType = await courseTypeFactory.create(em);
    }

    const course = courseFactory.build(overrides);
    await em.persistAndFlush(course);

    return course;
  },
};
