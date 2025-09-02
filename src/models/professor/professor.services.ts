/**
 * @module models/professor
 * Encapsulates the business logic for managing professor profiles.
 * @see {@link Professor}
 */
import { EntityManager } from '@mikro-orm/core'
import { Professor } from './professor.entity.js'
import { UpdateProfessorType } from './professor.schema.js'
import { Logger } from 'pino'

/**
 * Provides methods for CRUD operations on Professor entities.
 */
export class ProfessorService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'ProfessorService' } })
  }

  // The `create` method is intentionally omitted. Professor profiles should be created
  // as part of a larger business process, such as a user's application being accepted.
  // See AppealService for an example.

  /**
   * Retrieves all professor profiles from the database.
   * Populates related courses and institution data.
   * @returns A promise resolving to an array of professors.
   */
  public async findAll(): Promise<Professor[]> {
    this.logger.info('Fetching all professors.')

    return this.em.find(
      Professor,
      {},
      { populate: ['courses', 'institution'] }
    )
  }

  /**
   * Retrieves a single professor profile by its ID.
   * @param id - The ID of the professor to find.
   * @returns A promise resolving to the found professor.
   * @throws NotFoundError If no professor with the given ID is found.
   */
  public async findOne(id: string): Promise<Professor> {
    this.logger.info({ professorId: id }, 'Fetching professor.')

    return this.em.findOneOrFail(
      Professor,
      { id },
      { populate: ['courses', 'institution'] }
    )
  }

  /**
   * Updates an existing professor's profile.
   * @param id - The ID of the professor to update.
   * @param professorData - The data to update.
   * @returns A promise resolving to the updated professor profile.
   * @throws NotFoundError If no professor with the given ID is found.
   */
  public async update(
    id: string,
    professorData: UpdateProfessorType
  ): Promise<Professor> {
    this.logger.info({ professorId: id, data: professorData }, 'Updating professor.')

    const professor = await this.em.findOneOrFail(Professor, { id })
    this.em.assign(professor, professorData);
    await this.em.flush()

    this.logger.info({ professorId: id }, 'Professor updated successfully.')

    return professor
  }

  /**
   * Deletes a professor's profile by its ID.
   * @param id - The ID of the professor to remove.
   * @returns A promise that resolves when the profile is deleted.
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ professorId: id }, 'Deleting professor.')
    
    const professor = this.em.getReference(Professor, id)
    await this.em.removeAndFlush(professor);
  }
}
