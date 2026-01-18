import 'reflect-metadata';
import { PaymentService } from './payment.service.js';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import { ObjectId } from '@mikro-orm/mongodb';
import { Course } from '../course/course.entity.js';
import { Payment, PaymentStatus } from './payment.entity.js';
import { Student } from '../student/student.entity.js';
import { User } from '../user/user.entity.js';
import { MercadoPagoClient } from '../../shared/services/mercadopago.client.js';
import { Professor } from '../professor/professor.entity.js';
import { Earning, EarningType } from './earning.entity.js';

// Mock the MercadoPagoClient
jest.mock('../../shared/services/mercadopago.client.js');

// Mock EmailNotificationService
jest.mock('../../emails/services/email-notification.service.js', () => ({
  EmailNotificationService: jest.fn().mockImplementation(() => ({
    sendCoursePurchaseEmail: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock EnrollementService
jest.mock('../Enrollement/enrollement.service.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    findByStudentAndCourse: jest.fn().mockResolvedValue(null),
  })),
}));

describe('PaymentService - Unit Tests', () => {
  let paymentService: PaymentService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockMpClient: jest.Mocked<MercadoPagoClient>;

  const validCourseId = '507f1f77bcf86cd799439011';
  const validUserId = '507f1f77bcf86cd799439012';
  const validPaymentId = '123456789';

  beforeEach(() => {
    // Setup EntityManager mock
    mockEm = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((entity, data) => data),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
      transactional: jest.fn().mockImplementation((cb) => cb(mockEm)),
    } as unknown as jest.Mocked<EntityManager>;

    // Setup Logger mock
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    // Setup environment variable
    process.env.MP_ACCESS_TOKEN = 'TEST-ACCESS-TOKEN';
    process.env.NGROK_FRONTEND_URL = 'http://localhost:5173';
    process.env.LOCALTUNNEL_BACKEND_URL = 'http://localhost:3000';

    // Create service instance
    paymentService = new PaymentService(mockEm, mockLogger);

    // Get the mocked MercadoPagoClient instance
    mockMpClient = (paymentService as any).mpClient as jest.Mocked<MercadoPagoClient>;

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
    delete process.env.NGROK_FRONTEND_URL;
    delete process.env.LOCALTUNNEL_BACKEND_URL;
  });

  describe('constructor', () => {
    it('should throw error if MP_ACCESS_TOKEN is not defined', () => {
      // Arrange
      delete process.env.MP_ACCESS_TOKEN;

      // Act & Assert
      expect(() => new PaymentService(mockEm, mockLogger)).toThrow(
        'Mercado Pago Access Token is not configured.'
      );
      expect(mockLogger.fatal).toHaveBeenCalledWith(
        'MP_ACCESS_TOKEN is not defined in environment variables.'
      );
    });

    it('should create service with valid access token', () => {
      // Arrange
      process.env.MP_ACCESS_TOKEN = 'TEST-TOKEN';

      // Act
      const service = new PaymentService(mockEm, mockLogger);

      // Assert
      expect(service).toBeInstanceOf(PaymentService);
    });
  });

  describe('createPreference', () => {
    it('should successfully create a payment preference', async () => {
      // Arrange
      const mockCourse = {
        _id: new ObjectId(validCourseId),
        id: validCourseId,
        name: 'Test Course',
        description: 'A test course',
        imageUrl: 'http://example.com/image.jpg',
        priceInCents: 100000,
        isFree: false,
      } as unknown as Course;

      mockEm.findOne.mockResolvedValue(mockCourse);

      const mockPreferenceResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockMpClient.createPreference = jest.fn().mockResolvedValue(mockPreferenceResponse);

      // Act
      const result = await paymentService.createPreference(validCourseId, validUserId);

      // Assert
      expect(result).toEqual({
        preferenceId: 'pref-123456',
        initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123456',
      });
      expect(mockEm.findOne).toHaveBeenCalledWith(Course, { _id: new ObjectId(validCourseId) });
      expect(mockMpClient.createPreference).toHaveBeenCalled();
    });

    it('should throw error if course is not found', async () => {
      // Arrange
      mockEm.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        paymentService.createPreference(validCourseId, validUserId)
      ).rejects.toThrow('Course not found');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { courseId: validCourseId },
        'Course not found'
      );
    });

    it('should throw error if course is free', async () => {
      // Arrange
      const mockFreeCourse = {
        _id: new ObjectId(validCourseId),
        id: validCourseId,
        name: 'Free Course',
        isFree: true,
      } as unknown as Course;

      mockEm.findOne.mockResolvedValue(mockFreeCourse);

      // Act & Assert
      await expect(
        paymentService.createPreference(validCourseId, validUserId)
      ).rejects.toThrow('Cannot create preference for a free course');
    });

    it('should throw error if LOCALTUNNEL_BACKEND_URL is not defined', async () => {
      // Arrange
      delete process.env.LOCALTUNNEL_BACKEND_URL;

      const mockCourse = {
        _id: new ObjectId(validCourseId),
        id: validCourseId,
        name: 'Test Course',
        isFree: false,
        priceInCents: 100000,
      } as unknown as Course;

      mockEm.findOne.mockResolvedValue(mockCourse);

      // Act & Assert
      await expect(
        paymentService.createPreference(validCourseId, validUserId)
      ).rejects.toThrow('Server configuration error: Webhook URL is missing.');
    });

    it('should include all required preference data', async () => {
      // Arrange
      const mockCourse = {
        _id: new ObjectId(validCourseId),
        id: validCourseId,
        name: 'Test Course',
        description: 'A test course description',
        imageUrl: 'http://example.com/course.jpg',
        priceInCents: 150000,
        isFree: false,
      } as unknown as Course;

      mockEm.findOne.mockResolvedValue(mockCourse);

      const mockPreferenceResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockMpClient.createPreference = jest.fn().mockResolvedValue(mockPreferenceResponse);

      // Act
      await paymentService.createPreference(validCourseId, validUserId);

      // Assert
      expect(mockMpClient.createPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: validCourseId,
              title: 'Test Course',
              description: 'A test course description',
              unit_price: 1500,
              currency_id: 'ARS',
            }),
          ]),
          back_urls: expect.objectContaining({
            success: expect.stringContaining('/payment/success'),
            failure: expect.stringContaining('/payment/failure'),
            pending: expect.stringContaining('/payment/pending'),
          }),
          external_reference: JSON.stringify({
            userId: validUserId,
            courseId: validCourseId,
          }),
        })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should process approved payment and create payment record', async () => {
      // Arrange
      const mockPaymentData = {
        id: 123456789,
        status: 'approved' as const,
        status_detail: 'accredited',
        external_reference: JSON.stringify({
          userId: validUserId,
          courseId: validCourseId,
        }),
        payment_type_id: 'credit_card',
        payment_method_id: 'visa',
        transaction_amount: 1500,
        date_approved: '2026-01-18T10:00:00.000Z',
      };

      const mockCourse = {
        _id: new ObjectId(validCourseId),
        id: validCourseId,
        name: 'Test Course',
        priceInCents: 150000,
        professor: {
          _id: new ObjectId(),
          name: 'Professor Test',
        } as unknown as Professor,
      } as unknown as Course;

      const mockStudent = {
        _id: new ObjectId(validUserId),
        id: validUserId,
        name: 'Student Test',
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockUser = {
        _id: new ObjectId(validUserId),
        mail: 'test@example.com',
        name: 'Test User',
        studentProfile: mockStudent,
      } as unknown as User;

      mockMpClient.getPayment = jest.fn().mockResolvedValue(mockPaymentData);
      mockEm.findOne
        .mockResolvedValueOnce(null) // existingPayment
        .mockResolvedValueOnce(mockCourse) // course
        .mockResolvedValueOnce(mockUser) // user with student profile
        .mockResolvedValueOnce(mockUser); // user for email

      // Act
      await paymentService.handleWebhook(validPaymentId);

      // Assert
      expect(mockMpClient.getPayment).toHaveBeenCalledWith(validPaymentId);
      expect(mockEm.create).toHaveBeenCalledWith(
        Payment,
        expect.objectContaining({
          mercadoPagoId: '123456789',
          amountInCents: 150000,
          status: PaymentStatus.APPROVED,
        })
      );
    });

    it('should ignore webhook if payment already exists', async () => {
      // Arrange
      const mockPaymentData = {
        id: 123456789,
        status: 'approved' as const,
        external_reference: JSON.stringify({
          userId: validUserId,
          courseId: validCourseId,
        }),
      };

      const existingPayment = {
        _id: new ObjectId(),
        mercadoPagoId: validPaymentId,
      } as Payment;

      mockMpClient.getPayment = jest.fn().mockResolvedValue(mockPaymentData);
      mockEm.findOne.mockResolvedValue(existingPayment);

      // Act
      await paymentService.handleWebhook(validPaymentId);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { paymentId: validPaymentId },
        'Payment already processed. Ignoring webhook.'
      );
      expect(mockEm.transactional).not.toHaveBeenCalled();
    });

    it('should ignore webhook if payment status is not approved', async () => {
      // Arrange
      const mockPaymentData = {
        id: 123456789,
        status: 'pending' as const,
        external_reference: JSON.stringify({
          userId: validUserId,
          courseId: validCourseId,
        }),
      };

      mockMpClient.getPayment = jest.fn().mockResolvedValue(mockPaymentData);

      // Act
      await paymentService.handleWebhook(validPaymentId);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        { paymentStatus: 'pending' },
        'Payment status received'
      );
      expect(mockEm.findOne).not.toHaveBeenCalled();
    });

    it('should handle missing external_reference', async () => {
      // Arrange
      const mockPaymentData = {
        id: 123456789,
        status: 'approved' as const,
        external_reference: undefined,
      };

      mockMpClient.getPayment = jest.fn().mockResolvedValue(mockPaymentData);

      // Act
      await paymentService.handleWebhook(validPaymentId);

      // Assert
      expect(mockEm.findOne).not.toHaveBeenCalled();
    });

    it('should handle invalid external_reference JSON', async () => {
      // Arrange
      const mockPaymentData = {
        id: 123456789,
        status: 'approved' as const,
        external_reference: JSON.stringify({
          userId: '',
          courseId: validCourseId,
        }),
      };

      mockMpClient.getPayment = jest.fn().mockResolvedValue(mockPaymentData);
      mockEm.findOne.mockResolvedValue(null);

      // Act
      await paymentService.handleWebhook(validPaymentId);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        { ref: mockPaymentData.external_reference },
        'Webhook error: external_reference is missing userId or courseId.'
      );
    });

    it('should create earnings for professor and platform', async () => {
      // Arrange
      const mockPaymentData = {
        id: 123456789,
        status: 'approved' as const,
        external_reference: JSON.stringify({
          userId: validUserId,
          courseId: validCourseId,
        }),
      };

      const mockProfessor = {
        _id: new ObjectId(),
        name: 'Professor Test',
      } as unknown as Professor;

      const mockCourse = {
        _id: new ObjectId(validCourseId),
        id: validCourseId,
        name: 'Test Course',
        priceInCents: 100000,
        professor: mockProfessor,
      } as unknown as Course;

      const mockStudent = {
        _id: new ObjectId(validUserId),
        id: validUserId,
        courses: { add: jest.fn() },
      } as unknown as Student;

      const mockUser = {
        _id: new ObjectId(validUserId),
        mail: 'test@example.com',
        name: 'Test User',
        studentProfile: mockStudent,
      } as unknown as User;

      mockMpClient.getPayment = jest.fn().mockResolvedValue(mockPaymentData);
      mockEm.findOne
        .mockResolvedValueOnce(null) // existingPayment
        .mockResolvedValueOnce(mockCourse) // course
        .mockResolvedValueOnce(mockUser) // user with student profile
        .mockResolvedValueOnce(mockUser); // user for email

      // Act
      await paymentService.handleWebhook(validPaymentId);

      // Assert
      const persistCalls = mockEm.persistAndFlush.mock.calls;
      const earningCalls = persistCalls.find(
        (call) => Array.isArray(call[0]) && call[0].some((item: any) => item.type)
      );

      expect(earningCalls).toBeDefined();
      if (earningCalls) {
        const earnings = earningCalls[0] as Earning[];
        expect(earnings).toHaveLength(2);
        expect(earnings.some((e: Earning) => e.type === EarningType.PROFESSOR_SHARE)).toBe(true);
        expect(earnings.some((e: Earning) => e.type === EarningType.PLATFORM_FEE)).toBe(true);
      }
    });

    it('should handle errors during webhook processing', async () => {
      // Arrange
      const error = new Error('Database error');
      mockMpClient.getPayment = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(paymentService.handleWebhook(validPaymentId)).rejects.toThrow(
        'Database error'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: validPaymentId,
        }),
        'PaymentService.handleWebhook - error'
      );
    });
  });
});
