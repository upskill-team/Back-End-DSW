/**
 * @module Shared/Services
 * @description Scheduled tasks service for sending periodic notifications.
 * This service handles scheduled email notifications like daily reminders.
 */

import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { Appeal } from '../../models/appeal/appeal.entity.js';
import { User, UserRole } from '../../models/user/user.entity.js';
import { EmailNotificationService } from '../../emails/services/email-notification.service.js';

/**
 * Service for managing scheduled notification tasks.
 * Uses cron-like patterns to send periodic emails.
 */
export class ScheduledNotificationService {
  private emailService: EmailNotificationService;

  constructor(
    private em: EntityManager,
    private logger: Logger
  ) {
    this.emailService = new EmailNotificationService(logger);
  }

  /**
   * Sends a daily reminder to admins about pending appeals.
   * Should be called once per day (e.g., at the end of the business day).
   * @returns {Promise<void>}
   */
  async sendDailyPendingAppealsReminder(): Promise<void> {
    this.logger.info('Starting daily pending appeals reminder task');

    try {
      // Find all pending appeals
      const pendingAppeals = await this.em.find(
        Appeal,
        { state: 'pending' },
        { orderBy: { date: 'ASC' } }
      );

      if (pendingAppeals.length === 0) {
        this.logger.info('No pending appeals to notify about');
        return;
      }

      // Find all admin users
      const adminUsers = await this.em.find(User, { role: UserRole.ADMIN });

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to send pending appeals reminder');
        return;
      }

      const oldestAppeal = pendingAppeals[0];
      const frontendUrl = process.env.NGROK_FRONTEND_URL || 'http://localhost:5173';

      // Send reminder to all admins
      const emailPromises = adminUsers.map((admin) =>
        this.emailService.sendPendingAppealsReminderEmail({
          recipientEmail: admin.mail,
          recipientName: admin.name,
          pendingCount: pendingAppeals.length,
          appealsUrl: `${frontendUrl}/admin/appeals`,
          oldestAppealDate: oldestAppeal.date,
        })
      );

      const results = await Promise.allSettled(emailPromises);

      const failedEmails = results.filter((r) => r.status === 'rejected').length;
      const successfulEmails = results.filter((r) => r.status === 'fulfilled').length;

      this.logger.info(
        {
          pendingAppeals: pendingAppeals.length,
          adminsNotified: adminUsers.length,
          successful: successfulEmails,
          failed: failedEmails,
        },
        'Daily pending appeals reminder task completed'
      );
    } catch (error: any) {
      this.logger.error(
        { err: error },
        'Error in daily pending appeals reminder task'
      );
      throw error;
    }
  }

  /**
   * Sets up a daily reminder to be executed at a specific time.
   * This is a helper method that can be called during application startup.
   * Note: For production, consider using a proper job scheduler like node-cron or Bull.
   * 
   * @param {string} time - Time in HH:MM format (24-hour), e.g., "18:00" for 6 PM
   */
  scheduleDailyReminder(time: string = '18:00'): void {
    const [hours, minutes] = time.split(':').map(Number);

    const scheduleNextReminder = () => {
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );

      // If the scheduled time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const msUntilScheduled = scheduledTime.getTime() - now.getTime();

      this.logger.info(
        { scheduledTime: scheduledTime.toISOString() },
        'Next pending appeals reminder scheduled'
      );

      setTimeout(async () => {
        try {
          await this.sendDailyPendingAppealsReminder();
        } catch (error) {
          this.logger.error({ err: error }, 'Failed to send daily reminder');
        }

        // Schedule the next reminder
        scheduleNextReminder();
      }, msUntilScheduled);
    };

    scheduleNextReminder();
  }
}
