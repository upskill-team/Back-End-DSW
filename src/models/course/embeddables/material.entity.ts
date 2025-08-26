import { Embeddable, Property } from '@mikro-orm/core';

/**
 * Represents a learning material embedded within a course unit.
 * @class Material
 */
@Embeddable()
export class Material {
  /**
   * The title of the material.
   * @type {string}
   */
  @Property()
  title!: string;

  /**
   * A brief description of the material.
   * @type {string}
   */
  @Property({ type: 'text', nullable: true })
  description?: string;

  /**
   * The URL to access the material.
   * @type {string}
   */
  @Property()
  url!: string;
}
