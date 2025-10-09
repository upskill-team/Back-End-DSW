/**
 * @module Models/Enrollement/Controller
 * @remarks Handles HTTP requests for the Enrollement module.
 */

import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import EnrollementService from './enrollement.service.js';
import { EnrollmentState } from './enrollement.entity.js';

/**
 * Default extractor for EntityManager from request/app.
 * Tests can replace this with setGetEmFromReq.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getEmFromReq: (req: Request) => EntityManager = (req: Request) => {
  const anyReq = req as any;
  return (
    anyReq.em ||
    req.app?.locals?.em ||
    (typeof req.app?.get === 'function' && req.app.get('em')) ||
    // last resort: throw to make issue visible
    (() => {
      throw new Error('EntityManager not found on request/app. Adjust getEmFromReq.');
    })()
  );
};

/**
 * Replace the function used to obtain the EntityManager.
 * Useful in tests to inject a mock EntityManager.
 */
export function setGetEmFromReq(fn: (req: Request) => EntityManager) {
  getEmFromReq = fn;
}

export async function createEnrollement(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const { studentId, courseId, state, grade, progress } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'studentId and courseId are required' });
    }

    if (state && !['enrolled', 'completed', 'dropped'].includes(state)) {
      return res.status(400).json({ message: 'invalid state' });
    }

    const enrol = await svc.create({
      studentId,
      courseId,
      state: state as EnrollmentState | undefined,
      grade,
      progress,
    });

    return res.status(201).json(enrol);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function getEnrollements(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const data = await svc.findAll();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function getEnrollementById(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const { id } = req.params;
    const enrol = await svc.findById(id);
    if (!enrol) return res.status(404).json({ message: 'Enrollment not found' });
    return res.status(200).json(enrol);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function getEnrollementsByStudent(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const { studentId } = req.params;
    const data = await svc.findByStudent(studentId);
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function getEnrollementsByCourse(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const { courseId } = req.params;
    const data = await svc.findByCourse(courseId);
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function updateEnrollement(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const { id } = req.params;
    const { state, grade, progress } = req.body;

    if (state && !['enrolled', 'completed', 'dropped'].includes(state)) {
      return res.status(400).json({ message: 'invalid state' });
    }

    const updated = await svc.update(id, {
      state: state as EnrollmentState | undefined,
      grade,
      progress,
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function deleteEnrollement(req: Request, res: Response) {
  try {
    const em = getEmFromReq(req);
    const svc = new EnrollementService(em);

    const { id } = req.params;
    await svc.remove(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export default {
  createEnrollement,
  getEnrollements,
  getEnrollementById,
  getEnrollementsByStudent,
  getEnrollementsByCourse,
  updateEnrollement,
  deleteEnrollement,
};