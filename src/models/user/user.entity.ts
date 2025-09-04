/**
 * @module Models/User
 * @remarks Defines the database schema for the core User entity.
 */

import {
  Entity,
  OneToMany,
  Property,
  Collection,
  Rel,
  Enum,
  OneToOne,
} from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Student } from '../student/student.entity.js';
import { Appeal } from '../appeal/appeal.entity.js';

/**
 * Defines the possible roles a user can have within the system.
 * @enum {string}
 */
export enum UserRole {
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  STUDENT = 'student',
}

/**
 * Represents a user in the system. This is the central entity for authentication and identity.
 * It is linked to specific role profiles like Student or Professor.
 * @class User
 * @extends BaseEntity
 */
@Entity()
export class User extends BaseEntity {

  /**
   * The user's first name.
   * @type {string}
   */
  @Property({ nullable: false })
  name!: string;

  /**
   * The user's last name.
   * @type {string}
   */
  @Property({ nullable: false })
  surname!: string;

  /**
   * The user's unique email address, used for login.
   * @type {string}
   */
  @Property({ nullable: false, unique: true })
  mail!: string;

  /**
   * URL of the user's profile picture.
   * @type {string | undefined}
   */
  @Property({ nullable: true })
  profile_picture?: string;

  /**
   * The user's hashed password. This field is hidden from API responses.
   * @type {string}
   */
  @Property({ nullable: false, hidden: true }) //hidden true to not expose password in responses
  password!: string;

  /**
   * A token for password reset functionality. Hidden from API responses.
   * @type {string | undefined}
   */
  @Property({ type: 'string', nullable: true, hidden: true })
  resetPasswordToken?: string;

  /**
   * The expiration date for the password reset token. Hidden from API responses.
   * @type {Date | undefined}
   */
  @Property({ type: 'datetime', nullable: true, hidden: true })
  resetPasswordExpires?: Date;

  /**
   * The role of the user, determining their permissions.
   * @type {UserRole}
   */
  @Enum( () => UserRole)
  role: UserRole = UserRole.STUDENT;

  /**
   * A one-to-one link to the user's student profile, if it exists.
   * @type {Rel<Student> | undefined}
   */
  @OneToOne(() => Student, (student) => student.user, {
    owner: true,
    nullable: true, //nullable: false <- check if this is needed
    orphanRemoval: true,
  })
  studentProfile?: Rel<Student>;

  /**
   * A one-to-one link to the user's professor profile, if it exists.
   * @type {Rel<Professor> | undefined}
   */
  @OneToOne(() => Professor, (professor) => professor.user, {
    owner: true,
    nullable: true,
    orphanRemoval: true,
  })
  professorProfile?: Rel<Professor>

  /**
   * A collection of appeals submitted by this user to become a professor.
   * @type {Collection<Appeal>}
   */
  @OneToMany(() => Appeal, (appeal) => appeal.user)
  appeals = new Collection<Appeal>(this);
}
