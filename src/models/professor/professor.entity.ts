/**
 * @module ProfessorEntity
 * @description Defines the database schema for the Professor profile entity.
 */
import {
  Entity,
  OneToMany,
  Property,
  Collection,
  ManyToOne,
  Rel,
  OneToOne,
} from '@mikro-orm/core'
import { BaseEntity } from '../../shared/db/baseEntity.entity.js'
import { Course } from '../course/course.entity.js'
import { Institution } from '../institution/institution.entity.js'
import { User } from '../user/user.entity.js'

/**
 * Represents a Professor's profile, which extends a base User entity.
 * This entity holds professor-specific information and relationships.
 * @class Professor
 */
@Entity()
export class Professor extends BaseEntity {
  /**
   * A one-to-one relationship with the User entity. This is the core link
   * that grants a user professor privileges and data.
   * @type {Rel<User>}
   */
  @OneToOne(() => User, (user) => user.professorProfile, { nullable: false })
  user!: Rel<User>

  /**
   * The current status of the professor's profile (e.g., pending, active, inactive).
   * @type {string}
   */
  @Property({ nullable: false, default: 'pending' })
  state!: string

  /**
   * A collection of courses taught by this professor.
   * @type {Collection<Course>}
   */
  @OneToMany(() => Course, (course) => course.professor)
  courses = new Collection<Course>(this)

  /**
   * The institution to which the professor is affiliated (optional).
   * @type {Rel<Institution>}
   */
  @ManyToOne(() => Institution, { nullable: true })
  institution?: Rel<Institution>
}
