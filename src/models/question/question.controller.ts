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
import { getProfessorIdFromUserId } from '../../shared/utils/professor.helper.js';

/**
 * Handles the creation of a new question for a specific course.
 * @param {Request} req - The Express request object, with question data in the body and course ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The newly created question.
 */
async function add(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;
    const questionData = req.body as CreateQuestionType;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const newQuestion = await questionService.create(
      questionData,
      courseId,
      professorId
    );

    return HttpResponse.Created(res, newQuestion);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      // Check if it's a course not found or professor not found error
      if (error.message.includes('Course not found')) {
        return HttpResponse.NotFound(
          res,
          'Course not found or you do not have permission to add questions to this course.'
        );
      }
      return HttpResponse.NotFound(res, 'Resource not found.');
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the retrieval of questions for a specific course.
 * @param {Request} req - The Express request object, containing the course ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of questions for the course.
 */
async function findByCourse(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const questions = await questionService.findByCourse(courseId, professorId);

    return HttpResponse.Ok(res, questions);
  } catch (error: any) {
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the retrieval of all questions created by the authenticated professor.
 * @param {Request} req - The Express request object, containing the user payload from auth.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of the professor's questions.
 */
async function findMyQuestions(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const questions = await questionService.findByProfessor(professorId);

    return HttpResponse.Ok(res, questions);
  } catch (error: any) {
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
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
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const question = await questionService.findOne(id, courseId, professorId);

    return HttpResponse.Ok(res, question);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Question not found.');
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
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
    const userId = req.user!.id;
    const updateData = req.body as UpdateQuestionType;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

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
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
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
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { id, courseId } = req.params;
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    await questionService.remove(id, courseId, professorId);

    return HttpResponse.Ok(res, { message: 'Question deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the creation of a new question for a specific unit within a course.
 * @param {Request} req - The Express request object, with question data in the body and courseId + unitNumber in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The newly created question.
 */
async function addToUnit(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { courseId, unitNumber } = req.params;
    const userId = req.user!.id;
    const questionData = req.body as CreateQuestionType;

    // Ensure unitNumber is set in the question data
    questionData.unitNumber = parseInt(unitNumber);

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const newQuestion = await questionService.create(
      questionData,
      courseId,
      professorId
    );

    return HttpResponse.Created(res, newQuestion);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      if (error.message.includes('Course not found')) {
        return HttpResponse.NotFound(
          res,
          'Course not found or you do not have permission to add questions to this course.'
        );
      }
      return HttpResponse.NotFound(res, 'Resource not found.');
    }
    if (error.message.includes('Unit') && error.message.includes('not found')) {
      return HttpResponse.NotFound(res, error.message);
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the retrieval of general questions for a course (not assigned to any unit).
 * These are questions created for assessments or general course use.
 * @param {Request} req - The Express request object, containing the courseId in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of general questions for the course.
 */
async function findGeneralQuestions(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const questions = await questionService.findGeneralQuestions(
      courseId,
      professorId
    );

    return HttpResponse.Ok(res, questions);
  } catch (error: any) {
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the retrieval of questions for a specific unit within a course.
 * @param {Request} req - The Express request object, containing the courseId and unitNumber in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of questions for the unit.
 */
async function findByUnit(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { courseId, unitNumber } = req.params;
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const questions = await questionService.findByUnit(
      courseId,
      parseInt(unitNumber),
      professorId
    );

    return HttpResponse.Ok(res, questions);
  } catch (error: any) {
    if (error.message.includes('Unit') && error.message.includes('not found')) {
      return HttpResponse.NotFound(res, error.message);
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the retrieval of a single question by its ID from a specific unit.
 * @param {Request} req - The Express request object, containing the question ID, course ID, and unit number in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The requested question data.
 */
async function findOneFromUnit(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { id, courseId, unitNumber } = req.params;
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const question = await questionService.findOne(id, courseId, professorId);

    // Verify the question belongs to the specified unit
    if (question.unitNumber !== parseInt(unitNumber)) {
      return HttpResponse.NotFound(
        res,
        'Question not found in specified unit.'
      );
    }

    return HttpResponse.Ok(res, question);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Question not found.');
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles updating an existing question from a specific unit.
 * @param {Request} req - The Express request object, with question ID, course ID, and unit number in params and update data in body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The updated question data.
 */
async function updateFromUnit(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { id, courseId, unitNumber } = req.params;
    const userId = req.user!.id;
    const updateData = req.body as UpdateQuestionType;

    // Ensure unitNumber is preserved if not explicitly changed
    if (updateData.unitNumber === undefined) {
      updateData.unitNumber = parseInt(unitNumber);
    }

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

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
    if (error.message.includes('Unit') && error.message.includes('not found')) {
      return HttpResponse.NotFound(res, error.message);
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

/**
 * Handles the deletion of a question from a specific unit.
 * @param {Request} req - The Express request object, with question ID, course ID, and unit number in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A confirmation message.
 */
async function removeFromUnit(req: Request, res: Response) {
  try {
    const questionService = new QuestionService(orm.em.fork(), req.log);
    const { id, courseId, unitNumber } = req.params;
    const userId = req.user!.id;

    // Get the professor ID from the user ID
    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    // First verify the question belongs to the specified unit
    const question = await questionService.findOne(id, courseId, professorId);
    if (question.unitNumber !== parseInt(unitNumber)) {
      return HttpResponse.NotFound(
        res,
        'Question not found in specified unit.'
      );
    }

    await questionService.remove(id, courseId, professorId);

    return HttpResponse.Ok(res, { message: 'Question deleted successfully' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Question not found.');
    }
    if (error.message.includes('User does not have a professor profile')) {
      return HttpResponse.Unauthorized(
        res,
        'Access denied. User is not a professor.'
      );
    }
    if (error.message.includes('User not found')) {
      return HttpResponse.NotFound(res, 'User not found.');
    }
    throw error;
  }
}

export {
  add,
  findByCourse,
  findGeneralQuestions,
  findMyQuestions,
  findOne,
  update,
  remove,
  addToUnit,
  findByUnit,
  findOneFromUnit,
  updateFromUnit,
  removeFromUnit,
};
