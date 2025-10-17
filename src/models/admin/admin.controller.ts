/**
 * @module Models/Admin/Controller
 * @remarks HTTP handlers for admin endpoints.
 */

import type { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { AdminService } from './admin.service.js';
import { HttpResponse } from '../../shared/response/http.response.js';

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
