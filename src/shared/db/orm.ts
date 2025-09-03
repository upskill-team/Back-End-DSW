import { MikroORM } from '@mikro-orm/core'
import { MongoDriver } from '@mikro-orm/mongodb'
import config from '../../../mikro-orm.config.js'

export const orm = await MikroORM.init<MongoDriver>(config)