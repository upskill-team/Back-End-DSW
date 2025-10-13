/**
 * @module Models/AttemptAnswer/Entity
 * @remarks Defines the database schema for the AttemptAnswer entity.
 */

import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { AssessmentAttempt } from './assessmentAttempt.entity.js';
import { Question } from '../question/question.entity.js';

/**
 * Represents a single answer given by a student during an assessment attempt.
 * @class AttemptAnswer
 * @extends BaseEntity
 */
@Entity()
export class AttemptAnswer extends BaseEntity {
  /**
   * The assessment attempt this answer belongs to.
   * @type {Rel<AssessmentAttempt>}
   */
  @ManyToOne(() => AssessmentAttempt, { nullable: false })
  attempt!: Rel<AssessmentAttempt>;

  /**
   * The question being answered.
   * @type {Rel<Question>}
   */
  @ManyToOne(() => Question, { nullable: false })
  question!: Rel<Question>;

  /**
   * The answer provided by the student.
   * Can be a string (for text answers) or a number (for multiple choice index).
   * @type {string | number}
   */
  @Property({ type: 'json', nullable: false })
  answer!: string | number;

  /**
   * Whether this answer is correct.
   * Determined by comparing the answer with the question's correct answer.
   * @type {boolean}
   */
  @Property({ nullable: false })
  isCorrect!: boolean;

  /**
   * The date and time when this answer was submitted.
   * @type {Date}
   */
  @Property({ type: 'date' })
  answeredAt: Date = new Date();

  /**
   * Optional points awarded for this answer.
   * Can be used for partial credit or different point values per question.
   * @type {number | undefined}
   */
  @Property({ nullable: true })
  pointsAwarded?: number;
}
