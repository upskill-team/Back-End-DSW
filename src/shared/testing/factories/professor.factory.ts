import { EntityManager } from '@mikro-orm/core';
import { Professor } from '../../../models/professor/professor.entity.js';
import { userFactory } from './user.factory.js';
import { UserRole } from '../../../models/user/user.entity.js';

/**
 * Factory to create test professors
 */
export const professorFactory = {
  /**
   * Creates a professor in memory (doesn't persist)
   */
  build: (overrides: Partial<Professor> = {}): Professor => {
    const professor = new Professor();

    if (overrides.user) {
      professor.user = overrides.user;
    }

    professor.state = overrides.state ?? 'accepted';
    professor.createdAt = overrides.createdAt ?? new Date();

    if (overrides.institution) {
      professor.institution = overrides.institution;
    }

    return professor;
  },

  /**
   * Creates and persists a professor with their user to the database
   */
  create: async (
    em: EntityManager,
    overrides: Partial<Professor> = {}
  ): Promise<Professor> => {
    // Create user if not provided
    if (!overrides.user) {
      overrides.user = await userFactory.create(em, {
        role: UserRole.PROFESSOR,
      });
    }

    const professor = professorFactory.build(overrides);
    await em.persistAndFlush(professor);

    return professor;
  },
};
