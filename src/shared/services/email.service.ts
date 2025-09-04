/**
 * @module Shared/Service
 * @description Provides a centralized service for sending emails via Nodemailer.
 */

import 'dotenv/config'
import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

/**
 * Defines the structure for the email options.
 * @interface MailOptions
 */
// Interface for email options
interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // This allows Node.js to connect to servers with self-signed certificates.
    // Necessary for environments with corporate proxies or intrusive antivirus software.
    rejectUnauthorized: false
  }
});

/**
 * Sends an email using the pre-configured transporter.
 * @param {MailOptions} options - The email options including recipient, subject, and HTML content.
 * @returns {Promise<void>} A promise that resolves on success or rejects on failure.
 * @throws {Error} If the email fails to send.
 */
// Function to send an email
export const sendEmail = async (options: MailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"UpSkill Platform" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    await transporter.sendMail(mailOptions)
    logger.info({ to: options.to, subject: options.subject }, `Email sent successfully`)
  } catch (error) {
    logger.error({ err: error, to: options.to }, 'Error sending email')
    throw new Error('Could not send email.')
  }
}