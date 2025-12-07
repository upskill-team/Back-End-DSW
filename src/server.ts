/**
 * @module Server
 * @remarks Main entry point for the application execution.
 * It handles database connection, server initialization, and background tasks.
 */

import { createApp } from './app.js';
import { orm } from './shared/db/orm.js';
import { logger } from './shared/utils/logger.js';
import { ScheduledNotificationService } from './shared/services/scheduled-notification.service.js';

/**
 * Bootstraps the application.
 * 1. Connects to the database.
 * 2. Updates the schema (if applicable).
 * 3. Initializes the Express app.
 * 4. Starts the HTTP server.
 * 5. Schedules background jobs.
 */
async function startServer() {
  try {
    // Initialize database connection
    await orm.connect();

    // Update database schema
    await orm.getSchemaGenerator().updateSchema();
    logger.info('Database connected and schema updated successfully.');

    // Create Express application
    const app = createApp();

    // Start listening
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}/`);
      logger.info(`API docs available at http://localhost:${PORT}/api-docs`);

      // Initialize scheduled notifications
      const scheduledNotificationService = new ScheduledNotificationService(
        orm.em,
        logger
      );
      scheduledNotificationService.scheduleDailyReminder();
      logger.info('Scheduled notification service initialized');
    });

    // Graceful Shutdown handling
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(async () => {
        try {
          await orm.close();
          logger.info('Database connection closed.');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during database disconnection.');
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
