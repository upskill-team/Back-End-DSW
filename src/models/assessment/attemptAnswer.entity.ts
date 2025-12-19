/**
 * @module Models/Assessment/AttemptAnswer
 * @remarks Defines the database schema for the AttemptAnswer entity.
 */

import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
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
   * Can also be an array of option IDs for multiple selection questions.
   * @type {string | number | string[]}
   */
  @Property({ type: 'json', nullable: false })
  answer!: string | number | string[];

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

  /**
   * Feedback provided by the professor for this answer.
   * Typically used for open-ended questions or to provide additional context.
   * @type {string | undefined}
   */
  @Property({ type: 'text', nullable: true })
  feedback?: string;

  // Virtual properties for frontend compatibility

  /**
   * For multiple choice questions, returns the array of selected option IDs.
   * @returns {string[] | null}
   */
  @Property({ persist: false })
  get selectedOptions(): string[] | null {
    if (typeof this.answer === 'number') {
      return [`opt${this.answer}`];
    }
    if (Array.isArray(this.answer)) {
      return this.answer;
    }
    return null;
  }
  set selectedOptions(_value: string[] | null) {
    // Setter for MikroORM compatibility
  }

  /**
   * For open-ended questions, returns the text answer.
   * @returns {string | null}
   */
  @Property({ persist: false })
  get textAnswer(): string | null {
    if (typeof this.answer === 'string' && !Array.isArray(this.answer)) {
      return this.answer;
    }
    return null;
  }
  set textAnswer(_value: string | null) {
    // Setter for MikroORM compatibility
  }

  /**
   * Alias for pointsAwarded to match frontend expectations.
   * @returns {number | undefined}
   */
  @Property({ persist: false })
  get points(): number | undefined {
    return this.pointsAwarded;
  }
  set points(_value: number | undefined) {
    // Setter for MikroORM compatibility
  }
}
