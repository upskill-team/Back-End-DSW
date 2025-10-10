/**
 * @module Models/Professor/Service
 * @remarks Encapsulates the business logic for managing professor profiles.
 * @see {@link Professor}
 */
import { EntityManager } from '@mikro-orm/core';
import { Professor } from './professor.entity.js';
import {
  UpdateProfessorSchema,
  UpdateProfessorType,
} from './professor.schema.js';
import { Logger } from 'pino';
import { ObjectId } from '@mikro-orm/mongodb';
import { safeParse } from 'valibot';
import { User, UserRole } from '../user/user.entity.js';

/**
 * Provides methods for CRUD operations on Professor entities.
 * @class ProfessorService
 */
export class ProfessorService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'ProfessorService' } });
  }

  /**
   * Creates a new Professor profile from an existing User entity and promotes their role.
   * This method handles the business logic of turning a user into a professor.
   * It persists the new entity but does NOT flush the EntityManager.
   * The calling service is responsible for managing the transaction boundary.
   * @param {User} user - The User entity to be promoted.
   * @returns {Professor} The newly created Professor profile entity.
   */
  public createFromUser(user: User): Professor {
    user.role = UserRole.PROFESSOR;

    const newProfessorProfile = this.em.create(Professor, {
      user: user,
      state: 'active',
    });

    user.professorProfile = newProfessorProfile;
    this.em.persist(newProfessorProfile);

    return newProfessorProfile;
  }

  /**
   * Retrieves all professor profiles from the database.
   * Populates related courses, institution, and managed institution data.
   * @returns {Promise<Professor[]>} A promise resolving to an array of professors.
   */
  public async findAll(): Promise<Professor[]> {
    this.logger.info('Fetching all professors.');

    return this.em.find(
      Professor,
      {},
      { populate: ['courses', 'institution', 'managedInstitution'] }
    );
  }

  /**
   * Retrieves a single professor profile by its ID.
   * @param {string} id - The ID of the professor to find.
   * @returns {Promise<Professor>} A promise resolving to the found professor.
   * @throws {NotFoundError} If no professor with the given ID is found.
   */
  public async findOne(id: string): Promise<Professor> {
    this.logger.info({ professorId: id }, 'Fetching professor.');

    const objectId = new ObjectId(id);
    return this.em.findOneOrFail(
      Professor,
      { _id: objectId },
      { populate: ['courses', 'institution', 'managedInstitution'] }
    );
  }

  /**
   * Updates an existing professor's profile.
   * Note: Institution membership cannot be updated here.
   * Use Institution endpoints to join/leave institutions.
   * @param {string} id - The ID of the professor to update.
   * @param {UpdateProfessorType} data - The data to update.
   * @returns {Promise<Professor>} A promise resolving to the updated professor profile.
   * @throws {NotFoundError} If no professor with the given ID is found.
   */
  public async update(
    id: string,
    data: UpdateProfessorType
  ): Promise<Professor> {
    this.logger.info({ professorId: id, data: data }, 'Updating professor.');

    const result = safeParse(UpdateProfessorSchema, data);
    if (!result.success) {
      this.logger.error(
        { issues: result.issues },
        'Validation failed for professor update.'
      );
      throw new Error('Invalid data for professor update.');
    }

    const objectId = new ObjectId(id);
    const professor = await this.em.findOneOrFail(Professor, { _id: objectId });
    this.em.assign(professor, data);
    await this.em.flush();

    this.logger.info({ professorId: id }, 'Professor updated successfully.');

    return professor;
  }

  /**
   * Deletes a professor's profile by its ID.
   * @param {string} id - The ID of the professor to remove.
   * @returns {Promise<void>} A promise that resolves when the profile is deleted.
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ professorId: id }, 'Deleting professor.');

    const objectId = new ObjectId(id);
    const professor = this.em.getReference(Professor, objectId);
    await this.em.removeAndFlush(professor);

    this.logger.info({ professorId: id }, 'Professor deleted successfully.');
  }

  /**
   * Gets the current professor's profile from the request user.
   * This includes their institution and managed institution data.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Professor | null>} The professor profile or null.
   */
  public async getByUserId(userId: string): Promise<Professor | null> {
    this.logger.info({ userId }, 'Fetching professor by user ID.');

    const userObjectId = new ObjectId(userId);
    const user = await this.em.findOne(User, { _id: userObjectId });

    if (!user || !user.professorProfile) {
      this.logger.warn({ userId }, 'User not found or has no professor profile linked.');
      return null;
    }

    const professorProfileId = new ObjectId(user.professorProfile.id);

    return this.em.findOne(
      Professor,
      { _id: professorProfileId },
      { populate: ['institution', 'managedInstitution', 'courses'] }
    );
  }
}