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

    // If unitNumber is specified, validate that the unit exists in the course
    if (questionData.unitNumber !== undefined) {
      const unitExists = course.units.some(
        (unit) => unit.unitNumber === questionData.unitNumber
      );
      if (!unitExists) {
        throw new Error(
          `Unit ${questionData.unitNumber} not found in course ${courseId}`
        );
      }

      // Add question reference to the unit
      const unit = course.units.find(
        (u) => u.unitNumber === questionData.unitNumber
      );
      if (unit) {
        // We'll add the question reference after creating the question
      }
    }

    const question = new Question();
    question.questionText = questionData.questionText;
    question.questionType = questionData.questionType;
    question.payload = questionData.payload;
    question.course = course;
    question.unitNumber = questionData.unitNumber;

    await this.em.persistAndFlush(question);

    // If it's a unit question, add the reference to the unit
    if (questionData.unitNumber !== undefined && question._id) {
      const unit = course.units.find(
        (u) => u.unitNumber === questionData.unitNumber
      );
      if (unit) {
        unit.questions.push(question._id);
        await this.em.persistAndFlush(course);
      }
    }

    this.logger.info(
      { questionId: question._id, unitNumber: questionData.unitNumber },
      'Question created successfully'
    );
    return question;
  }

  /**
   * Retrieves all questions for a specific course.
   * This includes:
   * - Questions assigned to specific units (with unitNumber)
   * - General questions not assigned to any unit (unitNumber is null/undefined)
   * @param {string} courseId - The ID of the course.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Question[]>} A promise that resolves to an array of all questions for the course.
   */
  async findByCourse(
    courseId: string,
    professorId: string
  ): Promise<Question[]> {
    this.logger.info(
      { courseId, professorId },
      'Finding all questions for course'
    );

    await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const questions = await this.em.find(
      Question,
      {
        course: new ObjectId(courseId),
      },
      { populate: ['course'] }
    );

    this.logger.info(
      { courseId, count: questions.length },
      'All questions retrieved for course'
    );
    return questions;
  }

  /**
   * Retrieves all questions for a specific unit within a course.
   * @param {string} courseId - The ID of the course.
   * @param {number} unitNumber - The number of the unit.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Question[]>} A promise that resolves to an array of questions.
   */
  async findByUnit(
    courseId: string,
    unitNumber: number,
    professorId: string
  ): Promise<Question[]> {
    this.logger.info(
      { courseId, unitNumber, professorId },
      'Finding questions by unit'
    );

    // Validate that the course exists and belongs to the professor
    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    // Validate that the unit exists in the course
    const unitExists = course.units.some(
      (unit) => unit.unitNumber === unitNumber
    );
    if (!unitExists) {
      throw new Error(`Unit ${unitNumber} not found in course ${courseId}`);
    }

    const questions = await this.em.find(
      Question,
      {
        course: new ObjectId(courseId),
        unitNumber: unitNumber,
      },
      { populate: ['course'] }
    );

    this.logger.info(
      { courseId, unitNumber, count: questions.length },
      'Unit questions retrieved successfully'
    );
    return questions;
  }

  /**
   * Retrieves general questions for a course (not assigned to any specific unit).
   * These are questions created for assessments or general course use.
   * @param {string} courseId - The ID of the course.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Question[]>} A promise that resolves to an array of general questions.
   */
  async findGeneralQuestions(
    courseId: string,
    professorId: string
  ): Promise<Question[]> {
    this.logger.info(
      { courseId, professorId },
      'Finding general questions (no unit assigned)'
    );

    await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const questions = await this.em.find(
      Question,
      {
        course: new ObjectId(courseId),
        unitNumber: null,
      },
      { populate: ['course'] }
    );

    this.logger.info(
      { courseId, count: questions.length },
      'General questions retrieved successfully'
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
   * @param {string | null} professorId - The ID of the professor (for access control). If null, only validates course exists.
   * @returns {Promise<Question>} A promise that resolves to the question.
   */
  async findOne(
    questionId: string,
    courseId: string,
    professorId: string | null
  ): Promise<Question> {
    this.logger.info(
      { questionId, courseId, professorId },
      'Finding single question'
    );

    // If professorId is provided, validate course ownership
    if (professorId) {
      await this.em.findOneOrFail(Course, {
        _id: new ObjectId(courseId),
        professor: new ObjectId(professorId),
      });
    } else {
      // If no professorId (student access), just verify course exists
      await this.em.findOneOrFail(Course, {
        _id: new ObjectId(courseId),
      });
    }

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

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const question = await this.em.findOneOrFail(Question, {
      _id: new ObjectId(questionId),
      course: new ObjectId(courseId),
    });

    // Handle unit number changes
    if (updateData.unitNumber !== undefined) {
      // If changing to a unit question, validate the unit exists
      if (updateData.unitNumber !== null) {
        const unitExists = course.units.some(
          (unit) => unit.unitNumber === updateData.unitNumber
        );
        if (!unitExists) {
          throw new Error(
            `Unit ${updateData.unitNumber} not found in course ${courseId}`
          );
        }
      }

      // Remove from old unit if it was unit-specific
      if (question.unitNumber !== null && question.unitNumber !== undefined) {
        const oldUnit = course.units.find(
          (u) => u.unitNumber === question.unitNumber
        );
        if (oldUnit && question._id) {
          const questionIndex = oldUnit.questions.findIndex((qId) =>
            qId.equals(question._id!)
          );
          if (questionIndex > -1) {
            oldUnit.questions.splice(questionIndex, 1);
          }
        }
      }

      // Add to new unit if specified
      if (updateData.unitNumber !== null && question._id) {
        const newUnit = course.units.find(
          (u) => u.unitNumber === updateData.unitNumber
        );
        if (newUnit) {
          newUnit.questions.push(question._id);
        }
      }

      question.unitNumber = updateData.unitNumber;
    }

    if (updateData.questionText !== undefined) {
      question.questionText = updateData.questionText;
    }
    if (updateData.questionType !== undefined) {
      question.questionType = updateData.questionType;
    }
    if (updateData.payload !== undefined) {
      question.payload = updateData.payload;
    }

    await this.em.persistAndFlush([question, course]);

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

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const question = await this.em.findOneOrFail(Question, {
      _id: new ObjectId(questionId),
      course: new ObjectId(courseId),
    });

    // Remove question reference from unit if it exists
    if (
      question.unitNumber !== null &&
      question.unitNumber !== undefined &&
      question._id
    ) {
      const unit = course.units.find(
        (u) => u.unitNumber === question.unitNumber
      );
      if (unit) {
        const questionIndex = unit.questions.findIndex((qId) =>
          qId.equals(question._id!)
        );
        if (questionIndex > -1) {
          unit.questions.splice(questionIndex, 1);
          await this.em.persistAndFlush(course);
        }
      }
    }

    await this.em.removeAndFlush(question);

    this.logger.info({ questionId }, 'Question removed successfully');
  }
}
