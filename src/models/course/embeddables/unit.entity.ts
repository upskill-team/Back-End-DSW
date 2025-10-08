/**
 * @module Models/Course/Embeddables/Unit
 * @remarks Defines the embeddable class for a course Unit, which acts as a container for content.
 */

import { Embeddable, Property, Embedded } from '@mikro-orm/core';
import { Material } from './material.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Represents a unit of study embedded within a course, similar to a chapter or a lesson.
 * It contains learning materials and interactive questions.
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
   * A collection of learning materials associated with this unit.
   * @type {Material[]}
   */
  @Embedded(() => Material, { array: true, default: [] })
  materials: Material[] = [];

  /**
   * An array of ObjectId references to the questions associated with this unit.
   * @type {ObjectId[]}
   */
  @Property({ type: 'array', default: [] })
  questions: ObjectId[] = [];
}
