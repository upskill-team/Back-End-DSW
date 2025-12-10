/**
 * @module Models/Appeal/Entity
 * @remarks Defines the database schema and relationships for the Appeal entity.
 */

import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { User } from '../user/user.entity.js';

/**
 * Represents a user's application to become a professor.
 * @class Appeal
 */
@Entity()
export class Appeal extends BaseEntity {
  /**
   * The date and time when the appeal was submitted.
   * @type {Date}
   */
  @Property({ nullable: false })
  date!: Date;

  /**
   * The current status of the appeal (e.g., 'pending', 'accepted', 'rejected').
   * @type {string}
   */
  @Property({ nullable: false, default: 'pending' })
  state!: string;

  /**
   * The area of expertise the user is applying for.
   * @type {string}
   */
  @Property({ nullable: false })
  expertise!: string;

  /**
   * A detailed text explaining the user's experience and motivation.
   * @type {string}
   */
  @Property({ type: 'text', nullable: false })
  experienceMotivation!: string;

  /**
   * An optional URL pointing to a supporting document (e.g., a CV).
   * @type {string | undefined}
   */
  @Property({ nullable: true })
  documentUrl?: string;

  /**
   * The user who submitted this appeal.
   * @type {Rel<User>}
   */
  @ManyToOne(() => User, { nullable: false })
  user!: Rel<User>;
}
