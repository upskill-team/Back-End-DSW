/**
 * @module Models/Student/Entity
 * @remarks Defines the database schema for the Student profile entity.
 */

import {
  Entity,
  Cascade,
  Collection,
  ManyToMany,
  Rel,
  OneToOne,
} from '@mikro-orm/core';
import { Course } from '../course/course.entity.js';
import { User } from '../user/user.entity.js'
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';

/**
 * Represents a Student's profile, linked to a base User entity.
 * This entity tracks the courses a student is enrolled in.
 * @class Student
 */
@Entity()
export class Student extends BaseEntity {

  /**
   * A one-to-one relationship with the User entity. This links the student
   * profile to the core user account.
   * @type {Rel<User>}
   */
  @OneToOne(() => User, (user) => user.studentProfile, { nullable: false })
  user!: Rel<User>;

  /**
   * A collection of courses this student is enrolled in.
   * This is a many-to-many relationship, owned by the Student entity.
   * @type {Collection<Course>}
   */
  @ManyToMany(() => Course, (course) => course.students, {
    cascade: [Cascade.ALL],
    owner: true,
  })
  courses = new Collection<Course>(this);
}
