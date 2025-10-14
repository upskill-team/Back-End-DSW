/**
 * @module Models/Payment/Service
 * @remarks Encapsulates the business logic for managing payments with Mercado Pago.
 */
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { ObjectId } from '@mikro-orm/mongodb';
import { Course } from '../course/course.entity.js';
import EnrollementService from '../Enrollement/enrollement.service.js';

interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
}

export class PaymentService {
  private readonly client: MercadoPagoConfig;

  constructor(
    private readonly em: EntityManager, 
    private readonly logger: Logger
  ) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      this.logger.fatal('MP_ACCESS_TOKEN is not defined in environment variables.');
      throw new Error('Mercado Pago Access Token is not configured.');
    }

    this.client = new MercadoPagoConfig({ 
        accessToken: accessToken 
    });
  }

  /**
   * Creates a Mercado Pago payment preference for a specific course and user.
   * @param {string} courseId - The ID of the course being purchased.
   * @param {string} userId - The ID of the user making the purchase.
   * @returns {Promise<PreferenceResponse>} An object containing the preference ID and the checkout URL (init_point).
   */
  async createPreference(courseId: string, userId: string): Promise<PreferenceResponse> {
    this.logger.info({ courseId, userId }, 'PaymentService.createPreference - start');
    
    try {
      const course = await this.em.findOne(Course, { _id: new ObjectId(courseId) });

      if (!course) {
        this.logger.warn({ courseId }, 'Course not found');
        throw new Error('Course not found');
      }

      if (course.isFree) {
        throw new Error('Cannot create preference for a free course');
      }

      const frontendUrl = process.env.NGROK_FRONTEND_URL?.trim();
      const backendWebhookUrl = process.env.LOCALTUNNEL_BACKEND_URL?.trim();

      if (!backendWebhookUrl) {
        this.logger.error('CRITICAL: LOCALTUNNEL_BACKEND_URL is not defined or is empty in .env file. Webhooks will fail.');
        throw new Error('Server configuration error: Webhook URL is missing.');
      }
      
      const successUrl = `${frontendUrl}/payment/success?course_id=${course.id}`;

      try {
        new URL(successUrl);
        new URL(backendWebhookUrl);
      } catch {
        this.logger.error({ frontendUrl, backendWebhookUrl, successUrl }, 'CRITICAL: One of the environment URLs (NGROK_FRONTEND_URL, LOCALTUNNEL_BACKEND_URL) is not a valid URL.');
        throw new Error('Server configuration error: Invalid URL format in environment variables.');
      }

      const preferenceData = {
        items: [
          {
            id: course.id!, 
            title: course.name,
            description: course.description,
            picture_url: course.imageUrl,
            category_id: 'education',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: course.price!,
          },
        ],
        payer: {},
        back_urls: {
          success: `${frontendUrl}/payment/success?course_id=${course.id}`,
          failure: `${frontendUrl}/payment/failure?course_id=${course.id}`,
          pending: `${frontendUrl}/payment/pending?course_id=${course.id}`,
        },
        auto_return: 'approved' as const,
        external_reference: JSON.stringify({
          userId: userId,
          courseId: courseId,
        }),
        notification_url: `${backendWebhookUrl}/api/payments/webhook`,
      };

      this.logger.info({ preferenceData }, 'Sending the following data to Mercado Pago...');

      const preference = new Preference(this.client);
      const result = await preference.create({ body: preferenceData });
      
      this.logger.info({ preferenceId: result.id }, 'Preference created successfully');
      
      return {
        preferenceId: result.id!,
        initPoint: result.init_point!,
      };
    } catch (err: any) {
      this.logger.error({ err: err.cause ?? err, courseId, userId }, 'PaymentService.createPreference - error');
      throw err;
    }
  }

  /**
   * Handles incoming webhook notifications from Mercado Pago.
   * If the payment is approved, it triggers the enrollment creation process.
   * @param {string} paymentId - The ID of the payment being notified.
   * @returns {Promise<void>}
   */
  async handleWebhook(paymentId: string) {
    this.logger.info({ paymentId }, 'PaymentService.handleWebhook - start');
    
    try {
      const paymentController = new Payment(this.client);
      const payment = await paymentController.get({ id: paymentId });
      
      this.logger.info({ paymentStatus: payment.status }, 'Payment status received');
      
      if (payment.status === 'approved' && payment.external_reference) {
        const { userId, courseId } = JSON.parse(payment.external_reference);

        if (!userId || !courseId) {
          this.logger.error({ ref: payment.external_reference }, 'Webhook error: external_reference is missing userId or courseId.');
          return;
        }

        const enrollmentService = new EnrollementService(this.em.fork(), this.logger);
        const existingEnrollment = await enrollmentService.findByStudentAndCourse(userId, courseId);

        if (!existingEnrollment) {
          await enrollmentService.create({ studentId: userId, courseId: courseId });
          this.logger.info({ userId, courseId }, 'Enrollment created successfully from webhook.');
        } else {
          this.logger.warn({ userId, courseId }, 'Webhook received for an already existing enrollment. Ignoring.');
        }
      }
    } catch (err: any) {
      this.logger.error({ err: err.cause ?? err, paymentId }, 'PaymentService.handleWebhook - error');
    }
  }
}