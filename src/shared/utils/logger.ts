/**
 * @module Shared/Utils/Logger
 * @remarks Centralized pino logger configuration for the application.
 * It adapts its output based on the NODE_ENV environment variable.
 */

import pino from 'pino';

let transport;

// In production, we log structured JSON to stdout for log collectors.
if (process.env.NODE_ENV === 'production') {
  transport = pino.transport({
    target: 'pino/file',
    options: { destination: 1 },
  });
} else {
  // In development, we log to the console with pino-pretty and also to a file.
  transport = pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        level: 'trace',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        },
      },
      {
        target: 'pino/file',
        level: 'trace',
        options: {
          destination: './logs/app.log',
          mkdir: true,
        },
      },
    ],
  });
}

/**
 * @remarks Shared logger instance.
 * Configured to output logs differently for development and production environments.
 */
export const logger = pino(transport);