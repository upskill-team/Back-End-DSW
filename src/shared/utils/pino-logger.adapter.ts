/**
 * @module Shared/Utils/LoggerAdapter
 * @remarks An adapter to bridge MikroORM's logging system with our application's Pino logger.
 */

import { Logger as MikroOrmLogger, LogContext, LoggerOptions } from '@mikro-orm/core';
import { logger as pinoLogger } from './logger.js';

/**
 * Adapter class that implements the MikroORM Logger interface.
 * @remarks Redirects MikroORM log output to our centralized Pino logger instance.
 * This ensures that all logs, whether from application logic or from the ORM (like database queries),
 * share the same structured format.
 */
export class PinoLogger implements MikroOrmLogger {
  private readonly logger = pinoLogger.child({ context: 'mikro-orm' })

  /**
   * Creates a new PinoLogger instance.
   * @param {LoggerOptions} _options - MikroORM logger options (unused in this implementation).
   */
  constructor(_options: LoggerOptions) {
    // This constructor is required to match the ILogger interface, but we don't use the options.
  }

  /**
   * Sets the debug mode. This is a no-op as Pino's log level is configured independently.
   * @param {boolean | string[]} _debugMode - The debug mode settings from MikroORM.
   */
  setDebugMode(_debugMode: boolean | string[]): void {
    // Pino's log level is managed in its own configuration, so we don't need to do anything here.
  }

  /**
   * Checks if a logging namespace is enabled. We always return true to let
   * MikroORM pass all logs to our `log` method, where Pino's level filtering takes over.
   * @param {string} _namespace - The logging namespace to check (e.g., 'query').
   * @returns {boolean} Always returns true.
   */
  isEnabled(_namespace: string): boolean {
    return true;
  }

  /**
   * Logs messages from MikroORM, mapping its namespaces to appropriate Pino log levels.
   * @param {string} namespace - The MikroORM logging namespace.
   * @param {string} message - The log message.
   */
  log(namespace: string, message: string): void {
    // Strip colors from the message as Pino will handle coloring
    // eslint-disable-next-line no-control-regex
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '')

    switch (namespace) {
      case 'query':
        this.logger.debug(cleanMessage);
        break;
      case 'discovery':
      case 'info':
        this.logger.info(cleanMessage);
        break;
      case 'warning':
        this.logger.warn(cleanMessage);
        break;
      case 'error':
        this.logger.error(cleanMessage);
        break;
      default:
        this.logger.trace({ namespace }, cleanMessage);
    }
  }

  // The following methods are required by the MikroOrmLogger interface
  // but we delegate all logging to the `log` method above.
  info(namespace: string, message: string): void {
    this.log(namespace, message);
  }
  warn(namespace: string, message: string): void {
    this.log(namespace, message);
  }
  error(namespace: string, message: string): void {
    this.log(namespace, message);
  }
  debug(namespace: string, message: string): void {
    this.log(namespace, message);
  }
  logQuery(context: LogContext): void { 
    this.logger.debug({ ...context }, 'MikroORM Query');
  }
}