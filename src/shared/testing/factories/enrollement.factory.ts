import { EntityManager } from '@mikro-orm/core';
import {
  Enrollement,
  EnrollmentState,
} from '../../../models/Enrollement/enrollement.entity.js';
import { studentFactory } from './student.factory.js';
import { courseFactory } from './course.factory.js';

/**
 * Factory to create test enrollements
 */
export const enrollementFactory = {
  /**
   * Creates an enrollement in memory (doesn't persist)
   */
  build: (overrides: Partial<Enrollement> = {}): Enrollement => {
    const enrollement = new Enrollement();

    if (overrides.student) {
      enrollement.student = overrides.student;
    }

    if (overrides.course) {
      enrollement.course = overrides.course;
    }

    enrollement.createdAt = overrides.createdAt ?? new Date();
    enrollement.enrolledAt = overrides.enrolledAt ?? new Date();
    enrollement.state = overrides.state ?? EnrollmentState.ENROLLED;
    enrollement.progress = overrides.progress ?? 0;
    enrollement.completedUnits = overrides.completedUnits ?? [];

    if (overrides.grade !== undefined) {
      enrollement.grade = overrides.grade;
    }

    return enrollement;
  },

  /**
   * Creates and persists an enrollement with its relationships to the database
   */
  create: async (
    em: EntityManager,
    overrides: Partial<Enrollement> = {}
  ): Promise<Enrollement> => {
    // Create dependencies if not provided
    if (!overrides.student) {
      overrides.student = await studentFactory.create(em);
    }

    if (!overrides.course) {
      overrides.course = await courseFactory.create(em);
    }

    const enrollement = enrollementFactory.build(overrides);

    // Set bidirectional relationships
    overrides.student.enrollements.add(enrollement);
    overrides.course.enrollements.add(enrollement);

    await em.persistAndFlush(enrollement);

    return enrollement;
  },
};
