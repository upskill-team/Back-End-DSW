/**
 * @module Shared/Utils/Currency
 * @remarks Utility functions for handling currency conversions between pesos and cents.
 */

/**
 * Converts an amount in pesos (with decimals) to cents (integer).
 * This avoids floating-point precision issues in financial calculations.
 * 
 * @param {number} amount - The amount in pesos (e.g., 100.50)
 * @returns {number} The amount in cents (e.g., 10050)
 * 
 * @example
 * toCents(100.00) // returns 10000
 * toCents(97.50)  // returns 9750
 * toCents(0.03)   // returns 3
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts an amount in cents (integer) to pesos (with decimals).
 * 
 * @param {number} cents - The amount in cents (e.g., 10000)
 * @returns {number} The amount in pesos (e.g., 100.00)
 * 
 * @example
 * toAmount(10000) // returns 100.00
 * toAmount(9750)  // returns 97.50
 * toAmount(3)     // returns 0.03
 */
export function toAmount(cents: number): number {
  return cents / 100;
}

/**
 * Calculates the professor's share (97%) from a total amount in cents.
 * 
 * @param {number} totalCents - The total payment amount in cents
 * @returns {number} The professor's share in cents (97%)
 * 
 * @example
 * calculateProfessorShare(10000) // returns 9700 (97% of 10000)
 */
export function calculateProfessorShare(totalCents: number): number {
  return Math.round(totalCents * 0.97);
}

/**
 * Calculates the platform's fee (3%) from a total amount in cents.
 * 
 * @param {number} totalCents - The total payment amount in cents
 * @returns {number} The platform's fee in cents (3%)
 * 
 * @example
 * calculatePlatformFee(10000) // returns 300 (3% of 10000)
 */
export function calculatePlatformFee(totalCents: number): number {
  return Math.round(totalCents * 0.03);
}

/**
 * Formats an amount in cents as a currency string.
 * 
 * @param {number} cents - The amount in cents
 * @param {string} currency - The currency code (default: 'ARS')
 * @param {string} locale - The locale for formatting (default: 'es-AR')
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(10000) // returns "$100,00"
 * formatCurrency(9750)  // returns "$97,50"
 */
export function formatCurrency(
  cents: number,
  currency: string = 'ARS',
  locale: string = 'es-AR'
): string {
  const amount = toAmount(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
