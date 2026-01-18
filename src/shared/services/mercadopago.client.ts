/**
 * @module Shared/Services/MercadoPagoClient
 * @remarks HTTP client for direct interaction with the Mercado Pago API.
 */

import { Logger } from 'pino';

/**
 * Structure for item within a payment preference.
 */
export interface MercadoPagoItem {
  id: string;
  title: string;
  description: string;
  picture_url?: string;
  category_id: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}

/**
 * Back URLs configuration for payment preference.
 */
export interface MercadoPagoBackUrls {
  success: string;
  failure: string;
  pending: string;
}

/**
 * Request body for creating a payment preference.
 */
export interface CreatePreferenceRequest {
  items: MercadoPagoItem[];
  back_urls: MercadoPagoBackUrls;
  auto_return?: 'approved' | 'all';
  external_reference?: string;
  notification_url?: string;
}

/**
 * Response from creating a payment preference.
 */
export interface CreatePreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
}

/**
 * Payment information retrieved from Mercado Pago.
 */
export interface MercadoPagoPayment {
  id: number;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' | 'in_process';
  status_detail?: string;
  external_reference?: string;
  payment_type_id?: string;
  payment_method_id?: string;
  transaction_amount?: number;
  date_approved?: string;
}

/**
 * Error response from Mercado Pago API.
 */
export interface MercadoPagoError {
  message: string;
  error: string;
  status: number;
  cause?: Array<{
    code: string;
    description: string;
  }>;
}

/**
 * HTTP client for the Mercado Pago REST API.
 * Provides methods to create payment preferences and retrieve payment information.
 */
export class MercadoPagoClient {
  private readonly baseUrl = 'https://api.mercadopago.com';
  private readonly accessToken: string;

  /**
   * Creates a new MercadoPago API client.
   * @param {string} accessToken - The Mercado Pago access token.
   * @param {Logger} logger - Logger instance for tracking API calls.
   */
  constructor(
    accessToken: string,
    private readonly logger: Logger
  ) {
    if (!accessToken) {
      throw new Error('Mercado Pago access token is required');
    }
    this.accessToken = accessToken;
  }

  /**
   * Creates a new payment preference.
   * @param {CreatePreferenceRequest} data - Preference data including items, URLs, and metadata.
   * @returns {Promise<CreatePreferenceResponse>} The created preference with ID and checkout URL.
   * @throws {Error} If the API request fails.
   */
  async createPreference(data: CreatePreferenceRequest): Promise<CreatePreferenceResponse> {
    this.logger.info({ data }, 'MercadoPagoClient.createPreference - start');

    try {
      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as MercadoPagoError;
        this.logger.error({ 
          status: response.status, 
          errorData 
        }, 'MercadoPagoClient.createPreference - API error');
        
        throw new Error(
          `Mercado Pago API error: ${errorData.message || 'Unknown error'} (status: ${response.status})`
        );
      }

      const result = await response.json() as CreatePreferenceResponse;
      this.logger.info({ preferenceId: result.id }, 'MercadoPagoClient.createPreference - success');
      
      return result;
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'MercadoPagoClient.createPreference - error');
      throw error;
    }
  }

  /**
   * Retrieves payment information by ID.
   * @param {string} paymentId - The ID of the payment to retrieve.
   * @returns {Promise<MercadoPagoPayment>} The payment information.
   * @throws {Error} If the API request fails.
   */
  async getPayment(paymentId: string): Promise<MercadoPagoPayment> {
    this.logger.info({ paymentId }, 'MercadoPagoClient.getPayment - start');

    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as MercadoPagoError;
        this.logger.error({ 
          status: response.status, 
          errorData 
        }, 'MercadoPagoClient.getPayment - API error');
        
        throw new Error(
          `Mercado Pago API error: ${errorData.message || 'Unknown error'} (status: ${response.status})`
        );
      }

      const result = await response.json() as MercadoPagoPayment;
      this.logger.info({ paymentId, status: result.status }, 'MercadoPagoClient.getPayment - success');
      
      return result;
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'MercadoPagoClient.getPayment - error');
      throw error;
    }
  }
}
