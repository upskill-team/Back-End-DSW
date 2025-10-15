/**
 * @module Models/Course/Controller
 * @remarks Handles HTTP requests for the Course module.
 * @see {@link CourseService} for business logic.
 */
import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { CourseService } from './course.services.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { User } from '../user/user.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { SearchCoursesSchema } from './course.schemas.js';
import { NextFunction } from 'express';
import * as v from 'valibot';
import { getProfessorIdFromUserId } from '../../shared/utils/professor.helper.js';
/**
 * Handles the retrieval of courses for the currently authenticated professor.
 * @param {Request} req The Express request object, containing the user payload from auth.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A list of the professor's courses.
 */
async function findMyCourses(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);

  const userId = req.user!.id;

  const courses = await courseService.findCoursesOfProfessor(userId);

  return HttpResponse.Ok(res, courses);
}

/**
 * Handles the retrieval of all courses.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} A list of all courses.
 */
async function findAll(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);
  const courses = await courseService.findAll();
  return HttpResponse.Ok(res, courses);
}

/**
 * Handles the retrieval of a single course by its ID.
 * @param {Request} req The Express request object, containing the course ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The requested course data.
 */
async function findOne(req: Request, res: Response) {
  // This try...catch remains because it handles a specific error case (NotFoundError)
  // to return a 404, which is more specific than a generic 500. Check it
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { id } = req.params;
    const course = await courseService.findOne(id);
    return HttpResponse.Ok(res, course);
  } catch (error: any) {
    // Handle specific, expected errors locally.
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    throw error;
  }
}

/**
 * Handles the creation of a new course.
 * @param {Request} req The Express request object, with course data in the body and user info from auth.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The newly created course.
 */
async function add(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);
  const em = orm.em.fork();

  const userObjectId = new ObjectId(req.user!.id);

  const user = await em.findOne(
    User,
    { _id: userObjectId },
    { populate: ['professorProfile'] }
  );

  const professorId = user?.professorProfile?.id;
  if (!professorId) {
    return HttpResponse.Unauthorized(
      res,
      'The authenticated user is not a professor.'
    );
  }

  const imageUrl = req.file?.path;

  const newCourse = await courseService.create(req.body, professorId, imageUrl);
  return HttpResponse.Created(res, newCourse);
}

/**
 * Handles updating an existing course.
 * @param {Request} req The Express request object, with course ID in params and update data in body.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} The updated course data.
 */
async function update(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { id } = req.params;
    const userId = req.user!.id;

    const { courseData } = req.body;
    if (!courseData) {
      console.error("ERROR: No se encontró 'courseData' en req.body.");
      return HttpResponse.BadRequest(
        res,
        'No se proporcionaron los datos del curso (courseData).'
      );
    }
    const parsedData = JSON.parse(courseData);

    const files = (req.files as Express.Multer.File[]) || [];

    const imageFile = files.find((f) => f.fieldname === 'image');
    const materialFiles = files.filter((f) =>
      f.fieldname.startsWith('materials')
    );

    const imageUrl = imageFile?.path;

    const updatedCourse = await courseService.update(
      id,
      parsedData,
      userId,
      imageUrl,
      materialFiles
    );
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    console.log(
      'Error capturado en el controlador de actualización de curso:',
      error
    );
    if (error instanceof SyntaxError) {
      return HttpResponse.BadRequest(
        res,
        'El formato de courseData no es un JSON válido.'
      );
    }
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(
        res,
        'Curso no encontrado o no tienes permiso para editarlo.'
      );
    }
    if (error.message.startsWith('Validation failed:')) {
      return HttpResponse.BadRequest(
        res,
        JSON.parse(error.message.replace('Validation failed: ', ''))
      );
    }
    throw error;
  }
}

/**
 * Handles the deletion of a course.
 * @param {Request} req The Express request object, with course ID in params.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A confirmation message.
 */
async function remove(req: Request, res: Response) {
  const courseService = new CourseService(orm.em.fork(), req.log);
  const { id } = req.params;
  const userId = req.user!.id;
  await courseService.remove(id, userId);
  return HttpResponse.Ok(res, { message: 'Course deleted successfully' });
}

/**
 * Handles the retrieval of the top 4 trending courses.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The next middleware function.
 * @returns {Promise<Response>} A list of the top 4 courses.
 */
async function findTrending(req: Request, res: Response, next: NextFunction) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const courses = await courseService.findTrendingCourses();
    return HttpResponse.Ok(res, courses);
  } catch (error) {
    next(error);
  }
}

async function findAllWithPagination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const validatedQuery = v.parse(SearchCoursesSchema, req.query);

    const courseService = new CourseService(orm.em.fork(), req.log);
    const result = await courseService.searchCourses(validatedQuery);

    return HttpResponse.Ok(res, result);

  } catch (error) {
    if (error instanceof v.ValiError) {
      const errorDetails = error.issues.map((issue) => ({
        field: issue.path?.map((p: { key: any }) => p.key).join('.'),
        message: issue.message,
        receivedValue: issue.input,
      }));

   
      return HttpResponse.BadRequest(res, {
        message: 'Los parámetros de consulta son inválidos.',
        errors: errorDetails,
      });
    }

    next(error);
  }
}

/**
 * Handles the creation of a new unit in a course.
 * @param {Request} req The Express request object, with unit data in the body.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The updated course with the new unit.
 */
async function createUnit(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;
    const unitData = req.body;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const updatedCourse = await courseService.createUnit(
      courseId,
      unitData,
      professorId
    );
    return HttpResponse.Created(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    if (error.message.includes('already exists')) {
      return HttpResponse.BadRequest(res, error.message);
    }
    throw error;
  }
}

/**
 * Handles updating a specific unit in a course.
 * @param {Request} req The Express request object, with unit data in the body.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The updated course.
 */
async function updateUnit(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId, unitNumber } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const updatedCourse = await courseService.updateUnit(
      courseId,
      parseInt(unitNumber),
      updateData,
      professorId
    );
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    if (
      error.message.includes('not found') ||
      error.message.includes('already exists')
    ) {
      return HttpResponse.BadRequest(res, error.message);
    }
    throw error;
  }
}

/**
 * Handles deleting a specific unit from a course.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The updated course without the deleted unit.
 */
async function deleteUnit(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId, unitNumber } = req.params;
    const userId = req.user!.id;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const updatedCourse = await courseService.deleteUnit(
      courseId,
      parseInt(unitNumber),
      professorId
    );
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    if (error.message.includes('not found')) {
      return HttpResponse.NotFound(res, error.message);
    }
    throw error;
  }
}

/**
 * Handles reordering units within a course.
 * @param {Request} req The Express request object, with reorder data in the body.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The course with reordered units.
 */
async function reorderUnits(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;
    const reorderData = req.body;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const updatedCourse = await courseService.reorderUnits(
      courseId,
      reorderData,
      professorId
    );
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    throw error;
  }
}

/**
 * Handles uploading a material to a specific unit.
 * @param {Request} req The Express request object, with material data.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The updated course.
 */
async function uploadMaterial(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId, unitNumber } = req.params;
    const userId = req.user!.id;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    // Handle uploaded file
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return HttpResponse.BadRequest(res, 'No file uploaded');
    }

    const file = files[0];
    const materialData = {
      title: req.body.title || file.originalname,
      url: file.path,
    };

    const updatedCourse = await courseService.addMaterial(
      courseId,
      parseInt(unitNumber),
      materialData,
      professorId
    );
    return HttpResponse.Created(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    if (error.message.includes('not found')) {
      return HttpResponse.NotFound(res, error.message);
    }
    throw error;
  }
}

/**
 * Handles deleting a material from a specific unit.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The updated course.
 */
async function deleteMaterial(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId, unitNumber, materialIndex } = req.params;
    const userId = req.user!.id;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const updatedCourse = await courseService.removeMaterial(
      courseId,
      parseInt(unitNumber),
      parseInt(materialIndex),
      professorId
    );
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    if (
      error.message.includes('not found') ||
      error.message.includes('out of bounds')
    ) {
      return HttpResponse.BadRequest(res, error.message);
    }
    throw error;
  }
}

/**
 * Handles quick save operations.
 * @param {Request} req The Express request object, with quick save data in the body.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The updated course.
 */
async function quickSave(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork(), req.log);
    const { courseId } = req.params;
    const userId = req.user!.id;
    const quickSaveData = req.body;

    const professorId = await getProfessorIdFromUserId(orm.em.fork(), userId);

    const updatedCourse = await courseService.quickSave(
      courseId,
      quickSaveData,
      professorId
    );
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found or access denied.');
    }
    throw error;
  }
}

export {
  findAll,
  findOne,
  add,
  update,
  remove,
  findMyCourses,
  findTrending,
  findAllWithPagination,
  createUnit,
  updateUnit,
  deleteUnit,
  reorderUnits,
  uploadMaterial,
  deleteMaterial,
  quickSave,
};
