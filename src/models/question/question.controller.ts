/**
 * @module Models/Question/Controller
 * @remarks Handles HTTP requests for the Question module.
 * @see {@link QuestionService} for business logic.
 */

import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { QuestionService } from './question.services.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { CreateQuestionType, UpdateQuestionType } from './question.schemas.js';

/**
 * Handles the creation of a new question for a specific course.
 * @param {Request} req - The Express request object, with question data in the body and course ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The newly created question.
 */
async function add(req: Request, res: Response) {
  const questionService = new QuestionService(orm.em.fork(), req.log);
  const { courseId } = req.params;
  const professorId = req.user!.id;
  const questionData = req.body as CreateQuestionType;

  const newQuestion = await questionService.create(
    questionData,
    courseId,
    professorId
  );

  return HttpResponse.Created(res, newQuestion);
}

/**
 * Handles the retrieval of questions for a specific course.
 * @param {Request} req - The Express request object, containing the course ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of questions for the course.
 */
async function findByCourse(req: Request, res: Response) {
  const questionService = new QuestionService(orm.em.fork(), req.log);
  const { courseId } = req.params;
  const professorId = req.user!.id;

  const questions = await questionService.findByCourse(courseId, professorId);

  return HttpResponse.Ok(res, questions);
}

/**
 * Handles the retrieval of all questions created by the authenticated professor.
 * @param {Request} req - The Express request object, containing the user payload from auth.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of the professor's questions.
 */
async function findMyQuestions(req: Request, res: Response) {
  const questionService = new QuestionService(orm.em.fork(), req.log);
  const professorId = req.user!.id;

  const questions = await questionService.findByProfessor(professorId);

  return HttpResponse.Ok(res, questions);
}

/**
 * Handles the retrieval of a single question by its ID.
 * @param {Request} req - The Express request object, containing the question ID and course ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The requested question data.
 */
async function findOne(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { id, courseId } = req.params;
    const professorId = req.user!.id;

    const question = await questionService.findOne(id, courseId, professorId);

    return HttpResponse.Ok(res, question);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Question not found.');
    }
    throw error;
  }
}

/**
 * Handles updating an existing question.
 * @param {Request} req - The Express request object, with question ID and course ID in params and update data in body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The updated question data.
 */
async function update(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { id, courseId } = req.params;
    const professorId = req.user!.id;
    const updateData = req.body as UpdateQuestionType;

    const updatedQuestion = await questionService.update(
      id,
      updateData,
      courseId,
      professorId
    );

    return HttpResponse.Ok(res, updatedQuestion);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Question not found.');
    }
    throw error;
  }
}

/**
 * Handles the deletion of a question.
 * @param {Request} req - The Express request object, with question ID and course ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A confirmation message.
 */
async function remove(req: Request, res: Response) {
  const questionService = new QuestionService(orm.em.fork(), req.log);
  const { id, courseId } = req.params;
  const professorId = req.user!.id;

  await questionService.remove(id, courseId, professorId);

  return HttpResponse.Ok(res, { message: 'Question deleted successfully' });
}

export { add, findByCourse, findMyQuestions, findOne, update, remove };
