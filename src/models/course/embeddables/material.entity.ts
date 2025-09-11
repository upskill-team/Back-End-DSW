/**
 * @module Models/Course/Embeddables/Material
 * @remarks Defines the embeddable class for course materials.
 */

import { Embeddable, Property } from '@mikro-orm/core';

/**
 * Represents a learning material (e.g., a PDF, video link, or external resource)
 * embedded within a course unit.
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
   * The URL to access the material resource.
   * @type {string}
   */
  @Property()
  url!: string;
}
