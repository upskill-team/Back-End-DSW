/**
 * @module Models/Payment/Controller
 * @remarks Handles HTTP requests for the Payment module.
 */
import { NextFunction, Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { PaymentService } from './payment.service.js';
import { HttpResponse } from '../../shared/response/http.response.js';

/**
 * @function createPreference
 * @description Handles the request to create a Mercado Pago payment preference.
 * It validates that the user has a student profile before proceeding.
 * @param {Request} req - The Express request object, containing courseId in the body and userId in req.user.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {Promise<Response>} A response containing the Mercado Pago preference ID and init_point URL.
 */
async function createPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!courseId || !userId) {
      return HttpResponse.BadRequest(res, 'courseId is required.');
    }

    const paymentService = new PaymentService(orm.em.fork(), req.log);
    const result = await paymentService.createPreference(courseId, userId);

    return HttpResponse.Ok(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @function receiveWebhook
 * @description Handles incoming webhook notifications from Mercado Pago.
 * It processes payment events to create enrollments accordingly.
 * @param {Request} req - The Express request object, containing the webhook payload from Mercado Pago.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} A 200 OK response to acknowledge receipt of the webhook.
 */
async function receiveWebhook(req: Request, res: Response) {
    try {
        const { body } = req;
        const paymentId = body.data?.id;
        const topic = body.type;

        req.log.info({ body }, 'Webhook received from Mercado Pago.');

        if (topic === 'payment' && paymentId) {
            const paymentService = new PaymentService(orm.em.fork(), req.log);
            await paymentService.handleWebhook(paymentId);
        }
        res.status(200).send('Webhook received');

    } catch (error) {
        req.log.error({ err: error }, 'Error processing webhook, but sending 200 OK response.');
        res.status(200).send('Webhook received with error.');
    }
}


export { createPreference, receiveWebhook };