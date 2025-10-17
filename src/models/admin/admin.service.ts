/**
 * @module Models/Admin/Service
 * @remarks Business logic for admin analytics and platform statistics.
 */

import { EntityManager } from '@mikro-orm/core';
import { logger } from '../../shared/utils/logger.js';
import { Student } from '../student/student.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Course, status } from '../course/course.entity.js';
import { Earning, EarningType } from '../payment/earning.entity.js';
import { Payment, PaymentStatus } from '../payment/payment.entity.js';
import { Enrollement } from '../Enrollement/enrollement.entity.js';
import { Appeal } from '../appeal/appeal.entity.js';
import { JoinRequest, JoinRequestStatus } from '../joinRequest/joinRequest.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import type {
  AdminAnalytics,
  MonthlyUserGrowth,
  MonthlyRevenue,
  TopCourse,
  TopProfessor,
  CourseStats,
  RecentActivity,
  Growth,
} from './admin.types.js';

/**
 * Service for managing admin analytics and statistics.
 */
export class AdminService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Get comprehensive platform analytics.
   */
  async getAnalytics(months: number = 6): Promise<AdminAnalytics> {
    try {
      logger.info({ months }, 'Fetching admin analytics');

      // Fetch all data in parallel
      const [
        students,
        professors,
        courses,
        earnings,
        payments,
        enrollments,
        pendingAppeals,
        pendingJoinRequests,
      ] = await Promise.all([
        this.em.find(Student, {}, { populate: ['user'] }),
        this.em.find(Professor, {}, { populate: ['user'] }),
        this.em.find(Course, {}, { populate: ['professor.user'] }),
        this.em.find(Earning, {}, { populate: ['professor'] }),
        this.em.find(Payment, { status: PaymentStatus.APPROVED }, { populate: ['course'] }),
        this.em.find(Enrollement, {}, { populate: ['course', 'student'] }),
        this.em.count(Appeal, { state: 'pending' }),
        this.em.count(JoinRequest, { status: JoinRequestStatus.PENDING }),
      ]);

      // Calculate totals
      const totalEarningsInCents = earnings.reduce((sum, e) => sum + e.amountInCents, 0);
      const platformEarningsInCents = earnings
        .filter(e => e.type === EarningType.PLATFORM_FEE)
        .reduce((sum, e) => sum + e.amountInCents, 0);
      const professorsEarningsInCents = earnings
        .filter(e => e.type === EarningType.PROFESSOR_SHARE)
        .reduce((sum, e) => sum + e.amountInCents, 0);

      // Historical data
      const userGrowth = await this.calculateUserGrowth(students, professors, months);
      const revenueHistory = this.calculateRevenueHistory(earnings, payments, months);

      // Top rankings
      const topCourses = await this.getTopCourses(payments, enrollments, courses);
      const topProfessors = await this.getTopProfessors(
        earnings.filter(e => e.type === EarningType.PROFESSOR_SHARE),
        courses,
        enrollments
      );

      // Course stats
      const courseStats = this.calculateCourseStats(courses);

      // Recent activity
      const recentActivity = await this.getRecentActivity(enrollments);

      // Growth percentages
      const growth = this.calculateGrowthPercentages(userGrowth, revenueHistory);

      return {
        totalStudents: students.length,
        totalProfessors: professors.length,
        totalCourses: courses.length,
        totalEarningsInCents,
        platformEarningsInCents,
        professorsEarningsInCents,
        totalEnrollments: enrollments.length,
        pendingAppeals,
        pendingJoinRequests,
        
        userGrowth,
        revenueHistory,
        topCourses,
        topProfessors,
        courseStats,
        recentActivity,
        growth,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching admin analytics');
      throw error;
    }
  }

  /**
   * Calculate user growth for the last N months.
   */
  private async calculateUserGrowth(
    students: Student[],
    professors: Professor[],
    months: number
  ): Promise<MonthlyUserGrowth[]> {
    const now = new Date();
    const result: MonthlyUserGrowth[] = [];

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      // Count new users in this month
      const newStudents = students.filter(s => {
        if (!s.createdAt) return false;
        const createdAt = new Date(s.createdAt);
        return createdAt >= monthDate && createdAt < nextMonthDate;
      }).length;

      const newProfessors = professors.filter(p => {
        if (!p.createdAt) return false;
        const createdAt = new Date(p.createdAt);
        return createdAt >= monthDate && createdAt < nextMonthDate;
      }).length;

      // Count total users up to end of this month
      const totalStudents = students.filter(s => s.createdAt && new Date(s.createdAt) < nextMonthDate).length;
      const totalProfessors = professors.filter(p => p.createdAt && new Date(p.createdAt) < nextMonthDate).length;

      result.push({
        month: monthKey,
        newStudents,
        newProfessors,
        totalStudents,
        totalProfessors,
      });
    }

    return result.reverse(); // Oldest to newest
  }

  /**
   * Calculate revenue history for the last N months.
   */
  private calculateRevenueHistory(earnings: Earning[], payments: Payment[], months: number): MonthlyRevenue[] {
    const now = new Date();
    const result: MonthlyRevenue[] = [];

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      const monthEarnings = earnings.filter(e => {
        return e.createdAt >= monthDate && e.createdAt < nextMonthDate;
      });

      const totalEarningsInCents = monthEarnings.reduce((sum, e) => sum + e.amountInCents, 0);
      const platformEarningsInCents = monthEarnings
        .filter(e => e.type === EarningType.PLATFORM_FEE)
        .reduce((sum, e) => sum + e.amountInCents, 0);
      const professorsEarningsInCents = monthEarnings
        .filter(e => e.type === EarningType.PROFESSOR_SHARE)
        .reduce((sum, e) => sum + e.amountInCents, 0);

      const salesCount = payments.filter(p => {
        return p.paidAt >= monthDate && p.paidAt < nextMonthDate;
      }).length;

      result.push({
        month: monthKey,
        totalEarningsInCents,
        platformEarningsInCents,
        professorsEarningsInCents,
        salesCount,
      });
    }

    return result.reverse(); // Oldest to newest
  }

  /**
   * Get top 5 courses by sales.
   */
  private async getTopCourses(
    payments: Payment[],
    enrollments: Enrollement[],
    courses: Course[]
  ): Promise<TopCourse[]> {
    const courseMap = new Map<string, { salesCount: number; totalEarnings: number; studentsCount: number }>();

    // Count sales per course
    payments.forEach(payment => {
      const courseId = payment.course.id;
      if (!courseId) return;
      
      const existing = courseMap.get(courseId) || { salesCount: 0, totalEarnings: 0, studentsCount: 0 };
      existing.salesCount += 1;
      existing.totalEarnings += payment.amountInCents;
      courseMap.set(courseId, existing);
    });

    // Count students per course
    enrollments.forEach(enrollment => {
      const courseId = enrollment.course.id;
      if (!courseId) return;
      
      const existing = courseMap.get(courseId);
      if (existing) {
        existing.studentsCount += 1;
      }
    });

    // Build result
    const result: TopCourse[] = [];
    for (const [courseId, data] of courseMap.entries()) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        result.push({
          courseId,
          courseName: course.name,
          professorName: course.professor.user.name,
          salesCount: data.salesCount,
          totalEarningsInCents: data.totalEarnings,
          studentsCount: data.studentsCount,
        });
      }
    }

    return result.sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  }

  /**
   * Get top 5 professors by earnings.
   */
  private async getTopProfessors(
    professorEarnings: Earning[],
    courses: Course[],
    enrollments: Enrollement[]
  ): Promise<TopProfessor[]> {
    const professorMap = new Map<string, { earnings: number; courses: Set<string>; students: Set<string> }>();

    // Sum earnings per professor
    professorEarnings.forEach(earning => {
      if (earning.professor) {
        const profId = earning.professor.id;
        if (!profId) return;
        
        const existing = professorMap.get(profId) || { earnings: 0, courses: new Set(), students: new Set() };
        existing.earnings += earning.amountInCents;
        professorMap.set(profId, existing);
      }
    });

    // Count courses per professor
    courses.forEach(course => {
      const profId = course.professor.id;
      if (!profId) return;
      
      const existing = professorMap.get(profId);
      if (existing && course.status === status.PUBLISHED && course.id) {
        existing.courses.add(course.id);
      }
    });

    // Count students per professor
    enrollments.forEach(enrollment => {
      const course = courses.find(c => c.id === enrollment.course.id);
      if (course) {
        const profId = course.professor.id;
        const studentId = enrollment.student.id;
        if (!profId || !studentId) return;
        
        const existing = professorMap.get(profId);
        if (existing) {
          existing.students.add(studentId);
        }
      }
    });

    // Build result
    const result: TopProfessor[] = [];
    for (const [profId, data] of professorMap.entries()) {
      const professor = await this.em.findOne(Professor, { _id: new ObjectId(profId) }, { populate: ['user'] });
      if (professor) {
        result.push({
          professorId: profId,
          professorName: professor.user.name,
          totalEarningsInCents: data.earnings,
          coursesCount: data.courses.size,
          totalStudents: data.students.size,
          averageRating: null, // TODO: Implement when rating system is available
        });
      }
    }

    return result.sort((a, b) => b.totalEarningsInCents - a.totalEarningsInCents).slice(0, 5);
  }

  /**
   * Calculate course statistics.
   */
  private calculateCourseStats(courses: Course[]): CourseStats {
    const byStatus: { [key: string]: number } = {};
    Object.values(status).forEach(s => {
      byStatus[s] = courses.filter(c => c.status === s).length;
    });

    const freeCourses = courses.filter(c => c.isFree).length;
    const paidCourses = courses.filter(c => !c.isFree && c.priceInCents).length;

    const paidCoursesWithPrice = courses.filter(c => !c.isFree && c.priceInCents);
    const averagePriceInCents = paidCoursesWithPrice.length > 0
      ? Math.round(paidCoursesWithPrice.reduce((sum, c) => sum + (c.priceInCents || 0), 0) / paidCoursesWithPrice.length)
      : null;

    return {
      byStatus,
      freeCourses,
      paidCourses,
      averagePriceInCents,
    };
  }

  /**
   * Get recent activity statistics.
   */
  private async getRecentActivity(enrollments: Enrollement[]): Promise<RecentActivity> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [newStudentsToday, newProfessorsToday, salesToday, newCoursesThisWeek] = await Promise.all([
      this.em.count(Student, { createdAt: { $gte: startOfToday } }),
      this.em.count(Professor, { createdAt: { $gte: startOfToday } }),
      this.em.count(Payment, { status: PaymentStatus.APPROVED, createdAt: { $gte: startOfToday } }),
      this.em.count(Course, { createdAt: { $gte: startOfWeek } }),
    ]);

    const newEnrollmentsToday = enrollments.filter(e => e.createdAt && new Date(e.createdAt) >= startOfToday).length;

    return {
      newStudentsToday,
      newProfessorsToday,
      salesToday,
      newCoursesThisWeek,
      newEnrollmentsToday,
    };
  }

  /**
   * Calculate growth percentages.
   */
  private calculateGrowthPercentages(userGrowth: MonthlyUserGrowth[], revenueHistory: MonthlyRevenue[]): Growth {
    const calculatePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 100) / 100;
    };

    const studentsGrowthPercentage = userGrowth.length >= 2
      ? calculatePercentage(userGrowth[userGrowth.length - 1].newStudents, userGrowth[userGrowth.length - 2].newStudents)
      : 0;

    const professorsGrowthPercentage = userGrowth.length >= 2
      ? calculatePercentage(userGrowth[userGrowth.length - 1].newProfessors, userGrowth[userGrowth.length - 2].newProfessors)
      : 0;

    const coursesGrowthPercentage = 0; // TODO: Would need course creation history

    const revenueGrowthPercentage = revenueHistory.length >= 2
      ? calculatePercentage(
          revenueHistory[revenueHistory.length - 1].totalEarningsInCents,
          revenueHistory[revenueHistory.length - 2].totalEarningsInCents
        )
      : 0;

    return {
      studentsGrowthPercentage,
      professorsGrowthPercentage,
      coursesGrowthPercentage,
      revenueGrowthPercentage,
    };
  }
}
