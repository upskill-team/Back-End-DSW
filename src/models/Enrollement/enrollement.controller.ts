/**
 * @module Models/Enrollement/Controller
 * @remarks Handles HTTP requests for the Enrollement module.
 */

import { Request, Response } from "express";
import { RequestContext } from "@mikro-orm/core";
import EnrollementService from "./enrollement.service.js";
import { EnrollmentState } from "./enrollement.entity.js";
import { logger } from "../../shared/utils/logger.js";
import { HttpResponse } from "../../shared/response/http.response.js";

export async function createEnrollement(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { studentId, courseId, state } = req.body;

    if (!studentId || !courseId) {
      return HttpResponse.BadRequest(res, "studentId and courseId are required");
    }

    if (state && !["enrolled", "completed", "dropped"].includes(state)) {
      return HttpResponse.BadRequest(res, "invalid state");
    }

    const enrol = await svc.create({
      studentId,
      courseId,
    });

    return HttpResponse.Created(res, enrol);
  } catch (err: any) {
    return HttpResponse.BadRequest(res, err.message || "Internal server error");
  }
}

export async function getEnrollements(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const data = await svc.findAll();
    return HttpResponse.Ok(res, data);
  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}
/**
 * Handles checking for an existing enrollment by student and course IDs.
 * @param {Request} req The Express request object, containing studentId and courseId in params.
 * @param {Response} res The Express response object.
 * @returns {Promise<Response>} The enrollment if found, or a 404 Not Found response.
 */
export async function getEnrollmentByStudentAndCourse(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { studentId, courseId } = req.params;

    // Validación básica de los parámetros de la URL
    if (!studentId || !courseId) {
      return HttpResponse.BadRequest(res, "studentId and courseId are required in the URL path.");
    }

    const enrollment = await svc.findByStudentAndCourse(studentId, courseId);

    // Lógica clave: Si no se encuentra, devolvemos un 404.
    // Esto es lo que el frontend interpretará como "no existe inscripción".
    if (!enrollment) {
      return HttpResponse.NotFound(res, "Enrollment not found for this student and course combination.");
    }

    // Si se encuentra, devolvemos los datos con un 200 OK.
    return HttpResponse.Ok(res, enrollment);

  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}
export async function getEnrollementById(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { id } = req.params;
    const enrol = await svc.findById(id);
    if (!enrol) return HttpResponse.NotFound(res, "Enrollment not found");
    return HttpResponse.Ok(res, enrol);
  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}

export async function getEnrollementsByStudent(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { studentId } = req.params;
    const data = await svc.findByStudent(studentId);
    return HttpResponse.Ok(res, data);
  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}

export async function getEnrollementsByCourse(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { courseId } = req.params;
    const data = await svc.findByCourse(courseId);
    return HttpResponse.Ok(res, data);
  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}

export async function updateEnrollement(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { id } = req.params;
    const { state, grade, progress } = req.body;

    if (state && !["enrolled", "completed", "dropped"].includes(state)) {
      return HttpResponse.BadRequest(res, "invalid state");
    }

    const updated = await svc.update(id, {
      state: state as EnrollmentState | undefined,
      grade,
      progress,
    });

    return HttpResponse.Ok(res, updated);
  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}

export async function deleteEnrollement(req: Request, res: Response) {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error("EntityManager context is not available.");
    }
    const svc = new EnrollementService(em, (req as any).log || logger);

    const { id } = req.params;
    await svc.remove(id);
    return HttpResponse.NotFound(res, "Enrollment deleted");
  } catch (err: any) {
    return HttpResponse.InternalServerError(
      res,
      err.message || "Internal server error"
    );
  }
}

export default {
  createEnrollement,
  getEnrollements,
  getEnrollmentByStudentAndCourse,
  getEnrollementById,
  getEnrollementsByStudent,
  getEnrollementsByCourse,
  updateEnrollement,
  deleteEnrollement,
};
