import pino from 'pino';

/**
 * @module Logger
 * @description Centralized pino logger configuration for the application.
 */

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      level: 'trace',
      options: {
        colorize: true,
        ignore: 'pid,hostname,context,req,res',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        messageFormat: '{reqId} - {msg}',
      },
    },
    {
      target: 'pino-socket',
      level: 'trace',
      options: {
        address: 'localhost',
        port: 5044,
      },
    }
  ],
});

/**
 * @description Shared logger instance.
 */
export const logger = pino(
  process.env.NODE_ENV !== 'production' ? transport : undefined
);