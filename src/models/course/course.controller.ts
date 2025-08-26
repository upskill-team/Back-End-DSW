import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { CourseService } from './course.services.js';
import { HttpResponse } from '../../shared/response/http.response.js';
import { User } from '../user/user.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork());
    const courses = await courseService.findAll();
    return HttpResponse.Ok(res, courses);
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork());
    const id = req.params.id;
    const course = await courseService.findOne(id);
    return HttpResponse.Ok(res, course);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function add(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork());
    const em = orm.em.fork();

    // The creation of a course must be linked to a professor.
    // We retrieve the professor's ID from the authenticated user's profile.
    const user = await em.findOne(
      User,
      { id: req.user?.id },
      { populate: ['professorProfile'] }
    );
    const professorId = user?.professorProfile?.id;

    if (!professorId) {
      return HttpResponse.Unauthorized(
        res,
        'The authenticated user is not a professor.'
      );
    }

    const newCourse = await courseService.create(req.body, professorId);
    return HttpResponse.Created(res, newCourse);
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function update(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork());
    const id = req.params.id;
    const updatedCourse = await courseService.update(id, req.body);
    return HttpResponse.Ok(res, updatedCourse);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return HttpResponse.NotFound(res, 'Course not found.');
    }
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function remove(req: Request, res: Response) {
  try {
    const courseService = new CourseService(orm.em.fork());
    const id = req.params.id;
    await courseService.remove(id);
    return HttpResponse.Ok(res, { message: 'Course deleted successfully' });
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

export { findAll, findOne, add, update, remove };
