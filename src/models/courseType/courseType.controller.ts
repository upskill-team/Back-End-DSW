import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { CourseTypeService } from './courseType.services.js';
import { HttpResponse } from '../../shared/response/http.response.js';

async function add(req: Request, res: Response) {
  try {
    const service = new CourseTypeService(orm.em.fork());
    const newCourseType = await service.create(req.body);
    return HttpResponse.Created(res, newCourseType);
  } catch (error: any) {
    if (error.code === 11000) {
      return HttpResponse.BadRequest(res, 'There is already a type of course with that name.');
    }
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function findAll(_: Request, res: Response) {
  try {
    const service = new CourseTypeService(orm.em.fork());
    const courseTypes = await service.findAll();
    return HttpResponse.Ok(res, courseTypes);
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const service = new CourseTypeService(orm.em.fork());
    const id = req.params.id;
    const courseType = await service.findOne(id);
    if (!courseType) {
      return HttpResponse.NotFound(res, 'Course type not found.');
    }
    return HttpResponse.Ok(res, courseType);
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function update(req: Request, res: Response) {
  try {
    const service = new CourseTypeService(orm.em.fork());
    const id = req.params.id;
    const updatedCourseType = await service.update(id, req.body);
    return HttpResponse.Ok(res, updatedCourseType);
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

async function remove(req: Request, res: Response) {
  try {
    const service = new CourseTypeService(orm.em.fork());
    const id = req.params.id;
    await service.remove(id);
    return HttpResponse.Ok(res, { message: 'Course type successfully deleted.' });
  } catch (error: any) {
    return HttpResponse.InternalServerError(res, error.message);
  }
}

export { findAll, findOne, add, update, remove };