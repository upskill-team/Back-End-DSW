/**
 * @module Shared/Testing/Setup
 * @remarks Global setup for Jest tests - starts MongoDB Memory Server.
 */

/**
 * Global Setup for Jest
 * Starts MongoDB Memory Server before running tests
 * Uses CommonJS because Jest doesn't support ESM in global hooks
 */
module.exports = async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  console.log('Starting MongoDB Memory Server...');

  const mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.0',
    },
  });

  const uri = mongoServer.getUri();
  process.env.MONGO_URI_TEST = uri;

  // Store instance for teardown
  (global as any).__MONGO_SERVER__ = mongoServer;

  console.log(`MongoDB Memory Server ready at: ${uri}`);
};
