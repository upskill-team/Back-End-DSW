/**
 * @module Models/AssessmentAttempt/Entity
 * @remarks Defines the database schema for the AssessmentAttempt entity.
 */

import { Entity, Property, ManyToOne, Enum, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Assessment } from '../assessment/assessment.entity.js';
import { Student } from '../student/student.entity.js';

/**
 * Enumeration of possible attempt statuses.
 * @enum {string}
 */
export enum AttemptStatus {
  /** The attempt is currently in progress */
  IN_PROGRESS = 'in_progress',
  /** The attempt has been submitted and completed */
  SUBMITTED = 'submitted',
  /** The attempt was abandoned or timed out */
  ABANDONED = 'abandoned',
}

/**
 * Represents a single attempt by a student to complete an assessment.
 * @class AssessmentAttempt
 * @extends BaseEntity
 */
@Entity()
export class AssessmentAttempt extends BaseEntity {
  /**
   * The assessment being attempted.
   * @type {Rel<Assessment>}
   */
  @ManyToOne(() => Assessment, { nullable: false })
  assessment!: Rel<Assessment>;

  /**
   * The student making this attempt.
   * @type {Rel<Student>}
   */
  @ManyToOne(() => Student, { nullable: false })
  student!: Rel<Student>;

  /**
   * The current status of the attempt.
   * @type {AttemptStatus}
   */
  @Enum(() => AttemptStatus)
  @Property({ default: AttemptStatus.IN_PROGRESS })
  status: AttemptStatus = AttemptStatus.IN_PROGRESS;

  /**
   * The date and time when the attempt was started.
   * @type {Date}
   */
  @Property({ type: 'date' })
  startedAt: Date = new Date();

  /**
   * The date and time when the attempt was submitted.
   * Null if the attempt is still in progress.
   * @type {Date | undefined}
   */
  @Property({ type: 'date', nullable: true })
  submittedAt?: Date;

  /**
   * The final score achieved in this attempt (as a percentage, 0-100).
   * Null until the attempt is submitted and graded.
   * @type {number | undefined}
   */
  @Property({ nullable: true })
  score?: number;

  /**
   * Whether the student passed this attempt based on the passing score.
   * Null until the attempt is submitted and graded.
   * @type {boolean | undefined}
   */
  @Property({ nullable: true })
  passed?: boolean;

  /**
   * The attempt number for this student on this assessment (1, 2, 3, etc.).
   * @type {number}
   */
  @Property({ default: 1 })
  attemptNumber: number = 1;

  /**
   * Additional metadata or notes about the attempt.
   * @type {string | undefined}
   */
  @Property({ type: 'text', nullable: true })
  notes?: string;
}
