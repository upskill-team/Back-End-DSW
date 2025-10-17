/**
 * @module Models/Course/Embeddables/InstitutionCourse
 * @remarks Defines the embeddable class for course Institution.
 */

import { Embeddable, Property } from "@mikro-orm/core";


/**
 * Represents an educational or corporate institution within the platform. 
 * This is an embeddable class used within
 * @class InstitutionCourse
 */
@Embeddable()
export class InstitutionCourse {

  /**
   * The official name of the institution.
   */
  @Property({ nullable: false })
  name!: string

    /**
   * Alternative names or acronyms for the institution.
   * Used to prevent duplicate entries with different naming conventions.
   */
  @Property({ type: 'array', nullable: true })
  aliases?: string[]

}