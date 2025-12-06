/**
 * @module Models/Admin/Controller
 * @remarks HTTP handlers for admin endpoints.
 */

import type { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { AdminService } from './admin.service.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { ScheduledNotificationService } from '../../shared/services/scheduled-notification.service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Get platform analytics.
 * GET /api/admin/analytics?months=6
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const months = parseInt(req.query.months as string) || 6;
    
    if (months < 1 || months > 24) {
      return HttpResponse.BadRequest(res, 'Months must be between 1 and 24');
    }

    const adminService = new AdminService(orm.em.fork());
    const analytics = await adminService.getAnalytics(months);
    
    return HttpResponse.Ok(res, analytics);
  } catch {
    return HttpResponse.InternalServerError(res, 'Error fetching analytics');
  }
}

/**
 * Manually trigger the daily pending appeals reminder email (development only).
 * POST /api/admin/test-reminder
 */
export async function testPendingAppealsReminder(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const scheduledService = new ScheduledNotificationService(em, logger);
    
    await scheduledService.sendDailyPendingAppealsReminder();
    
    return HttpResponse.Ok(res, { 
      success: true, 
      message: 'Pending appeals reminder sent successfully. Check logs for details.' 
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to send test reminder');
    return HttpResponse.InternalServerError(res, 'Failed to send reminder: ' + error.message);
  }
}
