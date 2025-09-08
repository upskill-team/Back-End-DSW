/**
 * @module Shared/Utils/ProfessorHelper
 * @remarks Utility functions for professor-related operations.
 */

import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Professor } from '../../models/professor/professor.entity.js';
import { User } from '../../models/user/user.entity.js';

/**
 * Helper function to get the professor ID from a user ID.
 * This function handles the relationship between User and Professor entities.
 *
 * @param {EntityManager} em - The EntityManager instance for database operations.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<string>} A promise resolving to the professor ID.
 * @throws {Error} If the user is not found or doesn't have a professor profile.
 */
export async function getProfessorIdFromUserId(
  em: EntityManager,
  userId: string
): Promise<string> {
  const userObjectId = new ObjectId(userId);

  // Find the user and populate the professor profile
  const user = await em.findOne(
    User,
    { _id: userObjectId },
    { populate: ['professorProfile'] }
  );

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.professorProfile) {
    throw new Error('User does not have a professor profile');
  }

  return user.professorProfile._id!.toString();
}

/**
 * Helper function to get the professor entity from a user ID.
 * This function returns the complete Professor entity instead of just the ID.
 *
 * @param {EntityManager} em - The EntityManager instance for database operations.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Professor>} A promise resolving to the Professor entity.
 * @throws {Error} If the user is not found or doesn't have a professor profile.
 */
export async function getProfessorFromUserId(
  em: EntityManager,
  userId: string
): Promise<Professor> {
  const userObjectId = new ObjectId(userId);

  // Find the user and populate the professor profile
  const user = await em.findOne(
    User,
    { _id: userObjectId },
    { populate: ['professorProfile'] }
  );

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.professorProfile) {
    throw new Error('User does not have a professor profile');
  }

  return user.professorProfile;
}
