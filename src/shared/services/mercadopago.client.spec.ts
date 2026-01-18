import 'reflect-metadata';
import { MercadoPagoClient } from './mercadopago.client.js';
import { Logger } from 'pino';

// Mock global fetch
global.fetch = jest.fn();

describe('MercadoPagoClient - Unit Tests', () => {
  let mpClient: MercadoPagoClient;
  let mockLogger: jest.Mocked<Logger>;
  const mockAccessToken = 'TEST-1234567890-test-access-token';

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    mpClient = new MercadoPagoClient(mockAccessToken, mockLogger);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if access token is not provided', () => {
      // Act & Assert
      expect(() => new MercadoPagoClient('', mockLogger)).toThrow(
        'Mercado Pago access token is required'
      );
    });

    it('should create client with valid access token', () => {
      // Act
      const client = new MercadoPagoClient(mockAccessToken, mockLogger);

      // Assert
      expect(client).toBeInstanceOf(MercadoPagoClient);
    });
  });

  describe('createPreference', () => {
    it('should successfully create a payment preference', async () => {
      // Arrange
      const mockPreferenceData = {
        items: [
          {
            id: 'course-123',
            title: 'Test Course',
            description: 'A test course',
            category_id: 'education',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 1000,
          },
        ],
        back_urls: {
          success: 'http://example.com/success',
          failure: 'http://example.com/failure',
          pending: 'http://example.com/pending',
        },
        auto_return: 'approved' as const,
        external_reference: JSON.stringify({ userId: '1', courseId: '123' }),
        notification_url: 'http://example.com/webhook',
      };

      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123456',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await mpClient.createPreference(mockPreferenceData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mercadopago.com/checkout/preferences',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify(mockPreferenceData),
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        { preferenceId: 'pref-123456' },
        'MercadoPagoClient.createPreference - success'
      );
    });

    it('should throw error when API returns error response', async () => {
      // Arrange
      const mockPreferenceData = {
        items: [
          {
            id: 'course-123',
            title: 'Test Course',
            description: 'A test course',
            category_id: 'education',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 1000,
          },
        ],
        back_urls: {
          success: 'http://example.com/success',
          failure: 'http://example.com/failure',
          pending: 'http://example.com/pending',
        },
      };

      const mockErrorResponse = {
        message: 'Invalid parameter',
        error: 'bad_request',
        status: 400,
        cause: [
          {
            code: 'invalid_parameter',
            description: 'Invalid unit_price',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(mpClient.createPreference(mockPreferenceData)).rejects.toThrow(
        'Mercado Pago API error: Invalid parameter (status: 400)'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          status: 400,
          errorData: mockErrorResponse,
        },
        'MercadoPagoClient.createPreference - API error'
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      const mockPreferenceData = {
        items: [
          {
            id: 'course-123',
            title: 'Test Course',
            description: 'A test course',
            category_id: 'education',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 1000,
          },
        ],
        back_urls: {
          success: 'http://example.com/success',
          failure: 'http://example.com/failure',
          pending: 'http://example.com/pending',
        },
      };

      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(mpClient.createPreference(mockPreferenceData)).rejects.toThrow(
        'Network error'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: 'Network error' },
        'MercadoPagoClient.createPreference - error'
      );
    });
  });

  describe('getPayment', () => {
    it('should successfully retrieve payment information', async () => {
      // Arrange
      const paymentId = '123456789';
      const mockPaymentResponse = {
        id: 123456789,
        status: 'approved' as const,
        status_detail: 'accredited',
        external_reference: JSON.stringify({ userId: '1', courseId: '123' }),
        payment_type_id: 'credit_card',
        payment_method_id: 'visa',
        transaction_amount: 1000,
        date_approved: '2026-01-18T10:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentResponse,
      });

      // Act
      const result = await mpClient.getPayment(paymentId);

      // Assert
      expect(result).toEqual(mockPaymentResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        { paymentId: '123456789', status: 'approved' },
        'MercadoPagoClient.getPayment - success'
      );
    });

    it('should throw error when payment is not found', async () => {
      // Arrange
      const paymentId = '999999999';
      const mockErrorResponse = {
        message: 'Payment not found',
        error: 'not_found',
        status: 404,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(mpClient.getPayment(paymentId)).rejects.toThrow(
        'Mercado Pago API error: Payment not found (status: 404)'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          status: 404,
          errorData: mockErrorResponse,
        },
        'MercadoPagoClient.getPayment - API error'
      );
    });

    it('should handle unauthorized errors', async () => {
      // Arrange
      const paymentId = '123456789';
      const mockErrorResponse = {
        message: 'Invalid credentials',
        error: 'unauthorized',
        status: 401,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(mpClient.getPayment(paymentId)).rejects.toThrow(
        'Mercado Pago API error: Invalid credentials (status: 401)'
      );
    });

    it('should handle network errors when getting payment', async () => {
      // Arrange
      const paymentId = '123456789';
      const networkError = new Error('Connection timeout');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(mpClient.getPayment(paymentId)).rejects.toThrow('Connection timeout');
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: 'Connection timeout' },
        'MercadoPagoClient.getPayment - error'
      );
    });

    it('should handle different payment statuses', async () => {
      // Arrange
      const paymentId = '123456789';
      const statuses: Array<'approved' | 'pending' | 'rejected' | 'cancelled'> = [
        'approved',
        'pending',
        'rejected',
        'cancelled',
      ];

      for (const status of statuses) {
        const mockPaymentResponse = {
          id: 123456789,
          status: status,
          external_reference: JSON.stringify({ userId: '1', courseId: '123' }),
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaymentResponse,
        });

        // Act
        const result = await mpClient.getPayment(paymentId);

        // Assert
        expect(result.status).toBe(status);
      }
    });
  });
});
