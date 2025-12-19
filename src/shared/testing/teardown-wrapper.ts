/**
 * @module Shared/Testing/Teardown
 * @remarks Global teardown for Jest tests - stops MongoDB Memory Server.
 */

/**
 * Global Teardown for Jest
 * Stops MongoDB Memory Server after running all tests
 */
module.exports = async () => {
  const mongoServer = (global as any).__MONGO_SERVER__;

  if (mongoServer) {
    console.log('Stopping MongoDB Memory Server...');
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
  }
};
