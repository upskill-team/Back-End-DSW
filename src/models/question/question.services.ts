/**
 * @module Models/Question/Service
 * @remarks Encapsulates the business logic for managing questions.
 */

import { EntityManager } from '@mikro-orm/core';
import { Question } from './question.entity.js';
import { CreateQuestionType, UpdateQuestionType } from './question.schemas.js';
import { Course } from '../course/course.entity.js';
import { Logger } from 'pino';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Provides methods for CRUD operations on Question entities.
 * @class QuestionService
 */
export class QuestionService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'QuestionService' } });
  }

  /**
   * Creates a new question for a specific course.
   * @param {CreateQuestionType} questionData - The validated data for the new question.
   * @param {string} courseId - The ID of the course the question belongs to.
   * @param {string} professorId - The ID of the professor creating the question.
   * @returns {Promise<Question>} A promise that resolves to the newly created question.
   */
  async create(
    questionData: CreateQuestionType,
    courseId: string,
    professorId: string
  ): Promise<Question> {
    this.logger.info({ courseId, professorId }, 'Creating new question');

    // Validate that the course exists and belongs to the professor in a single query
    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const question = new Question();
    question.questionText = questionData.questionText;
    question.questionType = questionData.questionType;
    question.payload = questionData.payload;
    question.course = course;

    await this.em.persistAndFlush(question);

    this.logger.info(
      { questionId: question._id },
      'Question created successfully'
    );
    return question;
  }

  /**
   * Retrieves all questions for a specific course.
   * @param {string} courseId - The ID of the course.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Question[]>} A promise that resolves to an array of questions.
   */
  async findByCourse(
    courseId: string,
    professorId: string
  ): Promise<Question[]> {
    this.logger.info({ courseId, professorId }, 'Finding questions by course');

    await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const questions = await this.em.find(
      Question,
      { course: new ObjectId(courseId) },
      { populate: ['course'] }
    );

    this.logger.info(
      { courseId, count: questions.length },
      'Questions retrieved for course'
    );
    return questions;
  }

  /**
   * Retrieves all questions created by a professor across all their courses.
   * @param {string} professorId - The ID of the professor.
   * @returns {Promise<Question[]>} A promise that resolves to an array of questions.
   */
  async findByProfessor(professorId: string): Promise<Question[]> {
    this.logger.info({ professorId }, 'Finding all questions by professor');

    const professorCourses = await this.em.find(Course, {
      professor: new ObjectId(professorId),
    });

    if (professorCourses.length === 0) {
      return [];
    }

    const courseIds = professorCourses
      .map((course) => course._id)
      .filter((id) => id !== undefined);

    const questions = await this.em.find(
      Question,
      { course: { $in: courseIds as ObjectId[] } },
      { populate: ['course'] }
    );

    this.logger.info(
      { professorId, questionCount: questions.length },
      'Professor questions retrieved'
    );
    return questions;
  }

  /**
   * Retrieves a single question by its ID.
   * @param {string} questionId - The ID of the question to retrieve.
   * @param {string} courseId - The ID of the course (for access control).
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Question>} A promise that resolves to the question.
   */
  async findOne(
    questionId: string,
    courseId: string,
    professorId: string
  ): Promise<Question> {
    this.logger.info(
      { questionId, courseId, professorId },
      'Finding single question'
    );

    await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const question = await this.em.findOneOrFail(
      Question,
      {
        _id: new ObjectId(questionId),
        course: new ObjectId(courseId),
      },
      { populate: ['course'] }
    );

    this.logger.info({ questionId }, 'Question found');
    return question;
  }

  /**
   * Updates an existing question.
   * @param {string} questionId - The ID of the question to update.
   * @param {UpdateQuestionType} updateData - The validated data for updating the question.
   * @param {string} courseId - The ID of the course (for access control).
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Question>} A promise that resolves to the updated question.
   */
  async update(
    questionId: string,
    updateData: UpdateQuestionType,
    courseId: string,
    professorId: string
  ): Promise<Question> {
    this.logger.info(
      { questionId, courseId, professorId },
      'Updating question'
    );

    await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const question = await this.em.findOneOrFail(Question, {
      _id: new ObjectId(questionId),
      course: new ObjectId(courseId),
    });

    if (updateData.questionText !== undefined) {
      question.questionText = updateData.questionText;
    }
    if (updateData.questionType !== undefined) {
      question.questionType = updateData.questionType;
    }
    if (updateData.payload !== undefined) {
      question.payload = updateData.payload;
    }

    await this.em.persistAndFlush(question);

    this.logger.info({ questionId }, 'Question updated successfully');
    return question;
  }

  /**
   * Removes a question from the database.
   * @param {string} questionId - The ID of the question to remove.
   * @param {string} courseId - The ID of the course (for access control).
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<void>} A promise that resolves when the question is removed.
   */
  async remove(
    questionId: string,
    courseId: string,
    professorId: string
  ): Promise<void> {
    this.logger.info(
      { questionId, courseId, professorId },
      'Removing question'
    );

    await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const question = await this.em.findOneOrFail(Question, {
      _id: new ObjectId(questionId),
      course: new ObjectId(courseId),
    });

    await this.em.removeAndFlush(question);

    this.logger.info({ questionId }, 'Question removed successfully');
  }
}
