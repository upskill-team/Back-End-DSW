/**
 * @module Models/Assessment/Controller
 * @remarks Handles HTTP requests for the Assessment module.
 * @see {@link AssessmentService} for business logic.
 */
import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { AssessmentService } from './assessment.services.js';
import { HttpResponse } from '../../shared/response/http.response.js';

/**
 * Handles the creation of a new assessment.
 * @param {Request} req - The Express request object, with assessment data in the body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The newly created assessment.
 */
async function create(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const newAssessment = await assessmentService.create(req.body);
  return HttpResponse.Created(res, newAssessment);
}

/**
 * Handles the retrieval of all assessments, optionally filtered by course.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A list of assessments.
 */
async function findAll(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const { courseId } = req.query;
  const assessments = await assessmentService.findAll(
    courseId as string | undefined
  );
  return HttpResponse.Ok(res, assessments);
}

/**
 * Handles the retrieval of a single assessment by ID.
 * @param {Request} req - The Express request object, containing the assessment ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The requested assessment data.
 */
async function findOne(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { id } = req.params;
    const assessment = await assessmentService.findOne(id);
    return HttpResponse.Ok(res, assessment);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Assessment not found.');
    }
    throw error;
  }
}

/**
 * Handles updating an existing assessment.
 * @param {Request} req - The Express request object, with assessment data in the body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The updated assessment.
 */
async function update(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const { id } = req.params;
  const updatedAssessment = await assessmentService.update(id, req.body);
  return HttpResponse.Ok(res, updatedAssessment);
}

/**
 * Handles the deletion of an assessment.
 * @param {Request} req - The Express request object, containing the assessment ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} A success message.
 */
async function remove(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const { id } = req.params;
  await assessmentService.remove(id);
  return HttpResponse.Ok(res, { message: 'Assessment deleted successfully.' });
}

/**
 * Handles starting a new assessment attempt for a student.
 * @param {Request} req - The Express request object, with attempt data in the body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The newly created attempt.
 */
async function startAttempt(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const attempt = await assessmentService.startAttempt(req.body);
  return HttpResponse.Created(res, attempt);
}

/**
 * Handles submitting a single answer during an attempt.
 * @param {Request} req - The Express request object, with answer data in the body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The created/updated answer.
 */
async function submitAnswer(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const answer = await assessmentService.submitAnswer(req.body);
  return HttpResponse.Ok(res, answer);
}

/**
 * Handles submitting all answers and completing an attempt.
 * @param {Request} req - The Express request object, with all answers in the body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The completed attempt with score.
 */
async function submitAttempt(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const completedAttempt = await assessmentService.submitAttempt(req.body);
  return HttpResponse.Ok(res, completedAttempt);
}

/**
 * Handles retrieving all attempts for a specific assessment.
 * @param {Request} req - The Express request object, containing the assessment ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Array of attempts for the assessment.
 */
async function getAttemptsByAssessment(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const { assessmentId } = req.params;
  const attempts = await assessmentService.getAttemptsByAssessment(
    assessmentId
  );
  return HttpResponse.Ok(res, attempts);
}

/**
 * Handles retrieving all attempts by a specific student.
 * @param {Request} req - The Express request object, containing the student ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Array of attempts by the student.
 */
async function getAttemptsByStudent(req: Request, res: Response) {
  const assessmentService = new AssessmentService(orm.em.fork(), req.log);
  const { studentId } = req.params;
  const attempts = await assessmentService.getAttemptsByStudent(studentId);
  return HttpResponse.Ok(res, attempts);
}

/**
 * Handles retrieving a single attempt with all its answers.
 * @param {Request} req - The Express request object, containing the attempt ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The attempt with all answers.
 */
async function getAttemptWithAnswers(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { attemptId } = req.params;
    const attempt = await assessmentService.getAttemptWithAnswers(attemptId);
    return HttpResponse.Ok(res, attempt);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Attempt not found.');
    }
    throw error;
  }
}

export {
  create,
  findAll,
  findOne,
  update,
  remove,
  startAttempt,
  submitAnswer,
  submitAttempt,
  getAttemptsByAssessment,
  getAttemptsByStudent,
  getAttemptWithAnswers,
};
