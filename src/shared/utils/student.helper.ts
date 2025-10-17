/**
 * @module Shared/Utils/StudentHelper
 * @remarks Helper functions for student-related operations
 */

import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Student } from '../../models/student/student.entity.js';
import { User } from '../../models/user/user.entity.js';

/**
 * Gets a studentId from a userId
 * @param em Entity Manager
 * @param userId User ID from JWT
 * @returns Student ID
 * @throws Error if user is not a student
 */
export async function getStudentIdFromUserId(
  em: EntityManager,
  userId: string
): Promise<string> {
  const user = await em.findOne(User, { _id: new ObjectId(userId) }, { populate: ['studentProfile'] });

  if (!user) {
    throw new Error('User not found for the given ID');
  }

  if (!user.studentProfile) {
    throw new Error('User is not a student');
  }

  return user.studentProfile.id!;
}

/**
 * Gets a student from a userId
 * @param em Entity Manager
 * @param userId User ID from JWT
 * @returns Student entity
 * @throws Error if user is not a student
 */
export async function getStudentFromUserId(
  em: EntityManager,
  userId: string
): Promise<Student> {
  const user = await em.findOne(User, { _id: new ObjectId(userId) }, { populate: ['studentProfile'] });

  if (!user) {
    throw new Error('User not found for the given ID');
  }

  if (!user.studentProfile) {
    throw new Error('User is not a student');
  }

  return user.studentProfile;
}
