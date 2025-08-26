import { EntityManager } from "@mikro-orm/core";
import { Professor } from "./professor.entity.js";

export class ProfessorService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  public async create(professorData: any): Promise<Professor> {
    const professor = this.em.create(Professor, professorData);
    await this.em.flush();
    return professor;
  }

  public async findAll(): Promise<Professor[]> {
    return this.em.find(Professor, {}, { populate: ['courses','institution'] });
  }

  public async findOne(id: string): Promise<Professor> {
    return this.em.findOneOrFail(Professor, { id },{ populate: ['courses','institution'] });
  }

  public async update(id: string, professorData: Partial<Professor>): Promise<Professor> {
    const professor = await this.em.findOneOrFail(Professor, { id });
    this.em.assign(professor, professorData);
    await this.em.flush();
    return professor;
  }

  public async remove(id: string): Promise<Professor> {
    const professor = this.em.getReference(Professor, id);
    await this.em.removeAndFlush(professor);
    return professor;
  }
}