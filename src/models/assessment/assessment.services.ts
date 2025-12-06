/**
 * @module Models/Assessment/Service
 * @remarks Encapsulates the business logic for managing assessments.
 */

import { EntityManager, wrap } from '@mikro-orm/core';
import { Logger } from 'pino';
import { ObjectId } from '@mikro-orm/mongodb';
import { safeParse } from 'valibot';
import { Assessment } from './assessment.entity.js';
import { Course } from '../course/course.entity.js';
import { Question } from '../question/question.entity.js';
import {
  AssessmentAttempt,
  AttemptStatus,
} from './assessmentAttempt.entity.js';
import { AttemptAnswer } from './attemptAnswer.entity.js';
import { Student } from '../student/student.entity.js';
import {
  CreateAssessmentSchema,
  CreateAssessmentType,
  UpdateAssessmentSchema,
  UpdateAssessmentType,
  SubmitAnswerType,
  SubmitAttemptType,
} from './assessment.schemas.js';
import { EnrollementService } from '../Enrollement/enrollement.service.js';
import { EmailNotificationService } from '../../emails/services/email-notification.service.js';

/**
 * Provides methods for CRUD operations on Assessment entities.
 * @class AssessmentService
 */
export class AssessmentService {
  private em: EntityManager;
  private logger: Logger;
  private emailService: EmailNotificationService;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'AssessmentService' } });
    this.emailService = new EmailNotificationService(logger);
  }

  /**
   * Creates a new assessment for a course.
   * @param {CreateAssessmentType} data - The assessment data.
   * @returns {Promise<Assessment>} The created assessment.
   */
  public async create(data: CreateAssessmentType): Promise<Assessment> {
    this.logger.info({ data }, 'Creating new assessment.');

    const result = safeParse(CreateAssessmentSchema, data);
    if (!result.success) {
      this.logger.error(
        { issues: result.issues },
        'Validation failed for assessment creation.'
      );
      throw new Error('Invalid data for assessment creation.');
    }

    const {
      courseId,
      questionIds,
      availableFrom,
      availableUntil,
      ...assessmentData
    } = result.output;

    // Verify course exists
    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
    });

    // Create assessment
    const assessment = new Assessment();
    Object.assign(assessment, assessmentData);
    assessment.course = course;

    // Parse dates if provided
    if (availableFrom) {
      assessment.availableFrom = new Date(availableFrom);
    }
    if (availableUntil) {
      assessment.availableUntil = new Date(availableUntil);
    }

    // Load and add questions
    const questions = await this.em.find(Question, {
      _id: { $in: questionIds.map((id) => new ObjectId(id)) },
    });

    if (questions.length !== questionIds.length) {
      throw new Error('One or more questions not found.');
    }

    questions.forEach((q) => assessment.questions.add(q));

    await this.em.persistAndFlush(assessment);

    this.logger.info(
      { assessmentId: assessment.id },
      'Assessment created successfully.'
    );
    
    // Notify all enrolled students about the new assessment
    // Execute asynchronously to not block the response
    this.notifyStudentsAboutNewAssessment(assessment, course).catch((err) => {
      this.logger.error(
        { err, assessmentId: assessment.id, courseId: course.id },
        'Failed to send new assessment notifications'
      );
    });
    
    return assessment;
  }

  /**
   * Retrieves all assessments, optionally filtered by course.
   * @param {string} [courseId] - Optional course ID to filter by.
   * @returns {Promise<Assessment[]>} Array of assessments.
   */
  public async findAllForProfessor(professorId: string, courseId?: string): Promise<Assessment[]> {
    this.logger.info({ professorId, courseId }, 'Fetching all assessments for professor.');

    const professorCourses = await this.em.find(Course, { professor: new ObjectId(professorId) });
    if (professorCourses.length === 0) {
        return [];
    }
    const professorCourseIds = professorCourses.map(course => course._id!);

    const filter: any = {
      course: { $in: professorCourseIds },
    };
    
    if (courseId) {
        filter.course = new ObjectId(courseId);
        if (!professorCourseIds.some(id => id.equals(courseId))) {
            this.logger.warn({ professorId, courseId }, "Attempted to access assessments for a course not owned by the professor.");
            return [];
        }
    }

    return this.em.find(Assessment, filter, {
      populate: ['course', 'questions'],
    });
  }

  /**
   * Retrieves a single assessment by ID.
   * @param {string} id - The assessment ID.
   * @returns {Promise<Assessment>} The found assessment.
   */
  public async findOne(id: string): Promise<Assessment> {
    this.logger.info({ assessmentId: id }, 'Fetching assessment.');

    const objectId = new ObjectId(id);
    return this.em.findOneOrFail(
      Assessment,
      { _id: objectId },
      { populate: ['course', 'questions'] }
    );
  }

  /**
   * Updates an existing assessment.
   * @param {string} id - The assessment ID.
   * @param {UpdateAssessmentType} data - The fields to update.
   * @returns {Promise<Assessment>} The updated assessment.
   */
  public async update(
    id: string,
    data: UpdateAssessmentType
  ): Promise<Assessment> {
    this.logger.info({ assessmentId: id, data }, 'Updating assessment.');

    const result = safeParse(UpdateAssessmentSchema, data);
    if (!result.success) {
      this.logger.error(
        { issues: result.issues },
        'Validation failed for assessment update.'
      );
      throw new Error('Invalid data for assessment update.');
    }

    const objectId = new ObjectId(id);
    const assessment = await this.em.findOneOrFail(
      Assessment,
      { _id: objectId },
      { populate: ['questions'] }
    );

    const { questionIds, availableFrom, availableUntil, ...updateData } =
      result.output;

    // Update basic fields
    Object.assign(assessment, updateData);

    // Parse dates if provided
    if (availableFrom) {
      assessment.availableFrom = new Date(availableFrom);
    }
    if (availableUntil) {
      assessment.availableUntil = new Date(availableUntil);
    }

    // Update questions if provided
    if (questionIds) {
      const questions = await this.em.find(Question, {
        _id: { $in: questionIds.map((qid) => new ObjectId(qid)) },
      });

      if (questions.length !== questionIds.length) {
        throw new Error('One or more questions not found.');
      }

      assessment.questions.removeAll();
      questions.forEach((q) => assessment.questions.add(q));
    }

    await this.em.flush();

    this.logger.info({ assessmentId: id }, 'Assessment updated successfully.');
    return assessment;
  }

  /**
   * Deletes an assessment.
   * @param {string} id - The assessment ID.
   * @returns {Promise<void>}
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ assessmentId: id }, 'Deleting assessment.');

    const objectId = new ObjectId(id);
    const assessment = this.em.getReference(Assessment, objectId);
    await this.em.removeAndFlush(assessment);

    this.logger.info({ assessmentId: id }, 'Assessment deleted successfully.');
  }

  /**
   * Filters questions to remove correct answer information for students.
   * This is a security measure to prevent students from seeing correct answers before completing the assessment.
   * @param {Question[]} questions - The original questions with correct answers.
   * @returns {any[]} Questions without the isCorrect field in options.
   * @private
   */
  private filterQuestionsForStudent(questions: Question[]): any[] {
    return questions.map(question => {
      const questionObj = wrap(question).toObject();
      
      if (questionObj.type === 'multiple_choice' && questionObj.options) {
        return {
          id: questionObj.id,
          text: questionObj.text,
          type: questionObj.type,
          points: questionObj.points,
          options: questionObj.options.map((option: any) => ({
            id: option.id,
            text: option.text,
          }))
        };
      } else {
        return {
          id: questionObj.id,
          text: questionObj.text,
          type: questionObj.type,
          points: questionObj.points,
        };
      }
    });
  }

  /**
   * Starts a new attempt for a student on an assessment.
   * @param {StartAttemptType} data - The attempt start data.
   * @returns {Promise<any>} The created attempt with questions (without correct answers).
   */
  public async startAttempt(
    data: { assessmentId: string; studentId: string }
  ): Promise<any> {
    this.logger.info({ data }, 'Starting assessment attempt.');

    const { assessmentId, studentId } = data;

    const assessment = await this.em.findOneOrFail(
      Assessment,
      { _id: new ObjectId(assessmentId) },
      { populate: ['questions', 'course'] }
    );

    const student = await this.em.findOneOrFail(Student, {
      _id: new ObjectId(studentId),
    });

    const enrollmentService = new EnrollementService(this.em, this.logger);

    const enrollment = await enrollmentService.findByStudentAndCourse(
      student.id!,
      (assessment.course as Course).id!
    );

    if (!enrollment) {
      this.logger.warn({ studentId, courseId: (assessment.course as Course).id }, "Intento bloqueado: El estudiante no está inscrito en el curso.");
      throw new Error('Debes estar inscrito en el curso para realizar esta evaluación.');
    }

    // Check if assessment is available
    const now = new Date();
    if (assessment.availableFrom && assessment.availableFrom > now) {
      throw new Error('Assessment is not yet available.');
    }
    if (assessment.availableUntil && assessment.availableUntil < now) {
      throw new Error('Assessment is no longer available.');
    }

    if (!assessment.isActive) {
      throw new Error('Assessment is not active.');
    }

    // Count existing attempts
    const attemptCount = await this.em.count(AssessmentAttempt, {
      assessment: assessment._id,
      student: student._id,
    });

    // Check max attempts
    if (assessment.maxAttempts && attemptCount >= assessment.maxAttempts) {
      throw new Error('Maximum number of attempts reached.');
    }

    // Create new attempt
    const attempt = new AssessmentAttempt();
    attempt.assessment = assessment;
    attempt.student = student;
    attempt.attemptNumber = attemptCount + 1;
    attempt.status = AttemptStatus.IN_PROGRESS;
    attempt.startedAt = new Date();

    await this.em.persistAndFlush(attempt);

    // Load any existing answers for this attempt (for auto-save recovery)
    const existingAnswers = await this.em.find(
      AttemptAnswer,
      { attempt: attempt._id },
      { populate: ['question'] }
    );

    // Filter questions to remove correct answers
    const questionsForStudent = this.filterQuestionsForStudent(
      assessment.questions.getItems()
    );

    // Calculate time spent
    const timeSpent = attempt.submittedAt
      ? Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0;

    this.logger.info(
      { attemptId: attempt.id },
      'Assessment attempt started successfully.'
    );

    // Return attempt with filtered questions (without correct answers)
    return {
      id: attempt.id,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        questions: questionsForStudent,
      },
      student: student.id,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt || null,
      score: attempt.score || null,
      passed: attempt.passed || null,
      answers: existingAnswers.map(ans => ({
        id: ans.id,
        question: { id: (ans.question as Question).id },
        answer: ans.answer,
        answeredAt: ans.answeredAt,
      })),
      status: attempt.status,
      timeSpent,
    };
  }

  /**
   * Submits a single answer during an attempt.
   * @param {SubmitAnswerType} data - The answer submission data.
   * @returns {Promise<AttemptAnswer>} The created answer.
   */
  public async submitAnswer(data: SubmitAnswerType): Promise<AttemptAnswer> {
    this.logger.info({ data }, 'Submitting answer.');

    const { attemptId, questionId, answer } = data;

    const attempt = await this.em.findOneOrFail(
      AssessmentAttempt,
      { _id: new ObjectId(attemptId) },
      { populate: ['assessment.questions'] }
    );

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error('Attempt is not in progress.');
    }

    const question = await this.em.findOneOrFail(Question, {
      _id: new ObjectId(questionId),
    });

    // Check if answer is correct
    const isCorrect = this.checkAnswer(question, answer);

    // Check if answer already exists for this question in this attempt
    const existingAnswer = await this.em.findOne(AttemptAnswer, {
      attempt: attempt._id,
      question: question._id,
    });

    if (existingAnswer) {
      // Update existing answer
      existingAnswer.answer = answer;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.answeredAt = new Date();
      await this.em.flush();
      return existingAnswer;
    }

    // Create new answer
    const attemptAnswer = new AttemptAnswer();
    attemptAnswer.attempt = attempt;
    attemptAnswer.question = question;
    attemptAnswer.answer = answer;
    attemptAnswer.isCorrect = isCorrect;
    attemptAnswer.answeredAt = new Date();

    await this.em.persistAndFlush(attemptAnswer);

    this.logger.info(
      { answerId: attemptAnswer.id },
      'Answer submitted successfully.'
    );
    return attemptAnswer;
  }

  /**
   * Submits all answers and completes an attempt.
   * @param {SubmitAttemptType} data - The attempt submission data.
   * @returns {Promise<AssessmentAttempt>} The completed attempt with score.
   */
  public async submitAttempt(
    data: SubmitAttemptType
  ): Promise<AssessmentAttempt> {
    this.logger.info({ data }, 'Submitting attempt.');

    const { attemptId, answers } = data;

    const attempt = await this.em.findOneOrFail(
      AssessmentAttempt,
      { _id: new ObjectId(attemptId) },
      { populate: ['assessment', 'assessment.questions'] }
    );

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error('Attempt is not in progress.');
    }

    // Submit all answers
    for (const answerData of answers) {
      await this.submitAnswer({
        attemptId,
        questionId: answerData.questionId,
        answer: answerData.answer,
      });
    }

    // Calculate score
    const allAnswers = await this.em.find(AttemptAnswer, {
      attempt: attempt._id,
    });
    const correctAnswers = allAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = attempt.assessment.questions.length;
    const score =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Update attempt
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.score = Math.round(score * 100) / 100; // Round to 2 decimal places
    attempt.passed = score >= attempt.assessment.passingScore;

    await this.em.flush();

    this.logger.info(
      { attemptId, score, passed: attempt.passed },
      'Attempt submitted successfully.'
    );
    return attempt;
  }

  /**
   * Retrieves all attempts for a specific assessment.
   * @param {string} assessmentId - The assessment ID.
   * @returns {Promise<AssessmentAttempt[]>} Array of attempts.
   */
  public async getAttemptsByAssessment(
    assessmentId: string,
    studentId: string
  ): Promise<AssessmentAttempt[]> {
    this.logger.info({ assessmentId, studentId }, 'Fetching attempts for assessment.');

    return this.em.find(
      AssessmentAttempt,
      {
        assessment: new ObjectId(assessmentId),
        student: new ObjectId(studentId),
      },
      { populate: ['student', 'assessment'] }
    );
  }

  /**
   * Retrieves all attempts by a specific student.
   * @param {string} studentId - The student ID.
   * @returns {Promise<AssessmentAttempt[]>} Array of attempts.
   */
  public async getAttemptsByStudent(
    studentId: string
  ): Promise<AssessmentAttempt[]> {
    this.logger.info({ studentId }, 'Fetching attempts for student.');

    return this.em.find(
      AssessmentAttempt,
      { student: new ObjectId(studentId) },
      { populate: ['assessment', 'assessment.course'] }
    );
  }

  /**
   * Retrieves a single attempt with all its answers.
   * @param {string} attemptId - The attempt ID.
   * @returns {Promise<AssessmentAttempt & { answers: AttemptAnswer[] }>} The attempt with answers.
   */
  public async getAttemptWithAnswers(
    attemptId: string
  ): Promise<any> {
    this.logger.info({ attemptId }, 'Fetching attempt with answers.');

    const attempt = await this.em.findOneOrFail(
      AssessmentAttempt,
      { _id: new ObjectId(attemptId) },
      { populate: ['assessment.questions', 'student.user'] }
    );

    const answers = await this.em.find(
      AttemptAnswer,
      { attempt: attempt._id },
      { populate: ['question'] }
    );
    const attemptPOJO = wrap(attempt).toJSON();
    const answersPOJO = answers.map(answer => wrap(answer).toJSON());

    // Filter questions if attempt is not yet submitted (security)
    if (attemptPOJO.assessment?.questions && attempt.status !== AttemptStatus.SUBMITTED) {
      attemptPOJO.assessment.questions = this.filterQuestionsForStudent(
        attempt.assessment.questions.getItems()
      );
    }

    let timeSpent = 0;
    if (attempt.submittedAt) {
      const diffMs = attempt.submittedAt.getTime() - attempt.startedAt.getTime();
      timeSpent = Math.floor(diffMs / 60000); 
    }

    return {
      ...attemptPOJO,
      answers: answersPOJO,
      timeSpent: timeSpent,
    };
  }

  /**
   * Helper method to check if an answer is correct.
   * @private
   */
  private checkAnswer(question: Question, answer: string | number): boolean {
    const correctAnswer = question.payload.correctAnswer;

    // For multiple choice, compare numbers or indices
    if (typeof correctAnswer === 'number' && typeof answer === 'number') {
      return answer === correctAnswer;
    }

    // For string answers, case-insensitive comparison
    if (typeof correctAnswer === 'string' && typeof answer === 'string') {
      return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }

    // Mixed types comparison
    return String(answer) === String(correctAnswer);
  }

  /**
   * Finds all pending assessments for a student across all enrolled courses.
   * @param {string} studentId - The student ID.
   * @returns {Promise<any[]>} Array of pending assessments with metadata.
   */
  public async findPendingAssessments(studentId: string): Promise<any[]> {
    this.logger.info({ studentId }, 'Finding pending assessments for student.');

    // Import here to avoid circular dependency
    const { Enrollement, EnrollmentState } = await import(
      '../Enrollement/enrollement.entity.js'
    );

    // Find all active enrollments for the student
    const enrollments = await this.em.find(
      Enrollement,
      {
        student: new ObjectId(studentId),
        state: EnrollmentState.ENROLLED,
      },
      { populate: ['course'] }
    );

    const pendingAssessments = [];
    const now = new Date();

    for (const enrollment of enrollments) {
      const course = enrollment.course;

      // Find all active assessments for this course
      const assessments = await this.em.find(
        Assessment,
        {
          course: course._id,
          isActive: true,
        },
        { populate: ['questions'] }
      );

      for (const assessment of assessments) {
        // Check if assessment is within available dates
        if (assessment.availableFrom && now < assessment.availableFrom) {
          continue; // Not available yet
        }
        if (assessment.availableUntil && now > assessment.availableUntil) {
          continue; // Expired
        }

        // Count attempts
        const attemptsCount = await this.em.count(AssessmentAttempt, {
          student: new ObjectId(studentId),
          assessment: assessment._id,
        });

        // Check if has attempts remaining
        const hasAttemptsRemaining =
          !assessment.maxAttempts || attemptsCount < assessment.maxAttempts;
        if (!hasAttemptsRemaining) {
          continue; // No attempts left
        }

        // Find best attempt
        const bestAttempts = await this.em.find(
          AssessmentAttempt,
          {
            student: new ObjectId(studentId),
            assessment: assessment._id,
            status: AttemptStatus.SUBMITTED,
          },
          { orderBy: { score: 'DESC' }, limit: 1 }
        );

        const bestAttempt = bestAttempts[0];
        const hasPassed = bestAttempt && bestAttempt.passed;

        // Skip if already passed
        if (hasPassed) {
          continue;
        }

        // Add to pending list
        pendingAssessments.push({
          assessment,
          course,
          attemptsCount,
          attemptsRemaining: assessment.maxAttempts
            ? assessment.maxAttempts - attemptsCount
            : null,
          bestScore: bestAttempt?.score,
          lastAttemptDate: bestAttempt?.submittedAt,
        });
      }
    }

    // Sort by availableUntil (most urgent first)
    pendingAssessments.sort((a, b) => {
      if (!a.assessment.availableUntil) return 1;
      if (!b.assessment.availableUntil) return -1;
      return (
        a.assessment.availableUntil.getTime() -
        b.assessment.availableUntil.getTime()
      );
    });

    this.logger.info(
      { count: pendingAssessments.length },
      'Found pending assessments.'
    );
    return pendingAssessments;
  }

  /**
   * Saves multiple answers for an attempt (auto-save functionality).
   * @param {string} attemptId - The attempt ID.
   * @param {Array} answers - Array of answers to save.
   * @returns {Promise<void>}
   */
  public async saveMultipleAnswers(
    attemptId: string,
    answers: Array<{ questionId: string; answer: string | number }>
  ): Promise<void> {
    this.logger.info(
      { attemptId, answersCount: answers.length },
      'Saving multiple answers.'
    );

    const attempt = await this.em.findOneOrFail(AssessmentAttempt, {
      _id: new ObjectId(attemptId),
    });

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error('Attempt is not in progress.');
    }

    // Save each answer
    for (const answerData of answers) {
      await this.submitAnswer({
        attemptId,
        questionId: answerData.questionId,
        answer: answerData.answer,
      });
    }

    this.logger.info({ attemptId }, 'Multiple answers saved successfully.');
  }

  /**
   * Gets detailed assessment info for a student including their progress.
   * @param {string} assessmentId - The assessment ID.
   * @param {string} studentId - The student ID.
   * @returns {Promise<any>} Assessment with student metadata.
   */
  public async getAssessmentWithStudentMetadata(
    assessmentId: string,
    studentId: string
  ): Promise<any> {
    this.logger.info(
      { assessmentId, studentId },
      'Getting assessment with student metadata.'
    );

    const assessment = await this.findOne(assessmentId);

    const assessmentPOJO = wrap(assessment).toJSON();

    // Filter questions to remove correct answers (security)
    if (assessmentPOJO.questions) {
      assessmentPOJO.questions = this.filterQuestionsForStudent(
        assessment.questions.getItems()
      );
    }

    // Count attempts
    const attemptsCount = await this.em.count(AssessmentAttempt, {
      student: new ObjectId(studentId),
      assessment: new ObjectId(assessmentId),
    });

    // Find best attempt
    const bestAttempts = await this.em.find(
      AssessmentAttempt,
      {
        student: new ObjectId(studentId),
        assessment: new ObjectId(assessmentId),
        status: AttemptStatus.SUBMITTED,
      },
      { orderBy: { score: 'DESC' }, limit: 1 }
    );

    const bestAttempt = bestAttempts[0];
    const now = new Date();

    // Determine status
    let status = 'available';
    if (assessment.availableUntil && now > assessment.availableUntil) {
      status = 'expired';
    } else if (bestAttempt && bestAttempt.passed) {
      status = 'completed';
    } else if (
      assessment.maxAttempts &&
      attemptsCount >= assessment.maxAttempts
    ) {
      status = 'no_attempts_left';
    }

    return {
      ...assessmentPOJO,
      attemptsCount,
      attemptsRemaining: assessment.maxAttempts
        ? assessment.maxAttempts - attemptsCount
        : null,
      bestScore: bestAttempt?.score,
      lastAttemptDate: bestAttempt?.submittedAt,
      status,
    };
  }

  /**
   * Get comprehensive statistics for an assessment.
   * Includes overall statistics and per-student breakdown.
   * @param {string} assessmentId - The ID of the assessment.
   * @returns {Promise<any>} Statistics object with aggregated data.
   */
  public async getAssessmentStatistics(assessmentId: string): Promise<any> {
    this.logger.info({ assessmentId }, 'Getting assessment statistics');

    const assessment = await this.em.findOne(
      Assessment,
      { _id: new ObjectId(assessmentId) },
      { populate: ['course', 'questions'] }
    );

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Get all attempts for this assessment
    const attempts = await this.em.find(
      AssessmentAttempt,
      {
        assessment: new ObjectId(assessmentId),
        status: AttemptStatus.SUBMITTED,
      },
      { populate: ['student', 'student.user'] }
    );

    const totalAttempts = attempts.length;

    // Get unique students
    const uniqueStudentIds = new Set(
      attempts.map((a) => (a.student as Student).id)
    );
    const uniqueStudents = uniqueStudentIds.size;

    // Calculate score statistics
    const scores = attempts.map((a) => a.score || 0);
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Calculate pass rate
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const passRate =
      totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

    // Group attempts by student
    const studentMap = new Map<
      string,
      {
        student: any;
        attempts: AssessmentAttempt[];
      }
    >();

    attempts.forEach((attempt) => {
      const student = attempt.student as Student;
      const studentId = student.id!;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student,
          attempts: [],
        });
      }
      studentMap.get(studentId)!.attempts.push(attempt);
    });

    // Build per-student statistics
    const attemptsByStudent = Array.from(studentMap.values()).map(
      ({ student, attempts: studentAttempts }) => {
        const sortedAttempts = studentAttempts.sort(
          (a, b) => (b.score || 0) - (a.score || 0)
        );
        const bestAttempt = sortedAttempts[0];
        const lastAttempt = studentAttempts.sort(
          (a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime()
        )[0];

        return {
          studentId: student.id,
          studentName: `${student.user.name} ${student.user.surname}`,
          attempts: studentAttempts.length,
          bestScore: bestAttempt?.score || 0,
          passed: bestAttempt?.passed || false,
          lastAttemptDate: lastAttempt?.submittedAt,
        };
      }
    );

    // Get all answers for question statistics
    const allAnswers = await this.em.find(
      AttemptAnswer,
      {
        attempt: {
          $in: attempts.map((a) => new ObjectId(a.id!)),
        },
      },
      { populate: ['question'] }
    );

    // Calculate per-question statistics
    const questionStatsMap = new Map<
      string,
      {
        question: Question;
        correctAnswers: number;
        totalAnswers: number;
      }
    >();

    allAnswers.forEach((answer) => {
      const question = answer.question as Question;
      const questionId = question.id!;

      if (!questionStatsMap.has(questionId)) {
        questionStatsMap.set(questionId, {
          question,
          correctAnswers: 0,
          totalAnswers: 0,
        });
      }

      const stats = questionStatsMap.get(questionId)!;
      stats.totalAnswers++;
      if (answer.isCorrect) {
        stats.correctAnswers++;
      }
    });

    const questionStatistics = Array.from(questionStatsMap.values()).map(
      ({ question, correctAnswers, totalAnswers }) => ({
        questionId: question.id,
        questionText: question.questionText,
        correctAnswers,
        totalAnswers,
        successRate:
          totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      })
    );

    return {
      assessmentId: assessment.id,
      title: assessment.title,
      totalAttempts,
      uniqueStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100) / 100,
      attemptsByStudent,
      questionStatistics,
    };
  }

  /**
   * Get all attempts for an assessment with optional filters (for professors).
   * @param {string} assessmentId - The ID of the assessment.
   * @param {object} filters - Optional filters for studentId, passed, sortBy, order.
   * @returns {Promise<any[]>} Array of attempts with student information.
   */
  public async getAllAttemptsForProfessor(
    assessmentId: string,
    filters?: {
      studentId?: string;
      passed?: boolean;
      sortBy?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<any[]> {
    this.logger.info(
      { assessmentId, filters },
      'Getting all attempts for professor'
    );

    // Build query
    const query: any = {
      assessment: new ObjectId(assessmentId),
      status: AttemptStatus.SUBMITTED,
    };

    if (filters?.studentId) {
      query.student = new ObjectId(filters.studentId);
    }

    if (filters?.passed !== undefined) {
      query.passed = filters.passed;
    }

    // Fetch attempts
    const attempts = await this.em.find(AssessmentAttempt, query, {
      populate: ['student', 'student.user', 'assessment'],
    });

    // Format results
    const results = attempts.map((attempt) => {
      const student = attempt.student as Student;
      const assessment = attempt.assessment as Assessment;

      return {
        id: attempt.id,
        student: {
          id: student.id,
          name: student.user.name,
          surname: student.user.surname,
        },
        assessment: {
          id: assessment.id,
          title: assessment.title,
        },
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        passed: attempt.passed,
        status: attempt.status,
        timeSpent: attempt.timeSpent,
        attemptNumber: attempt.attemptNumber,
      };
    });

    // Sort results
    if (filters?.sortBy) {
      const sortBy = filters.sortBy as keyof (typeof results)[0];
      const order = filters.order || 'desc';

      results.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (aVal === undefined || bVal === undefined) return 0;

        if (order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    } else {
      // Default sort by submittedAt desc
      results.sort((a, b) => {
        const aTime = a.submittedAt?.getTime() || 0;
        const bTime = b.submittedAt?.getTime() || 0;
        return bTime - aTime;
      });
    }

    return results;
  }

  /**
   * Find all reviews for a specific course. Public and easy to use.
   */
  public async findAllByCourse(courseId: string): Promise<Assessment[]> {
    this.logger.info({ courseId }, 'Fetching all assessments for a specific course.');
    return this.em.find(Assessment, { course: new ObjectId(courseId) }, {
        populate: ['course', 'questions'],
    });
  }

  /**
   * Notifies all enrolled students about a new assessment.
   * @private
   */
  private async notifyStudentsAboutNewAssessment(
    assessment: Assessment,
    course: Course
  ): Promise<void> {
    try {
      const enrollmentService = new EnrollementService(this.em, this.logger);
      const enrollments = await enrollmentService.findByCourse(course.id!);

      if (enrollments.length === 0) {
        this.logger.info({ courseId: course.id }, 'No enrolled students to notify');
        return;
      }

      const frontendUrl = process.env.NGROK_FRONTEND_URL || 'http://localhost:5173';
      
      // Send emails to all enrolled students
      const emailPromises = enrollments.map(async (enrollment) => {
        // Populate the student.user relationship to get the User entity
        await this.em.populate(enrollment, ['student.user']);
        const student = enrollment.student as Student;
        const user = student.user;
        
        if (!user) {
          this.logger.warn({ studentId: student.id }, 'User not found for student');
          return;
        }

        return this.emailService.sendNewAssessmentEmail({
          recipientEmail: user.mail,
          recipientName: user.name,
          courseName: course.name,
          assessmentTitle: assessment.title,
          availableFrom: assessment.availableFrom,
          availableUntil: assessment.availableUntil,
          assessmentUrl: `${frontendUrl}/courses/${course.id}/assessments/${assessment.id}`,
        });
      });

      const results = await Promise.allSettled(emailPromises);
      
      const failedEmails = results.filter(r => r.status === 'rejected').length;
      const successfulEmails = results.filter(r => r.status === 'fulfilled').length;
      
      this.logger.info(
        { 
          assessmentId: assessment.id, 
          courseId: course.id,
          total: enrollments.length,
          successful: successfulEmails,
          failed: failedEmails
        },
        'Finished sending new assessment notifications'
      );
    } catch (error: any) {
      this.logger.error(
        { err: error, assessmentId: assessment.id, courseId: course.id },
        'Error notifying students about new assessment'
      );
    }
  }
}
