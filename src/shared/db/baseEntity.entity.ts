/**
 * @module Shared/DB/BaseEntity
 * @remarks Provides a base entity class for all MikroORM entities.
 */

import { PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * An abstract base class for all entities in the application.
 * It provides common properties like a MongoDB `_id` and a serialized `id` string.
 * @class BaseEntity
 * @abstract
 */
export abstract class BaseEntity {
  /**
   * The primary key, represented as a MongoDB ObjectId.
   * @type {ObjectId}
   */
  @PrimaryKey()
  _id?: ObjectId = new ObjectId();

  /**
   * A virtual property that serializes the `_id` to a string for API responses.
   * @type {string}
   */
  @SerializedPrimaryKey()
  id?: string;

  /*

  @Property({ type: DateTimeType })
  createdAt? = new Date()

  @Property({
    type: DateTimeType,
    onUpdate: () => new Date(),
  })
  updatedAt? = new Date()

  */
}
