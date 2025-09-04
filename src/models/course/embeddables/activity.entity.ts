/**
 * @module Models/Course/Embeddables/Activity
 * @remarks Defines the embeddable classes for course activities.
 */

import { Embeddable, Property, Embedded } from '@mikro-orm/core';

/**
 * Represents a single option in a multiple-choice question.
 * This class is embedded within an Activity.
 * @class MultipleChoiceOption
 */
@Embeddable()
class MultipleChoiceOption {
  /**
   * The text content of the option.
   * @type {string}
   */
  @Property()
  text!: string;

  /**
   * Indicates if this option is the correct answer.
   * @type {boolean}
   */
  @Property({ default: false })
  isCorrect!: boolean;
}

/**
 * Represents an activity (e.g., a multiple-choice quiz)
 * embedded within a course unit.
 * @class Activity
 */
@Embeddable()
export class Activity {
  /**
   * The name of the activity.
   * @type {string}
   */
  @Property()
  name!: string;

  /**
   * A detailed description or instructions for the activity.
   * @type {string}
   */
  @Property({ type: 'text' })
  description!: string;

  /**
   * The start date for when the activity becomes available (optional).
   * @type {Date | undefined}
   */
  @Property({ nullable: true })
  startDate?: Date;

  /**
   * The end date or deadline for the activity (optional).
   * @type {Date | undefined}
   */
  @Property({ nullable: true })
  endDate?: Date;

  /**
   * The question text for the multiple-choice quiz.
   * @type {string}
   */
  @Property({ type: 'text' })
  question!: string;

  /**
   * An array of possible answers for the quiz.
   * @type {MultipleChoiceOption[]}
   */
  @Embedded(() => MultipleChoiceOption, { array: true, default: [] })
  options: MultipleChoiceOption[] = [];
}
