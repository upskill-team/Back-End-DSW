/**
 * @module Models/Assessment/DTOs
 * @remarks Data Transfer Objects for Assessment responses.
 */

export interface AssessmentPublicSchema {
  id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  passingScore: number;
  maxAttempts?: number;
  isActive: boolean;
  availableFrom?: string;
  availableUntil?: string;
  questionsCount: number;
  attemptsCount: number;
  attemptsRemaining: number | null;
  bestScore?: number;
  lastAttemptDate?: string;
  status: string;
  hasActiveAttempt: boolean;
}