/**
 * @module Emails/Services
 * @description Factory Pattern implementation for creating email strategies.
 */

import { Logger } from 'pino';
import {
  EmailStrategy,
  ResetPasswordEmailStrategy,
  AppealAcceptedEmailStrategy,
  AppealRejectedEmailStrategy,
  CoursePurchaseEmailStrategy,
  CourseEnrollmentEmailStrategy,
  NewAssessmentEmailStrategy,
  PendingAppealsReminderEmailStrategy,
  ContactSupportEmailStrategy,
} from '../strategies/email-strategies.js';
import { EmailType, EmailData } from '../types/email-types.js';

/**
 * Factory class for creating email strategy instances.
 * Implements the Factory Pattern to encapsulate strategy creation logic.
 */
export class EmailStrategyFactory {
  private strategies: Map<EmailType, EmailStrategy<any>>;

  constructor(private logger: Logger) {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initializes all available email strategies.
   */
  private initializeStrategies(): void {
    this.strategies.set(
      EmailType.RESET_PASSWORD,
      new ResetPasswordEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.APPEAL_ACCEPTED,
      new AppealAcceptedEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.APPEAL_REJECTED,
      new AppealRejectedEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.COURSE_PURCHASE,
      new CoursePurchaseEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.COURSE_ENROLLMENT,
      new CourseEnrollmentEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.NEW_ASSESSMENT,
      new NewAssessmentEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.PENDING_APPEALS_REMINDER,
      new PendingAppealsReminderEmailStrategy(this.logger)
    );
    this.strategies.set(
      EmailType.CONTACT_SUPPORT,
      new ContactSupportEmailStrategy(this.logger)
    );
  }

  /**
   * Gets the appropriate email strategy for a given email type.
   * @param type - The type of email to send.
   * @returns The email strategy instance.
   * @throws Error if the email type is not supported.
   */
  getStrategy<T extends EmailData>(type: EmailType): EmailStrategy<T> {
    const strategy = this.strategies.get(type);

    if (!strategy) {
      this.logger.error({ type }, 'Unsupported email type requested');
      throw new Error(`Unsupported email type: ${type}`);
    }

    return strategy;
  }

  /**
   * Registers a new email strategy.
   * Useful for extending the factory with custom strategies.
   * @param type - The email type identifier.
   * @param strategy - The strategy instance.
   */
  registerStrategy<T extends EmailData>(
    type: EmailType,
    strategy: EmailStrategy<T>
  ): void {
    this.strategies.set(type, strategy);
    this.logger.info({ type }, 'New email strategy registered');
  }
}
