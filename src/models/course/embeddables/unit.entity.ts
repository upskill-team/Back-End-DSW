/**
 * @module Models/Course/Embeddables/Unit
 * @remarks Defines the embeddable class for a course Unit, which acts as a container for content.
 */

import { Embeddable, Property, Embedded } from '@mikro-orm/core';
import { Activity } from './activity.entity.js';
import { Material } from './material.entity.js';

/**
 * Represents a unit of study embedded within a course, similar to a chapter or a lesson.
 * It contains learning materials and interactive activities.
 * @class Unit
 */
@Embeddable()
export class Unit {
  /**
   * The sequential number of the unit, used for ordering within a course.
   * @type {number}
   */
  @Property()
  unitNumber!: number;

  /**
   * The name or title of the unit.
   * @type {string}
   */
  @Property()
  name!: string;

  /**
   * The main instructional content of the unit, typically in Markdown format.
   * @type {string}
   */
  @Property({ type: 'text' })
  detail!: string;

  /**
   * A collection of activities associated with this unit.
   * @type {Activity[]}
   */
  @Embedded(() => Activity, { array: true, default: [] })
  activities: Activity[] = [];

  /**
   * A collection of learning materials associated with this unit.
   * @type {Material[]}
   */
  @Embedded(() => Material, { array: true, default: [] })
  materials: Material[] = [];
}
