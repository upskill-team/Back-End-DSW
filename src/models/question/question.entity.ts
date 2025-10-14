/**
 * @module Models/Question/Entity
 * @remarks Defines the database schema for the Question entity.
 */
import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Course } from '../course/course.entity.js';

/**
 * Enumeration of possible question types.
 * @enum {string}
 */
export enum QuestionType {
  /** Multiple choice question with predefined options */
  MultipleChoiceOption = 'MultipleChoiceOption',
}

/**
 * Interface for question payload containing options and correct answer.
 * @interface
 */
export interface QuestionPayload {
  /** Array of available options for the question */
  options: string[];
  /** Index or identifier of the correct answer */
  correctAnswer: number | string;
}

/**
 * Interface for formatted options with id, text, and correctness.
 * @interface
 */
export interface QuestionOption {
  /** Unique identifier for the option */
  id: string;
  /** Text content of the option */
  text: string;
  /** Whether this option is correct */
  isCorrect: boolean;
}

/**
 * Represents a Question entity, which holds information about a specific question.
 * This entity is linked to courses and can have multiple answers.
 * @see {@link Course}
 * @see {@link QuestionType}
 * @see {@link QuestionPayload}
 */
@Entity()
export class Question extends BaseEntity {
  /**
   * The text content of the question.
   * @type {string}
   */
  @Property({ nullable: false, type: 'text' })
  questionText!: string;

  /**
   * The type of question (e.g., multiple choice, true/false, etc.).
   * @type {QuestionType}
   */
  @Enum(() => QuestionType)
  @Property({ nullable: false })
  questionType!: QuestionType;

  /**
   * JSON payload containing question options and correct answer.
   * Structure depends on the question type.
   * @type {QuestionPayload}
   * @example
   * ```json
   * {
   *   "options": ["Option A", "Option B", "Option C", "Option D"],
   *   "correctAnswer": 0
   * }
   * ```
   */
  @Property({ type: 'json', nullable: false })
  payload!: QuestionPayload;

  /**
   * The course this question belongs to.
   * @type {Course}
   */
  @ManyToOne(() => Course, { nullable: false })
  course!: Course;

  /**
   * Optional unit number within the course. If specified, this question belongs to a specific unit.
   * If null, the question belongs to the course's general question bank.
   * @type {number | null}
   */
  @Property({ nullable: true })
  unitNumber?: number;

  /**
   * Points awarded for this question.
   * Default is 10 points per question.
   * @type {number}
   */
  @Property({ default: 10 })
  points: number = 10;

  // Virtual properties for frontend compatibility

  /**
   * Alias for questionText to match frontend expectations.
   * @returns {string}
   */
  @Property({ persist: false })
  get text(): string {
    return this.questionText;
  }
  set text(_value: string) {
    // Setter for MikroORM compatibility
  }

  /**
   * Alias for questionType to match frontend expectations.
   * Returns 'multiple_choice' or 'open_ended'.
   * @returns {string}
   */
  @Property({ persist: false })
  get type(): 'multiple_choice' | 'open_ended' {
    if (this.questionType === QuestionType.MultipleChoiceOption) {
      return 'multiple_choice';
    }
    return 'open_ended';
  }
  set type(_value: 'multiple_choice' | 'open_ended') {
    // Setter for MikroORM compatibility
  }

  /**
   * Formatted options array with id, text, and isCorrect properties.
   * @returns {QuestionOption[]}
   */
  @Property({ persist: false })
  get options(): QuestionOption[] {
    if (!this.payload?.options) {
      return [];
    }

    return this.payload.options.map((option, index) => ({
      id: `opt${index}`,
      text: option,
      isCorrect: this.payload.correctAnswer === index,
    }));
  }
  set options(_value: QuestionOption[]) {
    // Setter for MikroORM compatibility
  }
}
