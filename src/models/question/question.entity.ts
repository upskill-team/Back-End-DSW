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
}
