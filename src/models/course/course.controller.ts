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
      console.error("ERROR: No se encontró 'courseData' en req.body.")
      return HttpResponse.BadRequest(res, "No se proporcionaron los datos del curso (courseData).");
    }
    const parsedData = JSON.parse(courseData);
    /*
    const validationResult = safeParse(UpdateCourseSchema, parsedData);
    if (!validationResult.success) {
      return HttpResponse.BadRequest(res, validationResult.issues);
    }
    const validatedData = validationResult.output;
    */
    const files = (req.files as Express.Multer.File[]) || []

    const imageFile = files.find(f => f.fieldname === 'image');
    const materialFiles = files.filter(f => f.fieldname.startsWith('materials'))
    
    const imageUrl = imageFile?.path;

    const updatedCourse = await courseService.update(id, parsedData, userId, imageUrl, materialFiles);
    return HttpResponse.Ok(res, updatedCourse);
    
  } catch (error: any) {
    console.log('Error capturado en el controlador de actualización de curso:', error);
    if (error instanceof SyntaxError) {
      return HttpResponse.BadRequest(res, "El formato de courseData no es un JSON válido.");
    }
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Curso no encontrado o no tienes permiso para editarlo.');
    }
    if (error.message.startsWith('Validation failed:')) {
      return HttpResponse.BadRequest(res, JSON.parse(error.message.replace('Validation failed: ', '')));
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

async function findAllWithPagination(req: Request, res: Response, next: NextFunction) {
  try {
    // --- 1. Validar y transformar los query params usando el schema de Valibot ---
    // v.parse lanzará un ValiError si la validación falla, que será capturado por el catch.
    const validatedQuery = v.parse(SearchCoursesSchema, req.query);

    // --- 2. Instanciar el servicio y ejecutar la lógica de negocio ---
    // Se pasa el objeto de consulta ya limpio y seguro al servicio.
    const courseService = new CourseService(orm.em.fork(), req.log);
    const result = await courseService.searchCourses(validatedQuery); // Asumiendo que el método se llama `search`

    // --- 3. Enviar la respuesta exitosa ---
    // Usamos tu helper HttpResponse para devolver un 200 OK con los datos.
    return HttpResponse.Ok(res, result);

  } catch (error) {
    // --- 4. Manejar errores de forma centralizada ---
    if (error instanceof v.ValiError) {
      // Si el error es de validación, es un error del cliente (400 Bad Request).
      const errorDetails = error.issues.map(issue => ({
        field: issue.path?.map((p: { key: any; }) => p.key).join('.'),
        message: issue.message,
        receivedValue: issue.input,
      }));
      
      // Devolvemos una respuesta clara y estructurada.
      return HttpResponse.BadRequest(res, {
        message: 'Los parámetros de consulta son inválidos.',
        errors: errorDetails,
      });
    }

    // Para cualquier otro error (ej. de la base de datos), lo pasamos al
    // siguiente middleware de manejo de errores de Express.
    next(error);
  }
}


export { findAll, findOne, add, update, remove, findMyCourses,findAllWithPagination };
