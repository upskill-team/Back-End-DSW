/**
 * @module Models/Professor/Entity
 * @remarks Defines the database schema for the Professor profile entity.
 */
import {
  Entity,
  OneToMany,
  Property,
  Collection,
  ManyToOne,
  OneToOne,
} from '@mikro-orm/core'
import type { Rel } from '@mikro-orm/core'
import { BaseEntity } from '../../shared/db/baseEntity.entity.js'
import { Course } from '../course/course.entity.js'
import { Institution } from '../institution/institution.entity.js'
import { User } from '../user/user.entity.js'

/**
 * Represents a Professor's profile, which extends a base User entity.
 * This entity holds professor-specific information and relationships.
 * A professor can only belong to ONE institution at a time.
 * @see {@link User}
 * @see {@link Institution}
 * @see {@link Course}
 */
@Entity()
export class Professor extends BaseEntity {
  /**
   * A one-to-one relationship with the User entity.
   */
  @OneToOne(() => User, (user) => user.professorProfile, { nullable: false })
  user!: Rel<User>

  /**
   * The current status of the professor's profile (e.g., pending, active, inactive).
   */
  @Property({ nullable: false, default: 'pending' })
  state!: string

  /**
   * The date and time when the professor profile was created.
   * @type {Date}
   */
  @Property({ type: 'date', nullable: true })
  createdAt?: Date = new Date();

  /**
   * A collection of courses taught by this professor.
   */
  @OneToMany(() => Course, (course) => course.professor)
  courses = new Collection<Course>(this)

  /**
   * The institution to which the professor is affiliated (optional).
   * A professor can only belong to ONE institution.
   */
  @ManyToOne(() => Institution, { nullable: true })
  institution?: Rel<Institution>

  /**
   * The institution this professor manages (if any).
   * This is a one-to-one relationship - a professor can only manage ONE institution,
   * and that institution can only have ONE manager.
   * If this field is set, it means this professor is the manager of that institution
   * and also belongs to it (institution field should point to the same institution).
   */
  @OneToOne(() => Institution, (institution) => institution.manager, {
    nullable: true,
  })
  managedInstitution?: Rel<Institution>
}