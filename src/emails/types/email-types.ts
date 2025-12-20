/**
 * @module Emails/Types
 * @remarks Type definitions for the email notification system.
 */

/**
 * Enum defining all possible email notification types in the system.
 */
export enum EmailType {
  RESET_PASSWORD = 'reset_password',
  APPEAL_ACCEPTED = 'appeal_accepted',
  APPEAL_REJECTED = 'appeal_rejected',
  COURSE_PURCHASE = 'course_purchase',
  COURSE_ENROLLMENT = 'course_enrollment',
  NEW_ASSESSMENT = 'new_assessment',
  CONTACT_SUPPORT = 'contact_support',
  ASSESSMENT_GRADED = 'assessment_graded',
  COURSE_COMPLETED = 'course_completed',
}

/**
 * Base interface for all email data payloads.
 */
export interface BaseEmailData {
  recipientEmail: string;
  recipientName: string;
}

/**
 * Data required for password reset emails.
 */
export interface ResetPasswordEmailData extends BaseEmailData {
  resetUrl: string;
}

/**
 * Data required for appeal status notification emails.
 */
export interface AppealStatusEmailData extends BaseEmailData {
  appealId: string;
  status: 'accepted' | 'rejected';
  message?: string;
}

/**
 * Data required for course purchase confirmation emails.
 */
export interface CoursePurchaseEmailData extends BaseEmailData {
  courseName: string;
  courseImageUrl?: string;
  amount: number;
  transactionId: string;
  purchaseDate: Date;
  courseUrl: string;
}

/**
 * Data required for free course enrollment emails.
 */
export interface CourseEnrollmentEmailData extends BaseEmailData {
  courseName: string;
  courseImageUrl?: string;
  courseUrl: string;
  enrollmentDate: Date;
  professorName: string;
}

/**
 * Data required for new assessment notification emails.
 */
export interface NewAssessmentEmailData extends BaseEmailData {
  courseName: string;
  assessmentTitle: string;
  availableFrom?: Date;
  availableUntil?: Date;
  assessmentUrl: string;
}

/**
 * Data required for contact support notification emails (internal).
 */
export interface ContactSupportEmailData {
  recipientEmail: string; // Support team email
  name: string; // User's name
  email: string; // User's email
  subject: string; // Message subject
  message: string; // Message content
  submittedAt: Date; // Submission timestamp
  ticketId?: string; // Optional ticket ID
}

/**
 * Data required for assessment graded notification emails.
 */
export interface AssessmentGradedEmailData extends BaseEmailData {
  courseName: string;
  assessmentTitle: string;
  score: number;
  maxScore: number;
  resultUrl: string;
}

/**
 * Data required for course completion emails.
 */
export interface CourseCompletedEmailData extends BaseEmailData {
  courseName: string;
  completionDate: Date;
  certificateUrl?: string;
}

/**
 * Union type of all possible email data types.
 */
export type EmailData =
  | ResetPasswordEmailData
  | AppealStatusEmailData
  | CoursePurchaseEmailData
  | CourseEnrollmentEmailData
  | NewAssessmentEmailData
  | ContactSupportEmailData
  | AssessmentGradedEmailData
  | CourseCompletedEmailData;

/**
 * Interface for email sending options.
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Result of an email sending operation.
 */
export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}
