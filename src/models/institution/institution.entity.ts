/**
 * @module InstitutionEntity
 * @description Defines the database schema and relationships for the Institution entity.
 */
import {
  Entity,
  OneToMany,
  Property,
  Cascade,
  Collection,
} from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Professor } from '../professor/professor.entity.js';

/**
 * Represents an educational or corporate institution within the platform.
 * An institution can have multiple professors associated with it.
 * @class Institution
 */
@Entity()
export class Institution extends BaseEntity {
  /**
   * The official name of the institution.
   * @type {string}
   */
  @Property({ nullable: false })
  name!: string;

  /**
   * A brief description of the institution's purpose or background.
   * @type {string}
   */
  @Property({ nullable: false })
  description!: string;

  /**
   * A collection of all professors associated with this institution.
   * This is a one-to-many relationship, managed by the `institution` property on the Professor entity.
   * Cascade.ALL ensures that operations (like deletion) on an institution can propagate to its associated professors if needed.
   * @type {Collection<Professor>}
   */
  @OneToMany(() => Professor, (professor) => professor.institution, {
    cascade: [Cascade.ALL],
  })
  professors = new Collection<Professor>(this);
}
