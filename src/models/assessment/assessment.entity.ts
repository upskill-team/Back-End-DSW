/**
 * @module Models/Assessment/Entity
 * @remarks Defines the database schema for the Assessment entity.
 */

import {
  Entity,
  Property,
  ManyToOne,
  ManyToMany,
  Collection,
} from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Course } from '../course/course.entity.js';
import { Question } from '../question/question.entity.js';

/**
 * Represents an Assessment (evaluation) for a course.
 * An assessment is a collection of questions that students must complete.
 * @class Assessment
 * @extends BaseEntity
 */
@Entity()
export class Assessment extends BaseEntity {
  /**
   * The title of the assessment.
   * @type {string}
   */
  @Property({ nullable: false })
  title!: string;

  /**
   * A description of the assessment, explaining its purpose or instructions.
   * @type {string}
   */
  @Property({ type: 'text', nullable: true })
  description?: string;

  /**
   * The course this assessment belongs to.
   * @type {Rel<Course>}
   */
  @ManyToOne(() => Course, { nullable: false })
  course!: Rel<Course>;

  /**
   * The collection of questions that make up this assessment.
   * This is a many-to-many relationship with Question.
   * @type {Collection<Question>}
   */
  @ManyToMany(() => Question, undefined, { owner: true })
  questions = new Collection<Question>(this);

  /**
   * The duration of the assessment in minutes.
   * If null, there is no time limit.
   * @type {number | undefined}
   */
  @Property({ nullable: true })
  durationMinutes?: number;

  /**
   * The passing score required to pass the assessment (as a percentage).
   * @type {number}
   * @example 70 (means 70% is required to pass)
   */
  @Property({ default: 70 })
  passingScore: number = 70;

  /**
   * Maximum number of attempts allowed for this assessment.
   * If null, unlimited attempts are allowed.
   * @type {number | undefined}
   */
  @Property({ nullable: true })
  maxAttempts?: number;

  /**
   * Whether the assessment is currently active and available to students.
   * @type {boolean}
   */
  @Property({ default: true })
  isActive: boolean = true;

  /**
   * The date when the assessment becomes available to students.
   * If null, it's available immediately.
   * @type {Date | undefined}
   */
  @Property({ type: 'date', nullable: true })
  availableFrom?: Date;

  /**
   * The date when the assessment is no longer available to students.
   * If null, there is no deadline.
   * @type {Date | undefined}
   */
  @Property({ type: 'date', nullable: true })
  availableUntil?: Date;
}
