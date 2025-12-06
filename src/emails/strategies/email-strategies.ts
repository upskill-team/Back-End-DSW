/**
 * @module Emails/Strategies
 * @description Strategy Pattern implementation for email sending.
 * Each strategy knows how to render and send a specific type of email.
 */

import { render } from '@react-email/render';
import { Logger } from 'pino';
import {
  EmailType,
  EmailData,
  EmailOptions,
  EmailResult,
  ResetPasswordEmailData,
  AppealStatusEmailData,
  CoursePurchaseEmailData,
  CourseEnrollmentEmailData,
  NewAssessmentEmailData,
  PendingAppealsReminderEmailData,
  ContactSupportEmailData,
} from '../types/email-types.js';
import { sendEmail } from '../../shared/services/email.service.js';

/**
 * Abstract base class defining the email strategy interface.
 * Template Method Pattern: Defines the skeleton of the email sending algorithm.
 */
export abstract class EmailStrategy<T extends EmailData> {
  constructor(protected logger: Logger) {}

  /**
   * Template method that orchestrates the email sending process.
   */
  async send(data: T): Promise<EmailResult> {
    try {
      this.logger.info(
        { type: this.getType(), recipient: data.recipientEmail },
        'Preparing to send email'
      );

      // Validate data
      this.validate(data);

      // Build email options
      const options = await this.buildEmailOptions(data);

      // Send email
      await sendEmail(options);

      this.logger.info(
        { type: this.getType(), recipient: data.recipientEmail },
        'Email sent successfully'
      );

      return {
        success: true,
      };
    } catch (error: any) {
      this.logger.error(
        {
          err: error,
          type: this.getType(),
          recipient: data.recipientEmail,
        },
        'Failed to send email'
      );

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets the email type identifier.
   */
  abstract getType(): EmailType;

  /**
   * Gets the email subject line.
   */
  abstract getSubject(data: T): string;

  /**
   * Renders the email HTML content.
   */
  abstract renderHtml(data: T): Promise<string>;

  /**
   * Validates the email data.
   */
  protected validate(data: T): void {
    if (!data.recipientEmail) {
      throw new Error('Recipient email is required');
    }
  }

  /**
   * Builds the email options from data.
   */
  private async buildEmailOptions(data: T): Promise<EmailOptions> {
    const html = await this.renderHtml(data);
    const subject = this.getSubject(data);

    return {
      to: data.recipientEmail,
      subject,
      html,
    };
  }
}

/**
 * Strategy for reset password emails.
 */
export class ResetPasswordEmailStrategy extends EmailStrategy<ResetPasswordEmailData> {
  getType(): EmailType {
    return EmailType.RESET_PASSWORD;
  }

  getSubject(): string {
    return 'Restablecimiento de Contraseña - UpSkill';
  }

  async renderHtml(data: ResetPasswordEmailData): Promise<string> {
    const { ResetPasswordEmail } = await import('../templates/ResetPasswordEmail.js');
    return render(
      ResetPasswordEmail({
        name: data.recipientName,
        resetUrl: data.resetUrl,
      })
    );
  }

  protected validate(data: ResetPasswordEmailData): void {
    super.validate(data);
    if (!data.resetUrl) {
      throw new Error('Reset URL is required');
    }
  }
}

/**
 * Strategy for appeal accepted emails.
 */
export class AppealAcceptedEmailStrategy extends EmailStrategy<AppealStatusEmailData> {
  getType(): EmailType {
    return EmailType.APPEAL_ACCEPTED;
  }

  getSubject(): string {
    return '¡Felicitaciones! Tu solicitud ha sido aceptada - UpSkill';
  }

  async renderHtml(data: AppealStatusEmailData): Promise<string> {
    const { AppealAcceptedEmail } = await import(
      '../templates/AppealAcceptedEmail.js'
    );
    return render(
      AppealAcceptedEmail({
        name: data.recipientName,
        message: data.message,
      })
    );
  }
}

/**
 * Strategy for appeal rejected emails.
 */
export class AppealRejectedEmailStrategy extends EmailStrategy<AppealStatusEmailData> {
  getType(): EmailType {
    return EmailType.APPEAL_REJECTED;
  }

  getSubject(): string {
    return 'Actualización sobre tu solicitud - UpSkill';
  }

  async renderHtml(data: AppealStatusEmailData): Promise<string> {
    const { AppealRejectedEmail } = await import(
      '../templates/AppealRejectedEmail.js'
    );
    return render(
      AppealRejectedEmail({
        name: data.recipientName,
        message: data.message,
      })
    );
  }
}

/**
 * Strategy for course purchase confirmation emails.
 */
export class CoursePurchaseEmailStrategy extends EmailStrategy<CoursePurchaseEmailData> {
  getType(): EmailType {
    return EmailType.COURSE_PURCHASE;
  }

  getSubject(data: CoursePurchaseEmailData): string {
    return `Confirmación de compra: ${data.courseName} - UpSkill`;
  }

  async renderHtml(data: CoursePurchaseEmailData): Promise<string> {
    const CoursePurchaseEmailModule = await import(
      '../templates/CoursePurchaseEmail.js'
    );
    const CoursePurchaseEmail = CoursePurchaseEmailModule.default || CoursePurchaseEmailModule.CoursePurchaseEmail;
    return render(
      CoursePurchaseEmail({
        name: data.recipientName,
        courseName: data.courseName,
        courseImageUrl: data.courseImageUrl,
        amount: data.amount,
        transactionId: data.transactionId,
        purchaseDate: data.purchaseDate,
        courseUrl: data.courseUrl,
      })
    );
  }

  protected validate(data: CoursePurchaseEmailData): void {
    super.validate(data);
    if (!data.courseName || !data.amount || !data.transactionId) {
      throw new Error('Course name, amount, and transaction ID are required');
    }
  }
}

/**
 * Strategy for free course enrollment emails.
 */
export class CourseEnrollmentEmailStrategy extends EmailStrategy<CourseEnrollmentEmailData> {
  getType(): EmailType {
    return EmailType.COURSE_ENROLLMENT;
  }

  getSubject(data: CourseEnrollmentEmailData): string {
    return `¡Bienvenido al curso: ${data.courseName}! - UpSkill`;
  }

  async renderHtml(data: CourseEnrollmentEmailData): Promise<string> {
    const CourseEnrollmentEmailModule = await import(
      '../templates/CourseEnrollmentEmail.js'
    );
    const CourseEnrollmentEmail = CourseEnrollmentEmailModule.default || CourseEnrollmentEmailModule.CourseEnrollmentEmail;
    return render(
      CourseEnrollmentEmail({
        name: data.recipientName,
        courseName: data.courseName,
        courseImageUrl: data.courseImageUrl,
        courseUrl: data.courseUrl,
        enrollmentDate: data.enrollmentDate,
        professorName: data.professorName,
      })
    );
  }

  protected validate(data: CourseEnrollmentEmailData): void {
    super.validate(data);
    if (!data.courseName || !data.courseUrl) {
      throw new Error('Course name and URL are required');
    }
  }
}

/**
 * Strategy for new assessment notification emails.
 */
export class NewAssessmentEmailStrategy extends EmailStrategy<NewAssessmentEmailData> {
  getType(): EmailType {
    return EmailType.NEW_ASSESSMENT;
  }

  getSubject(data: NewAssessmentEmailData): string {
    return `Nueva evaluación disponible: ${data.assessmentTitle} - UpSkill`;
  }

  async renderHtml(data: NewAssessmentEmailData): Promise<string> {
    const NewAssessmentEmailModule = await import(
      '../templates/NewAssessmentEmail.js'
    );
    const NewAssessmentEmail = NewAssessmentEmailModule.default || NewAssessmentEmailModule.NewAssessmentEmail;
    return render(
      NewAssessmentEmail({
        name: data.recipientName,
        courseName: data.courseName,
        assessmentTitle: data.assessmentTitle,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        assessmentUrl: data.assessmentUrl,
      })
    );
  }

  protected validate(data: NewAssessmentEmailData): void {
    super.validate(data);
    if (!data.courseName || !data.assessmentTitle || !data.assessmentUrl) {
      throw new Error('Course name, assessment title, and URL are required');
    }
  }
}

/**
 * Strategy for pending appeals reminder emails (to admins).
 */
export class PendingAppealsReminderEmailStrategy extends EmailStrategy<PendingAppealsReminderEmailData> {
  getType(): EmailType {
    return EmailType.PENDING_APPEALS_REMINDER;
  }

  getSubject(data: PendingAppealsReminderEmailData): string {
    return `Recordatorio: ${data.pendingCount} solicitudes pendientes - UpSkill`;
  }

  async renderHtml(data: PendingAppealsReminderEmailData): Promise<string> {
    const PendingAppealsReminderEmailModule = await import(
      '../templates/PendingAppealsReminderEmail.js'
    );
    const PendingAppealsReminderEmail = PendingAppealsReminderEmailModule.default || PendingAppealsReminderEmailModule.PendingAppealsReminderEmail;
    return render(
      PendingAppealsReminderEmail({
        name: data.recipientName,
        pendingCount: data.pendingCount,
        appealsUrl: data.appealsUrl,
        oldestAppealDate: data.oldestAppealDate,
      })
    );
  }

  protected validate(data: PendingAppealsReminderEmailData): void {
    super.validate(data);
    if (!data.pendingCount || !data.appealsUrl) {
      throw new Error('Pending count and appeals URL are required');
    }
  }
}

/**
 * Strategy for contact support notification emails (internal).
 */
export class ContactSupportEmailStrategy extends EmailStrategy<ContactSupportEmailData> {
  getType(): EmailType {
    return EmailType.CONTACT_SUPPORT;
  }

  getSubject(data: ContactSupportEmailData): string {
    return `[Soporte] ${data.subject}${data.ticketId ? ` - Ticket #${data.ticketId}` : ''}`;
  }

  async renderHtml(data: ContactSupportEmailData): Promise<string> {
    const ContactSupportEmailModule = await import(
      '../templates/ContactSupportEmail.js'
    );
    const ContactSupportEmail = ContactSupportEmailModule.default || ContactSupportEmailModule.ContactSupportEmail;
    return render(
      ContactSupportEmail({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        submittedAt: data.submittedAt,
        ticketId: data.ticketId,
      })
    );
  }

  protected validate(data: ContactSupportEmailData): void {
    if (!data.recipientEmail || !data.name || !data.email || !data.subject || !data.message) {
      throw new Error('All contact support fields are required');
    }
  }
}
