/**
 * @module Emails/Services
 * @description Main email notification service that orchestrates email sending.
 * Implements Facade Pattern to provide a simple interface to the complex email system.
 */

import { Logger } from 'pino';
import { EmailStrategyFactory } from './email-factory.js';
import {
  EmailType,
  EmailData,
  EmailResult,
  ResetPasswordEmailData,
  AppealStatusEmailData,
  CoursePurchaseEmailData,
  CourseEnrollmentEmailData,
  NewAssessmentEmailData,
  ContactSupportEmailData,
} from '../types/email-types.js';

/**
 * Main service for sending email notifications.
 * Provides a unified interface for sending different types of emails.
 */
export class EmailNotificationService {
  private factory: EmailStrategyFactory;

  constructor(private logger: Logger) {
    this.factory = new EmailStrategyFactory(logger);
  }

  /**
   * Generic method to send any type of email.
   * @param type - The type of email to send.
   * @param data - The email data.
   * @returns Result of the email sending operation.
   */
  async sendEmail<T extends EmailData>(
    type: EmailType,
    data: T
  ): Promise<EmailResult> {
    try {
      const strategy = this.factory.getStrategy<T>(type);
      return await strategy.send(data);
    } catch (error: any) {
      this.logger.error(
        { err: error, type },
        'Failed to send email through notification service'
      );
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Sends a password reset email.
   */
  async sendPasswordResetEmail(
    data: ResetPasswordEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.RESET_PASSWORD, data);
  }

  /**
   * Sends an appeal accepted notification email.
   */
  async sendAppealAcceptedEmail(
    data: AppealStatusEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.APPEAL_ACCEPTED, data);
  }

  /**
   * Sends an appeal rejected notification email.
   */
  async sendAppealRejectedEmail(
    data: AppealStatusEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.APPEAL_REJECTED, data);
  }

  /**
   * Sends a course purchase confirmation email.
   */
  async sendCoursePurchaseEmail(
    data: CoursePurchaseEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.COURSE_PURCHASE, data);
  }

  /**
   * Sends a free course enrollment confirmation email.
   */
  async sendCourseEnrollmentEmail(
    data: CourseEnrollmentEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.COURSE_ENROLLMENT, data);
  }

  /**
   * Sends a new assessment notification email.
   */
  async sendNewAssessmentEmail(
    data: NewAssessmentEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.NEW_ASSESSMENT, data);
  }

  /**
   * Sends a contact support notification email (to support team).
   */
  async sendContactSupportEmail(
    data: ContactSupportEmailData
  ): Promise<EmailResult> {
    return this.sendEmail(EmailType.CONTACT_SUPPORT, data);
  }

  /**
   * Sends multiple emails of the same type to different recipients.
   * Useful for broadcasting notifications.
   * @param type - The type of email to send.
   * @param dataList - Array of email data for each recipient.
   * @returns Array of results for each email sent.
   */
  async sendBulkEmails<T extends EmailData>(
    type: EmailType,
    dataList: T[]
  ): Promise<EmailResult[]> {
    this.logger.info({ type, count: dataList.length }, 'Sending bulk emails');

    const results = await Promise.allSettled(
      dataList.map((data) => this.sendEmail(type, data))
    );

    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { success: false, error: result.reason }
    );
  }
}
