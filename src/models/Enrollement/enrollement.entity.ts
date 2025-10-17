/**
 * @module Models/Enrollement/Entity
 * @remarks Defines the database schema for the Enrollement entity.
 */

import {
  Entity,
  Property,
  ManyToOne,
  Enum,
  Rel,
  Unique,
} from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Course } from '../course/course.entity.js';
import { Student } from '../student/student.entity.js';

/**
 * Possible states of an inscription.
 */
export enum EnrollmentState {
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

/**
 * Represents an enrollement record, linking students to courses.
 * It tracks the status, progress, and grade of the enrollement.
 * @class Enrollement
 * @extends BaseEntity
 */
@Entity()
@Unique({ properties: ['student', 'course'] })
export class Enrollement extends BaseEntity {
  /**
   * Course linked to the enrollement.
   * @param {Rel<Course>} course
   */
  @ManyToOne(() => Course)
  course!: Rel<Course>;

  /**
   * Stududent linked to the enrollement.
   * @param {Rel<Student>} student
   */
  @ManyToOne(() => Student)
  student!: Rel<Student>;

  /**
   * Date and time when the enrollement entity was created.
   * @type {Date}
   */
  @Property({ type: 'date', nullable: true })
  createdAt?: Date = new Date();

  /**
   * Incription date.
   * @param {Date} enrolledAt
   */
  @Property({ type: 'date' })
  enrolledAt: Date = new Date();

  /**
   * Status of the enrollement.
   * @param {EnrollmentState} state
   */
  @Enum(() => EnrollmentState)
  @Property({ default: EnrollmentState.ENROLLED, nullable: false })
  state: EnrollmentState = EnrollmentState.ENROLLED;

  /**
   * Score obtained in the course (opcional).
   * @param {number} grade
   */
  @Property({ type: 'number', nullable: true })
  grade?: number;

  /**
   * Progress percentage in the course (0-100).
   * @param {number} progress
   */
  @Property({ type: 'number', nullable: true, default: 0 })
  progress?: number;

  /**
   * Array of unit numbers completed by the student.
   * Used to track which units have been finished.
   * @param {number[]} completedUnits
   */
  @Property({ type: 'array', default: [] })
  completedUnits: number[] = [];
}
