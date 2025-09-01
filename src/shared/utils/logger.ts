import pino from 'pino';

/**
 * @module Logger
 * @description Centralized pino logger configuration for the application.
 * It uses pino-pretty for human-readable logs in development and structured
 * JSON logs in production.
 */

/**
 * @description Shared logger instance.
 * @example
 * import { logger } from '../shared/utils/logger';
 * logger.info('This is an informational message.');
 * logger.error({ err }, 'An error occurred.');
 */
export const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          },
        }
      : undefined,
});