/**
 * @module Models/Payment/Earning
 * @remarks Defines the database schema for the Earning entity.
 */

import {
  Entity,
  Property,
  ManyToOne,
  Enum,
} from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Payment } from './payment.entity.js';
import { Professor } from '../professor/professor.entity.js';

/**
 * Types of earnings that can be generated from a payment.
 * @enum {string}
 */
export enum EarningType {
  /**
   * The professor's share of the payment (97%).
   */
  PROFESSOR_SHARE = 'professor_share',
  /**
   * The platform's fee (3%).
   */
  PLATFORM_FEE = 'platform_fee',
}

/**
 * Status of an earning entry.
 * @enum {string}
 */
export enum EarningStatus {
  /**
   * Earning has been created but not yet processed.
   */
  PENDING = 'pending',
  /**
   * Earning has been processed and is ready for payout.
   */
  PROCESSED = 'processed',
  /**
   * Earning has been paid out to the recipient.
   */
  PAID_OUT = 'paid_out',
}

/**
 * Represents an earning entry that tracks revenue distribution.
 * Each payment generates multiple earnings: one for the professor and one for the platform.
 * This allows for transparent financial tracking and facilitates payout processing.
 * 
 * @class Earning
 * @extends BaseEntity
 */
@Entity()
export class Earning extends BaseEntity {
  /**
   * The type of earning (professor share or platform fee).
   * @type {EarningType}
   */
  @Enum(() => EarningType)
  @Property({ nullable: false })
  type!: EarningType;

  /**
   * The amount of this earning in cents (centavos).
   * Example: 9700 cents = $97.00 ARS (professor's 97% share of a $100 payment)
   * @type {number}
   */
  @Property({ type: 'number', nullable: false })
  amountInCents!: number;

  /**
   * The payment that generated this earning.
   * @type {Rel<Payment>}
   */
  @ManyToOne(() => Payment, { nullable: false })
  payment!: Rel<Payment>;

  /**
   * The professor who will receive this earning (only for PROFESSOR_SHARE type).
   * This field is null for PLATFORM_FEE earnings.
   * @type {Rel<Professor> | undefined}
   */
  @ManyToOne(() => Professor, { nullable: true })
  professor?: Rel<Professor>;

  /**
   * The current status of this earning.
   * @type {EarningStatus}
   */
  @Enum(() => EarningStatus)
  @Property({ default: EarningStatus.PENDING, nullable: false })
  status: EarningStatus = EarningStatus.PENDING;

  /**
   * Date and time when the earning was created.
   * @type {Date}
   */
  @Property({ type: 'date', nullable: false })
  createdAt: Date = new Date();

  /**
   * Date and time when the earning was processed or paid out.
   * This field is null until the earning is processed.
   * @type {Date | undefined}
   */
  @Property({ type: 'date', nullable: true })
  processedAt?: Date;
}
