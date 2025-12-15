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
  attemptsCount: number;
  attemptsRemaining: number | null; // null if it's unlimited
  bestScore?: number;
  lastAttemptDate?: string;
  status: string;
}