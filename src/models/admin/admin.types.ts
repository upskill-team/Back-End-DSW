/**
 * @module Models/Admin/Types
 * @remarks Type definitions for admin analytics responses.
 */

/**
 * Monthly user growth statistics.
 */
export interface MonthlyUserGrowth {
  month: string; // Format: YYYY-MM
  newStudents: number;
  newProfessors: number;
  totalStudents: number;
  totalProfessors: number;
}

/**
 * Monthly revenue statistics.
 */
export interface MonthlyRevenue {
  month: string; // Format: YYYY-MM
  totalEarningsInCents: number;
  platformEarningsInCents: number;
  professorsEarningsInCents: number;
  salesCount: number;
}

/**
 * Top course statistics.
 */
export interface TopCourse {
  courseId: string;
  courseName: string;
  professorName: string;
  salesCount: number;
  totalEarningsInCents: number;
  studentsCount: number;
}

/**
 * Top professor statistics.
 */
export interface TopProfessor {
  professorId: string;
  professorName: string;
  totalEarningsInCents: number;
  coursesCount: number;
  totalStudents: number;
  averageRating: number | null;
}

/**
 * Course statistics by status and pricing.
 */
export interface CourseStats {
  byStatus: { [key: string]: number };
  freeCourses: number;
  paidCourses: number;
  averagePriceInCents: number | null;
}

/**
 * Recent activity statistics.
 */
export interface RecentActivity {
  newStudentsToday: number;
  newProfessorsToday: number;
  salesToday: number;
  newCoursesThisWeek: number;
  newEnrollmentsToday: number;
}

/**
 * Growth percentages.
 */
export interface Growth {
  studentsGrowthPercentage: number;
  professorsGrowthPercentage: number;
  coursesGrowthPercentage: number;
  revenueGrowthPercentage: number;
}

/**
 * Complete admin analytics response.
 */
export interface AdminAnalytics {
  totalStudents: number;
  totalProfessors: number;
  totalCourses: number;
  totalEarningsInCents: number;
  platformEarningsInCents: number;
  professorsEarningsInCents: number;
  totalEnrollments: number;
  pendingAppeals: number;
  pendingJoinRequests: number;
  
  userGrowth: MonthlyUserGrowth[];
  revenueHistory: MonthlyRevenue[];
  topCourses: TopCourse[];
  topProfessors: TopProfessor[];
  courseStats: CourseStats;
  recentActivity: RecentActivity;
  growth: Growth;
}
