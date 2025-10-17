/**
 * @module Models/Payment/Service
 * @remarks Encapsulates the business logic for managing payments with Mercado Pago.
 */
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { ObjectId } from '@mikro-orm/mongodb';
import { Course } from '../course/course.entity.js';
import EnrollementService from '../Enrollement/enrollement.service.js';
import { Payment, PaymentStatus } from './payment.entity.js';
import { Earning, EarningType, EarningStatus } from './earning.entity.js';
import { Student } from '../student/student.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { User } from '../user/user.entity.js';
import { 
  toAmount, 
  calculateProfessorShare, 
  calculatePlatformFee 
} from '../../shared/utils/currency.js';

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
            unit_price: toAmount(course.priceInCents!),
          },
        ],
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
   * If the payment is approved, it triggers the enrollment creation process
   * and generates payment and earning records.
   * @param {string} paymentId - The ID of the payment being notified.
   * @returns {Promise<void>}
   */
  async handleWebhook(paymentId: string) {
    this.logger.info({ paymentId }, 'PaymentService.handleWebhook - start');
    
    try {
      const paymentController = new MPPayment(this.client);
      const mpPayment = await paymentController.get({ id: paymentId });
      
      this.logger.info({ paymentStatus: mpPayment.status }, 'Payment status received');
      
      if (mpPayment.status === 'approved' && mpPayment.external_reference) {
        const { userId, courseId } = JSON.parse(mpPayment.external_reference);

        if (!userId || !courseId) {
          this.logger.error({ ref: mpPayment.external_reference }, 'Webhook error: external_reference is missing userId or courseId.');
          return;
        }

        // Check if payment already exists to ensure idempotency
        const existingPayment = await this.em.findOne(Payment, { 
          mercadoPagoId: paymentId 
        });

        if (existingPayment) {
          this.logger.warn({ paymentId }, 'Payment already processed. Ignoring webhook.');
          return;
        }

        // Use a transaction to ensure atomicity
        await this.em.transactional(async (em) => {
          // Fetch required entities
          const course = await em.findOne(Course, { _id: new ObjectId(courseId) }, {
            populate: ['professor']
          });

          // Resolve student profile: external_reference may contain either
          // the User id (most common) or the Student profile id. Try User first.
          let student: Student | null = null;

          const maybeUser = await em.findOne(User, { _id: new ObjectId(userId) }, { populate: ['studentProfile'] });
          if (maybeUser && (maybeUser as any).studentProfile) {
            student = (maybeUser as any).studentProfile as Student;
          } else {
            // Fallback: maybe the provided id was already a Student id
            student = await em.findOne(Student, { _id: new ObjectId(userId) });
          }

          if (!course || !student) {
            this.logger.error({ courseId, userId }, 'Course or Student not found');
            throw new Error('Course or Student not found');
          }

          if (!course.priceInCents) {
            this.logger.error({ courseId }, 'Course price is not set');
            throw new Error('Course price is not set');
          }

          const totalAmountInCents = course.priceInCents;

          // Create Payment entity
          const payment = em.create(Payment, {
            mercadoPagoId: paymentId,
            amountInCents: totalAmountInCents,
            status: PaymentStatus.APPROVED,
            course: course,
            student: student,
            paidAt: new Date(),
            metadata: {
              status: mpPayment.status,
              status_detail: mpPayment.status_detail,
              payment_type_id: mpPayment.payment_type_id,
              payment_method_id: mpPayment.payment_method_id,
              transaction_amount: mpPayment.transaction_amount,
              date_approved: mpPayment.date_approved,
            },
          });

          await em.persistAndFlush(payment);

          // Calculate earnings
          const professorShareCents = calculateProfessorShare(totalAmountInCents);
          const platformFeeCents = calculatePlatformFee(totalAmountInCents);

          this.logger.info(
            { 
              totalAmountInCents, 
              professorShareCents, 
              platformFeeCents,
              sum: professorShareCents + platformFeeCents 
            }, 
            'Earnings calculation'
          );

          // Create Professor Earning
          const professorEarning = em.create(Earning, {
            type: EarningType.PROFESSOR_SHARE,
            amountInCents: professorShareCents,
            payment: payment,
            professor: course.professor as Professor,
            status: EarningStatus.PENDING,
            createdAt: new Date(),
          });

          // Create Platform Earning
          const platformEarning = em.create(Earning, {
            type: EarningType.PLATFORM_FEE,
            amountInCents: platformFeeCents,
            payment: payment,
            status: EarningStatus.PENDING,
            createdAt: new Date(),
          });

          await em.persistAndFlush([professorEarning, platformEarning]);

          // Create or verify enrollment directly in this transaction to avoid
          // nested transactions and race conditions between webhook and frontend.
          // Try to find existing enrollment (accepts user id or student id)
          const enrollmentService = new EnrollementService(em, this.logger);
          const existingEnrollment = await enrollmentService.findByStudentAndCourse(userId, courseId);

          if (!existingEnrollment) {
            // Resolve student profile (user -> student) was already done above and stored in `student`.
            // Create enrollement entity directly using the transaction-scoped EntityManager `em`.
            const EnrollementClass = (await import('../Enrollement/enrollement.entity.js')).Enrollement;
            const enrol = em.create(EnrollementClass, {
              student: student,
              course: course,
              enrolledAt: new Date(),
              state: (await import('../Enrollement/enrollement.entity.js')).EnrollmentState.ENROLLED,
              completedUnits: [],
            });

            await em.persistAndFlush(enrol);

            // Ensure student's courses collection is updated
            try {
              (student as any).courses.add(course);
              await em.persistAndFlush(student);
            } catch {
              // ignore if student.courses isn't a collection in this context
            }

            // Link enrollment to payment
            payment.enrollement = enrol;
            await em.persistAndFlush(payment);

            this.logger.info({ userId, courseId, paymentId }, 'Payment, Earnings, and Enrollment created successfully from webhook.');
          } else {
            this.logger.warn({ userId, courseId }, 'Webhook received for an already existing enrollment. Payment and Earnings created.');
          }
        });
      }
    } catch (err: any) {
      this.logger.error({ err: err.cause ?? err, paymentId }, 'PaymentService.handleWebhook - error');
      throw err;
    }
  }
}