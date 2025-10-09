/**
 * @module Models/Assessment/Service
 * @remarks Encapsulates the business logic for managing assessments.
 */

import { EntityManager } from '@mikro-orm/core';
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
  StartAttemptType,
  SubmitAnswerType,
  SubmitAttemptType,
} from './assessment.schemas.js';

/**
 * Provides methods for CRUD operations on Assessment entities.
 * @class AssessmentService
 */
export class AssessmentService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'AssessmentService' } });
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
    return assessment;
  }

  /**
   * Retrieves all assessments, optionally filtered by course.
   * @param {string} [courseId] - Optional course ID to filter by.
   * @returns {Promise<Assessment[]>} Array of assessments.
   */
  public async findAll(courseId?: string): Promise<Assessment[]> {
    this.logger.info({ courseId }, 'Fetching all assessments.');

    const filter = courseId ? { course: new ObjectId(courseId) } : {};

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
   * Starts a new attempt for a student on an assessment.
   * @param {StartAttemptType} data - The attempt start data.
   * @returns {Promise<AssessmentAttempt>} The created attempt.
   */
  public async startAttempt(
    data: StartAttemptType
  ): Promise<AssessmentAttempt> {
    this.logger.info({ data }, 'Starting assessment attempt.');

    const { assessmentId, studentId } = data;

    const assessment = await this.em.findOneOrFail(
      Assessment,
      { _id: new ObjectId(assessmentId) },
      { populate: ['questions'] }
    );

    const student = await this.em.findOneOrFail(Student, {
      _id: new ObjectId(studentId),
    });

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

    this.logger.info(
      { attemptId: attempt.id },
      'Assessment attempt started successfully.'
    );
    return attempt;
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
    assessmentId: string
  ): Promise<AssessmentAttempt[]> {
    this.logger.info({ assessmentId }, 'Fetching attempts for assessment.');

    return this.em.find(
      AssessmentAttempt,
      { assessment: new ObjectId(assessmentId) },
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
  ): Promise<AssessmentAttempt & { answers: AttemptAnswer[] }> {
    this.logger.info({ attemptId }, 'Fetching attempt with answers.');

    const attempt = await this.em.findOneOrFail(
      AssessmentAttempt,
      { _id: new ObjectId(attemptId) },
      { populate: ['assessment', 'assessment.questions', 'student'] }
    );

    const answers = await this.em.find(
      AttemptAnswer,
      { attempt: attempt._id },
      { populate: ['question'] }
    );

    return Object.assign(attempt, { answers });
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
}
