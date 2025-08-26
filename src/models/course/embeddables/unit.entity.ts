import { Embeddable, Property, Embedded } from '@mikro-orm/core';
import { Activity } from './activity.entity.js';
import { Material } from './material.entity.js';

/**
 * Represents a unit of study embedded within a course.
 * @class Unit
 */
@Embeddable()
export class Unit {
  /**
   * The sequential number of the unit for ordering.
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
   * The main content of the unit, expected to be in Markdown format.
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
