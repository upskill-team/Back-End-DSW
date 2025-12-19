/**
 * @module Models/Contact/Controller
 * @remarks HTTP handlers for contact form endpoints.
 */

import type { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { ContactService, ContactFormData } from './contact.service.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Submit a contact/support message.
 * POST /api/contact
 */
export async function submitContactForm(req: Request, res: Response) {
  try {
    const data: ContactFormData = req.body;

    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return HttpResponse.BadRequest(
        res,
        'Todos los campos son requeridos: name, email, subject, message'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return HttpResponse.BadRequest(res, 'Formato de email inválido');
    }

    // Validate message length
    if (data.message.length < 10) {
      return HttpResponse.BadRequest(
        res,
        'El mensaje debe tener al menos 10 caracteres'
      );
    }

    if (data.message.length > 5000) {
      return HttpResponse.BadRequest(
        res,
        'El mensaje no puede exceder 5000 caracteres'
      );
    }

    const contactService = new ContactService(orm.em.fork(), logger);
    const result = await contactService.submitContactMessage(data);

    if (!result.success) {
      return HttpResponse.InternalServerError(res, result.message);
    }

    return HttpResponse.Created(res, {
      message: result.message,
      ticketId: result.ticketId,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error in submitContactForm controller');
    return HttpResponse.InternalServerError(
      res,
      'Error al procesar la solicitud de contacto'
    );
  }
}
