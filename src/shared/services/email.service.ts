/**
 * @module Shared/Service
 * @description Hybrid email service: Uses Nodemailer for Dev/Test and Resend for Production.
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () => {
  if (!process.env.EMAIL_HOST) throw new Error('Missing EMAIL_HOST for Nodemailer');
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const sendViaNodemailer = async (options: MailOptions) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"UpSkill Dev" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: `[DEV] ${options.subject}`,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  logger.info({ messageId: info.messageId, to: options.to }, 'Email sent via Nodemailer (SMTP)');
};

const sendViaResend = async (options: MailOptions) => {
  if (!resend) throw new Error('RESEND_API_KEY is missing in production environment');

  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const { data, error } = await resend.emails.send({
    from: `UpSkill Platform <${fromEmail}>`,
    to: [options.to],
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    logger.error({ err: error, to: options.to }, 'Resend API Error');
    throw new Error(`Resend Error: ${error.message}`);
  }

  logger.info({ id: data?.id, to: options.to }, 'Email sent via Resend API');
};

export const sendEmail = async (options: MailOptions): Promise<void> => {
  const env = process.env.NODE_ENV || 'development';

  try {
    if (env === 'production') {
      await sendViaResend(options);
    } else {
      await sendViaNodemailer(options);
    }
  } catch (error: any) {
    logger.error({ err: error, env }, 'Critical error sending email');
    throw new Error('Could not send email service.');
  }
};