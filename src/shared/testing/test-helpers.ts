import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import config from '../db/mikro-orm.test.config.js';

/**
 * Initializes test database connection
 * @returns MikroORM instance connected to MongoDB Memory Server
 */
export async function initTestDb(): Promise<MikroORM<MongoDriver>> {
  const orm = await MikroORM.init<MongoDriver>(config);

  // Create schema if it doesn't exist
  const generator = orm.getSchemaGenerator();
  await generator.ensureIndexes();

  return orm;
}

/**
 * Clears all collections from the database
 * Keeps indexes but removes all documents
 */
export async function clearDatabase(orm: MikroORM): Promise<void> {
  const driver = orm.em.getDriver() as MongoDriver;
  const db = driver.getConnection().getDb();
  const collections = await db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }

  // Clear EntityManager identity map
  orm.em.clear();
}

/**
 * Closes database connection
 */
export async function closeTestDb(orm: MikroORM): Promise<void> {
  await orm.close(true);
}
