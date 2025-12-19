/**
 * @module Shared/Testing/Factories/Student
 * @remarks Factory for creating test student entities.
 */

import { EntityManager } from '@mikro-orm/core';
import { Student } from '../../../models/student/student.entity.js';
import { userFactory } from './user.factory.js';
import { UserRole } from '../../../models/user/user.entity.js';

/**
 * Factory to create test students
 */
export const studentFactory = {
  /**
   * Creates a student in memory (doesn't persist)
   */
  build: (overrides: Partial<Student> = {}): Student => {
    const student = new Student();

    if (overrides.user) {
      student.user = overrides.user;
    }

    student.createdAt = overrides.createdAt ?? new Date();

    return student;
  },

  /**
   * Creates and persists a student with their user to the database
   */
  create: async (
    em: EntityManager,
    overrides: Partial<Student> = {}
  ): Promise<Student> => {
    // Create user if not provided
    if (!overrides.user) {
      overrides.user = await userFactory.create(em, { role: UserRole.STUDENT });
    }

    const student = studentFactory.build(overrides);
    await em.persistAndFlush(student);

    return student;
  },
};
