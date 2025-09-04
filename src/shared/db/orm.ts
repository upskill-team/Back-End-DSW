/**
 * @module Shared/DB/ORM
 * @remarks Initializes and exports the global MikroORM instance for the application.
 * This setup allows the ORM to be accessible throughout the application as a singleton.
 */

import { MikroORM } from '@mikro-orm/core'
import { MongoDriver } from '@mikro-orm/mongodb'
import config from './mikro-orm.config.js'

/**
 * The initialized MikroORM instance.
 * @const {Promise<MikroORM<MongoDriver>>} orm
 */
export const orm = await MikroORM.init<MongoDriver>(config)