import { Logger as MikroOrmLogger, LogContext, LoggerOptions } from '@mikro-orm/core';
import { logger as pinoLogger } from './logger.js';

/**
 * @class PinoLogger
 * @implements {MikroOrmLogger}
 * @description An adapter class to bridge MikroORM's logging system with Pino.
 * This allows database queries to be logged in a structured JSON format.
 */
export class PinoLogger implements MikroOrmLogger {
  private readonly logger = pinoLogger.child({ context: 'mikro-orm' })

  /**
   * @constructor
   * @param {LoggerOptions} _options - MikroORM logger options (unused in this implementation).
   */
  constructor(_options: LoggerOptions) {
    // This constructor is required to match the ILogger interface, but we don't use the options.
  }

  /**
   * Sets the debug mode for the logger. This implementation is a no-op
   * because Pino's log level is configured independently at initialization.
   * @param {boolean | string[]} _debugMode - The debug mode settings from MikroORM.
   */
  setDebugMode(_debugMode: boolean | string[]): void {
    // Pino's log level is managed in its own configuration, so we don't need to do anything here.
  }

  /**
   * Checks if a specific logging namespace is enabled.
   * We always return true to allow MikroORM to pass all logs to our `log` method,
   * where Pino's own level filtering will take over.
   * @param {string} _namespace - The logging namespace to check.
   * @returns {boolean} Always returns true.
   */
  isEnabled(_namespace: string): boolean {
    return true;
  }

  /**
   * Logs MikroORM messages. Maps MikroORM's log namespaces to Pino's log levels.
   * @param {string} namespace - The MikroORM logging namespace (e.g., 'query', 'discovery').
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