/**
 * @module Models/Course/Entity
 * @remarks Defines the database schema for the Course entity and its embeddable components.
 */

import {
  Entity,
  Property,
  ManyToOne,
  Rel,
  ManyToMany,
  Collection,
  Embedded,
  Enum,
  OneToMany,
} from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { CourseType } from '../courseType/courseType.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Unit } from './embeddables/unit.entity.js';
import { Student } from '../student/student.entity.js';
import { Enrollement } from '../Enrollement/enrollement.entity.js';
import { InstitutionCourse } from './embeddables/institution.entity.js';

/**
 * Defines the possible lifecycle states of a course.
 * @enum {string}
 */
export enum status {
  IN_DEVELOPMENT = 'en-desarrollo',
  BLOCKED = 'bloqueado',
  PUBLISHED = 'publicado',
  PAUSED = 'pausado',
}

/**
 * Represents a course, the central element of the platform.
 * It contains all metadata and the structured content of the course itself.
 * @class Course
 * @extends BaseEntity
 */
@Entity()
export class Course extends BaseEntity {
  /**
   * The public name of the course.
   * @type {string}
   */
  @Property()
  name!: string;

  /**
   * A summary of what the course is about.
   * @type {string}
   */
  @Property({ type: 'text' })
  description!: string;

  /**
   * Determines if the course requires payment. Defaults to true (free).
   * @type {boolean}
   */
  @Property({ default: true })
  isFree: boolean = true;

  /**
   * The cost of the course if `isFree` is false.
   * @type {number | undefined}
   */
  @Property({ type: 'number', nullable: true })
  price?: number;

  /**
   * The current lifecycle status of the course.
   * Defaults to 'en-desarrollo'.
   * @type {status}
   */
  @Enum(() => status)
  @Property({ default: status.IN_DEVELOPMENT, nullable: false })
  status: status = status.IN_DEVELOPMENT

  /**
   * The image of the course.
   * @type {string | undefined}
   */
  @Property({ type: 'string', nullable: true })
  imageUrl?: string;

  /**
   * The structured content of the course, divided into units.
   * @type {Unit[]}
   */
  @Embedded(() => Unit, { array: true, default: [] })
  units: Unit[] = [];


  /**
   * The institution offering the course.
   * @type {InstitutionCourse | undefined}
   */
  @Embedded(() => InstitutionCourse, { nullable: true })
  institution?: InstitutionCourse;

  /**
   * The type or category this course belongs to.
   * @type {Rel<CourseType>}
   */
  @ManyToOne(() => CourseType)
  courseType!: Rel<CourseType>;

  /**
   * The professor responsible for the course.
   * @type {Rel<Professor>}
   */
  @ManyToOne(() => Professor)
  professor!: Rel<Professor>;

  /**
   * A collection of enrollements associated with this course.
   * @type {Collection<Rel<Enrollement>>}
   */
  @OneToMany(() => Enrollement, (enrollement) => enrollement.course)
  enrollements = new Collection<Rel<Enrollement>>(this);

  /**
   * A collection of students enrolled in the course.
   * @type {Collection<Student>}
   */
  @ManyToMany(() => Student, (student) => student.courses)
  students = new Collection<Student>(this);
}
