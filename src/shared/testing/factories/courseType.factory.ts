/**
 * @module Shared/Testing/Factories/CourseType
 * @remarks Factory for creating test course type entities.
 */

import { EntityManager } from '@mikro-orm/core';
import { CourseType } from '../../../models/courseType/courseType.entity.js';

/**
 * Factory to create test course types
 */
export const courseTypeFactory = {
  /**
   * Creates a course type in memory (doesn't persist)
   */
  build: (overrides: Partial<CourseType> = {}): CourseType => {
    const random = Math.random().toString(36).substring(7);
    const courseType = new CourseType();

    courseType.name = overrides.name ?? `Tipo ${random}`;
    courseType.description =
      overrides.description ?? `Descripción del tipo ${random}`;

    return courseType;
  },

  /**
   * Creates and persists a course type to the database
   */
  create: async (
    em: EntityManager,
    overrides: Partial<CourseType> = {}
  ): Promise<CourseType> => {
    const courseType = courseTypeFactory.build(overrides);
    await em.persistAndFlush(courseType);
    return courseType;
  },
};
