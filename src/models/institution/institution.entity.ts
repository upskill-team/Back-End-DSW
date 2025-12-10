/**
 * @module Models/Institution/Entity
 * @remarks Defines the database schema and relationships for the Institution entity.
 */
import {
  Entity,
  OneToMany,
  Property,
  Cascade,
  Collection,
  OneToOne,
} from '@mikro-orm/core'
import type { Rel } from '@mikro-orm/core'
import { BaseEntity } from '../../shared/db/baseEntity.entity.js'
import { Professor } from '../professor/professor.entity.js'

/**
 * Represents an educational or corporate institution within the platform.
 * An institution can have multiple professors associated with it.
 * @see {@link Professor}
 */
@Entity()
export class Institution extends BaseEntity {
  /**
   * The official name of the institution.
   */
  @Property({ nullable: false })
  name!: string

  /**
   * A brief description of the institution's purpose or background.
   */
  @Property({ nullable: false })
  description!: string

  /**
   * Normalized name for validation and preventing duplicates.
   * This is automatically generated from the name field.
   */
  @Property({ nullable: false, unique: true })
  normalizedName!: string

  /**
   * Alternative names or acronyms for the institution.
   * Used to prevent duplicate entries with different naming conventions.
   */
  @Property({ type: 'array', nullable: true })
  aliases?: string[]

  /**
   * The professor who is the manager/owner of this institution.
   * This is a one-to-one relationship since a professor can only manage one institution
   * and an institution can only have one manager.
   */
  @OneToOne(() => Professor, (professor) => professor.managedInstitution, {
    nullable: false,
    owner: true,
  })
  manager!: Rel<Professor>

  /**
   * A collection of all professors associated with this institution.
   */
  @OneToMany(() => Professor, (professor) => professor.institution, {
    cascade: [Cascade.PERSIST],
  })
  professors = new Collection<Professor>(this)
}
