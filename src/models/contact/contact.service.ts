/**
 * @module Models/Contact/Service
 * @remarks Service for handling contact/support messages.
 */

import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { EmailNotificationService } from '../../emails/services/email-notification.service.js';
import { randomUUID } from 'crypto';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  ticketId?: string;
  message: string;
}

/**
 * Service for handling contact form submissions and support tickets.
 */
export class ContactService {
  private emailService: EmailNotificationService;

  constructor(
    private em: EntityManager,
    private logger: Logger
  ) {
    this.emailService = new EmailNotificationService(logger);
  }

  /**
   * Process a contact form submission and send notification to support team.
   */
  async submitContactMessage(data: ContactFormData): Promise<ContactResponse> {
    try {
      // Generate a unique ticket ID
      const ticketId = this.generateTicketId();
      const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

      if (!supportEmail) {
        throw new Error('Support email is not configured');
      }

      this.logger.info(
        { ticketId, from: data.email },
        'Processing contact form submission'
      );

      // Send email to support team
      const result = await this.emailService.sendContactSupportEmail({
        recipientEmail: supportEmail,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        submittedAt: new Date(),
        ticketId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send support notification');
      }

      this.logger.info(
        { ticketId, from: data.email },
        'Contact form submitted successfully'
      );

      return {
        success: true,
        ticketId,
        message: 'Tu mensaje ha sido enviado exitosamente. Te responderemos pronto.',
      };
    } catch (error: any) {
      this.logger.error(
        { err: error, email: data.email },
        'Error processing contact form submission'
      );

      return {
        success: false,
        message: 'Error al enviar el mensaje. Por favor intenta nuevamente.',
      };
    }
  }

  /**
   * Generate a unique ticket ID for tracking purposes.
   */
  private generateTicketId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomUUID().split('-')[0].toUpperCase();
    return `${timestamp}-${random}`;
  }
}
