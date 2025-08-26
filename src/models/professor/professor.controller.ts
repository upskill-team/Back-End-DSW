import { Request, Response, NextFunction } from 'express';
import { orm } from '../../shared/db/orm.js';
import { ProfessorService } from './professor.services.js';

const professorService = new ProfessorService(orm.em);


async function findAll(req: Request, res: Response) {
  try {
    const professor = await professorService.findAll();
    res.status(200).json({ message: 'Found all professors', data: professor });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const professor = await professorService.findOne(id);
    res.status(200).json({ message: 'Found professor', data: professor });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const professor = professorService.create(req.body);
    res.status(201).json({ message: 'Professor created', data: professor });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const professor = professorService.update(id, req.body);

    res.status(200).json({ message: 'Professor updated', data: professor });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await professorService.remove(id);
    res.status(200).send({ message: 'Professor deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export {findAll, findOne, add, remove, update };
