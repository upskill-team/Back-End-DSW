/**
 * @module Auth/RefreshToken/Entity
 * @remarks Defines the Refresh Token schema for secure session management and rotation.
 */
import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { User } from '../models/user/user.entity.js';

@Entity()
export class RefreshToken extends BaseEntity {
  /**
   * The actual token string (opaque handle).
   * Ideally hashed in production, but plain text for this implementation.
   */
  @Property({ unique: true })
  token!: string;

  /**
   * The user who owns this token.
   */
  @ManyToOne(() => User)
  user!: Rel<User>;

  /**
   * When this token stops being valid.
   */
  @Property()
  expiresAt!: Date;

  /**
   * If true, this token was used or invalidated and cannot be used again.
   * Important for detecting token theft.
   */
  @Property({ default: false })
  revoked: boolean = false;

  /**
   * If rotated, which token replaced this one.
   * Used to track the "token family" and detect reuse.
   */
  @Property({ nullable: true })
  replacedByToken?: string;
}