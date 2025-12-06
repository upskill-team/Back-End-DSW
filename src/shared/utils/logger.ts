/**
 * @module Shared/Utils/Logger
 * @remarks Centralized pino logger configuration.
 * Configured according to Better Stack documentation for Custom Ingesting Host.
 */

import pino from 'pino';

const targets: any[] = [];

// 1. Target: Console (pino-pretty)
targets.push({
  target: 'pino-pretty',
  level: 'trace',
  options: {
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
  },
});

// 2. Target: Better Stack (Cloud)
if (process.env.LOG_SOURCE_TOKEN) {
  targets.push({
    target: '@logtail/pino',
    level: 'info',
    options: {
      sourceToken: process.env.LOG_SOURCE_TOKEN,
      options: {
        endpoint: process.env.LOG_SOURCE_URL || 'https://in.logs.betterstack.com',
      },
    },
  });
}

const transport = pino.transport({
  targets: targets,
});

export const logger = pino(
  {
    level: 'trace',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);