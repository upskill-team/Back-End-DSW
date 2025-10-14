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
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const userId = req.user!.id;

    // Get student ID from user ID
    const { getStudentIdFromUserId } = await import(
      '../../shared/utils/student.helper.js'
    );
    const studentId = await getStudentIdFromUserId(orm.em.fork(), userId);

    // Get assessmentId from params (if using new route) or body (legacy)
    const assessmentId = req.params.assessmentId || req.body.assessmentId;

    if (!assessmentId) {
      return HttpResponse.BadRequest(res, 'assessmentId is required');
    }

    const attempt = await assessmentService.startAttempt({
      assessmentId,
      studentId,
    });

    return HttpResponse.Created(res, {
      id: attempt.id,
      assessment: assessmentId,
      student: studentId,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      passed: attempt.passed,
      answers: [],
      status: attempt.status,
      timeSpent: 0,
    });
  } catch (error: any) {
    req.log.error({ error }, 'Error starting attempt');
    if (
      error.message.includes('not yet available') ||
      error.message.includes('no longer available') ||
      error.message.includes('not active') ||
      error.message.includes('Maximum number')
    ) {
      return HttpResponse.BadRequest(res, error.message);
    }
    throw error;
  }
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

/**
 * Handles listing pending assessments for a student.
 * @param {Request} req - The Express request object, containing the student ID in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Array of pending assessments.
 */
async function getPendingAssessments(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { studentId } = req.params;

    // TODO: Verify user can only see their own pending assessments
    // For now, assuming studentId is derived from userId

    const pendingAssessments = await assessmentService.findPendingAssessments(
      studentId
    );

    // Format response
    const result = pendingAssessments.map(
      ({ assessment, course, attemptsRemaining }) => ({
        id: assessment.id,
        title: assessment.title,
        course: {
          id: course.id,
          name: course.name,
          imageUrl: (course as any).imageUrl || null,
        },
        description: assessment.description,
        duration: assessment.durationMinutes,
        availableUntil: assessment.availableUntil,
        passingScore: assessment.passingScore,
        questionsCount: assessment.questions.length,
        attemptsRemaining,
        maxAttempts: assessment.maxAttempts,
        status: 'available',
      })
    );

    return HttpResponse.Ok(res, result);
  } catch (error: any) {
    req.log.error({ error }, 'Error getting pending assessments');
    if (error.message === 'User is not a student') {
      return HttpResponse.Unauthorized(res, 'Access denied');
    }
    throw error;
  }
}

/**
 * Handles listing assessments for a specific course with student metadata.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Array of assessments with student metadata.
 */
async function getAssessmentsByCourse(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;

    // Get student ID from user ID
    const { getStudentIdFromUserId } = await import(
      '../../shared/utils/student.helper.js'
    );
    let studentId: string | null = null;
    try {
      studentId = await getStudentIdFromUserId(orm.em.fork(), userId);
    } catch {
      // User is not a student (e.g., professor)
      // Return assessments with questions for professor view
      const assessments = await assessmentService.findAll(courseId);
      const serializedAssessments = assessments.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        maxAttempts: assessment.maxAttempts,
        isActive: assessment.isActive,
        availableFrom: assessment.availableFrom,
        availableUntil: assessment.availableUntil,
        questionsCount: assessment.questions.length,
        questions: assessment.questions.getItems().map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          options: q.options,
        })),
      }));
      return HttpResponse.Ok(res, serializedAssessments);
    }

    // Get assessments for the course with student metadata
    const assessments = await assessmentService.findAll(courseId);

    // Add student metadata to each assessment
    const assessmentsWithMetadata = await Promise.all(
      assessments.map(async (assessment) => {
        const metadata =
          await assessmentService.getAssessmentWithStudentMetadata(
            assessment.id!,
            studentId
          );

        return {
          id: metadata.id,
          title: metadata.title,
          description: metadata.description,
          duration: metadata.durationMinutes,
          passingScore: metadata.passingScore,
          availableUntil: metadata.availableUntil,
          questionsCount: metadata.questions.length,
          attemptsCount: metadata.attemptsCount,
          maxAttempts: metadata.maxAttempts,
          attemptsRemaining: metadata.attemptsRemaining,
          bestScore: metadata.bestScore,
          lastAttemptDate: metadata.lastAttemptDate,
          status: metadata.status,
        };
      })
    );

    return HttpResponse.Ok(res, assessmentsWithMetadata);
  } catch (error: any) {
    req.log.error({ error }, 'Error getting assessments by course');
    throw error;
  }
}

/**
 * Handles saving multiple answers for an attempt (auto-save).
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Success response.
 */
async function saveAnswers(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { attemptId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return HttpResponse.BadRequest(res, 'answers array is required');
    }

    await assessmentService.saveMultipleAnswers(attemptId, answers);

    return HttpResponse.Ok(res, {
      id: attemptId,
      status: 'in_progress',
      answersCount: answers.length,
      lastSavedAt: new Date(),
    });
  } catch (error: any) {
    req.log.error({ error }, 'Error saving answers');
    if (error.message === 'Attempt is not in progress.') {
      return HttpResponse.BadRequest(res, error.message);
    }
    throw error;
  }
}

/**
 * Get comprehensive statistics for an assessment (professors only).
 * @param {Request} req - The Express request object with assessmentId in params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Statistics for the assessment.
 */
async function getAssessmentStatistics(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { assessmentId } = req.params;

    const statistics = await assessmentService.getAssessmentStatistics(
      assessmentId
    );
    return HttpResponse.Ok(res, statistics);
  } catch (error: any) {
    req.log.error({ error }, 'Error getting assessment statistics');
    if (error.message === 'Assessment not found') {
      return HttpResponse.NotFound(res, error.message);
    }
    throw error;
  }
}

/**
 * Get all attempts for an assessment with optional filters (professors only).
 * @param {Request} req - The Express request object with assessmentId in params and optional query params.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} Array of all attempts with student information.
 */
async function getAllAttemptsForProfessor(req: Request, res: Response) {
  try {
    const assessmentService = new AssessmentService(orm.em.fork(), req.log);
    const { assessmentId } = req.params;
    const { studentId, passed, sortBy, order } = req.query;

    const filters: any = {};
    if (studentId) filters.studentId = studentId as string;
    if (passed !== undefined) filters.passed = passed === 'true';
    if (sortBy) filters.sortBy = sortBy as string;
    if (order) filters.order = order as 'asc' | 'desc';

    const attempts = await assessmentService.getAllAttemptsForProfessor(
      assessmentId,
      filters
    );

    return HttpResponse.Ok(res, attempts);
  } catch (error: any) {
    req.log.error({ error }, 'Error getting all attempts for professor');
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
  getPendingAssessments,
  getAssessmentsByCourse,
  saveAnswers,
  getAssessmentStatistics,
  getAllAttemptsForProfessor,
};
