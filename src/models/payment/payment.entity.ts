/**
 * @module Models/Payment/Entity
 * @remarks Defines the database schema for the Payment entity.
 */

import {
  Entity,
  Property,
  ManyToOne,
  Enum,
  Rel,
  OneToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Course } from '../course/course.entity.js';
import { Student } from '../student/student.entity.js';
import { Enrollement } from '../Enrollement/enrollement.entity.js';

/**
 * Possible states of a payment.
 * @enum {string}
 */
export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

/**
 * Represents a payment transaction made through Mercado Pago.
 * This entity stores all payment-related information and serves as the source of truth
 * for financial transactions.
 * 
 * @class Payment
 * @extends BaseEntity
 */
@Entity()
export class Payment extends BaseEntity {
  /**
   * The unique payment ID from Mercado Pago.
   * Used to track the payment in the external payment gateway.
   * @type {string}
   */
  @Property({ nullable: false })
  mercadoPagoId!: string;

  /**
   * The total amount of the payment in cents (centavos).
   * Storing in cents avoids floating-point precision issues.
   * Example: 10000 cents = $100.00 ARS
   * @type {number}
   */
  @Property({ type: 'number', nullable: false })
  amountInCents!: number;

  /**
   * The current status of the payment.
   * @type {PaymentStatus}
   */
  @Enum(() => PaymentStatus)
  @Property({ default: PaymentStatus.PENDING, nullable: false })
  status: PaymentStatus = PaymentStatus.PENDING;

  /**
   * The course that was purchased.
   * @type {Rel<Course>}
   */
  @ManyToOne(() => Course, { nullable: false })
  course!: Rel<Course>;

  /**
   * The student who made the payment.
   * @type {Rel<Student>}
   */
  @ManyToOne(() => Student, { nullable: false })
  student!: Rel<Student>;

  /**
   * The enrollement created as a result of this payment.
   * This is optional because the enrollement might be created after the payment.
   * @type {Rel<Enrollement> | undefined}
   */
  @OneToOne(() => Enrollement, { nullable: true })
  enrollement?: Rel<Enrollement>;

  /**
   * Collection of earnings generated from this payment.
   * Typically includes professor share and platform fee.
   * @type {Collection<Earning>}
   */
  @OneToMany('Earning', 'payment')
  earnings = new Collection<any>(this);

  /**
   * Date and time when the payment entity was created.
   * @type {Date}
   */
  @Property({ type: 'date', nullable: true })
  createdAt?: Date = new Date();

  /**
   * Date and time when the payment was approved.
   * @type {Date}
   */
  @Property({ type: 'date', nullable: false })
  paidAt: Date = new Date();

  /**
   * Additional metadata from Mercado Pago.
   * Stores raw payment information for debugging and auditing purposes.
   * @type {any}
   */
  @Property({ type: 'json', nullable: true })
  metadata?: any;
}
