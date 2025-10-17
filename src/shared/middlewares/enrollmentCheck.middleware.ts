import { Request, Response, NextFunction } from 'express';
import { orm } from '../db/orm.js';
import { HttpResponse } from '../response/http.response.js';
import { getStudentIdFromUserId } from '../utils/student.helper.js';
import { Enrollement } from '../../models/Enrollement/enrollement.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Middleware para verificar si el usuario autenticado está inscrito en el curso.
 * Extrae el userId del token y el courseId de los parámetros de la URL.
 */
export const enrollmentCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user?.id;

    if (!userId) {
      return HttpResponse.Unauthorized(res, 'No estás autenticado.');
    }

    if (!courseId) {
      return HttpResponse.BadRequest(res, 'El ID del curso es requerido.');
    }

    const em = orm.em.fork();
    
    const studentId = await getStudentIdFromUserId(em, userId);

    const enrollment = await em.findOne(Enrollement, {
      student: new ObjectId(studentId),
      course: new ObjectId(courseId),
    });

    if (!enrollment) {
      return HttpResponse.Unauthorized(res, 'No estás inscrito en este curso.');
    }

    next();
  } catch (error: any) {
    if (error.message.includes('User is not a student')) {
        return HttpResponse.Unauthorized(res, 'Tu perfil no es de estudiante.');
    }
    return HttpResponse.InternalServerError(res, 'Error al verificar la inscripción.');
  }
};