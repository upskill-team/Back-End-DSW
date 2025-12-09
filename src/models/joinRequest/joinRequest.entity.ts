/**
 * @module Models/JoinRequest/Entity
 * @remarks Defines the database schema and relationships for the JoinRequest entity.
 */
import { Entity, Property, ManyToOne, Rel, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Institution } from '../institution/institution.entity.js';

/**
 * Defines the possible lifecycle states of a join request.
 * @enum {string}
 */
export enum JoinRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/**
 * Represents a professor's request to join an institution.
 * @class JoinRequest
 * @extends BaseEntity
 */
@Entity()
export class JoinRequest extends BaseEntity {
  /**
   * The professor who is making the request.
   * @type {Rel<Professor>}
   */
  @ManyToOne(() => Professor, { nullable: false })
  professor!: Rel<Professor>;

  /**
   * The institution the professor wants to join.
   * @type {Rel<Institution>}
   */
  @ManyToOne(() => Institution, { nullable: false })
  institution!: Rel<Institution>;

  /**
   * The date and time when the request was submitted.
   * @type {Date}
   */
  @Property({ type: 'date', nullable: false })
  requestDate: Date = new Date();

  /**
   * The current status of the request.
   * @type {JoinRequestStatus}
   */
  @Enum(() => JoinRequestStatus)
  @Property({ nullable: false, default: JoinRequestStatus.PENDING })
  status: JoinRequestStatus = JoinRequestStatus.PENDING;
}
