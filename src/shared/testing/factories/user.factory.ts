/**
 * @module Shared/Testing/Factories/User
 * @remarks Factory for creating test user entities.
 */

import { EntityManager } from '@mikro-orm/core';
import { User, UserRole } from '../../../models/user/user.entity.js';
import bcrypt from 'bcryptjs';

/**
 * Factory to create test users
 * Generates valid data with random values
 */
export const userFactory = {
  /**
   * Creates and persists a user to the database
   */
  create: async (
    em: EntityManager,
    overrides: Partial<User> = {}
  ): Promise<User> => {
    const random = Math.random().toString(36).substring(7);

    const userData = {
      mail: overrides.mail ?? `user${random}@test.com`,
      password: overrides.password ?? 'password123',
      role: overrides.role ?? UserRole.STUDENT,
      name: overrides.name ?? 'Test',
      surname: overrides.surname ?? 'User',
      profile_picture:
        overrides.profile_picture ?? 'https://via.placeholder.com/150',
    };

    // Hash password if plain text
    if (!userData.password.startsWith('$2')) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = em.create(User, userData);
    await em.persistAndFlush(user);
    return user;
  },
};
