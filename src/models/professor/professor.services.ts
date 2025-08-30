/**
 * @module ProfessorService
 * @description Encapsulates the business logic for managing professor profiles.
 */
import { EntityManager } from '@mikro-orm/core';
import { Professor } from './professor.entity.js';
import { UpdateProfessorType } from './professor.schema.js';

/**
 * Provides methods for CRUD operations on Professor entities.
 * @class ProfessorService
 */
export class ProfessorService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  // The `create` method is intentionally omitted. Professor profiles should be created
  // as part of a larger business process, such as a user's application being accepted.
  // See AppealService for an example.

  /**
   * Retrieves all professor profiles from the database.
   * Populates related courses and institution data.
   * @returns {Promise<Professor[]>} A promise resolving to an array of professors.
   */
  public async findAll(): Promise<Professor[]> {
    return this.em.find(
      Professor,
      {},
      { populate: ['courses', 'institution'] }
    );
  }

  /**
   * Retrieves a single professor profile by its ID.
   * @param {string} id - The ID of the professor to find.
   * @returns {Promise<Professor>} A promise resolving to the found professor.
   * @throws {NotFoundError} If no professor with the given ID is found.
   */
  public async findOne(id: string): Promise<Professor> {
    return this.em.findOneOrFail(
      Professor,
      { id },
      { populate: ['courses', 'institution'] }
    );
  }

  /**
   * Updates an existing professor's profile.
   * @param {string} id - The ID of the professor to update.
   * @param {UpdateProfessorType} professorData - The data to update.
   * @returns {Promise<Professor>} A promise resolving to the updated professor profile.
   * @throws {NotFoundError} If no professor with the given ID is found.
   */
  public async update(
    id: string,
    professorData: UpdateProfessorType
  ): Promise<Professor> {
    const professor = await this.em.findOneOrFail(Professor, { id });
    this.em.assign(professor, professorData);
    await this.em.flush();
    return professor;
  }

  /**
   * Deletes a professor's profile by its ID.
   * @param {string} id - The ID of the professor to remove.
   * @returns {Promise<void>} A promise that resolves when the profile is deleted.
   */
  public async remove(id: string): Promise<void> {
    const professor = this.em.getReference(Professor, id);
    await this.em.removeAndFlush(professor);
  }
}
