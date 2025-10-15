/**
 * @module Shared/Utils/StudentHelper
 * @remarks Helper functions for student-related operations
 */

import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Student } from '../../models/student/student.entity.js';

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
  const student = await em.findOne(Student, { user: new ObjectId(userId) });

  if (!student) {
    throw new Error('User is not a student');
  }

  return student.id!;
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
  const student = await em.findOne(Student, { user: new ObjectId(userId) });

  if (!student) {
    throw new Error('User is not a student');
  }

  return student;
}
