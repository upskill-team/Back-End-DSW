/**
 * @module models/institution
 * Encapsulates the business logic for managing institutions.
 * This service is responsible for all database interactions related to institutions.
 * @see {@link InstitutionController}
 */
import { EntityManager } from '@mikro-orm/core'
import { Institution } from './institution.entity.js'
// Import the new, precise type for creation data.
import { CreateInstitutionType } from './institution.schemas.js'

/**
 * Provides methods for performing CRUD (Create, Read, Update, Delete) operations on Institution entities.
 */
export class InstitutionService {
  private em: EntityManager

  constructor(em: EntityManager) {
    this.em = em
  }

  /**
   * Creates a new institution record in the database.
   * @param institutionData - The validated data for the new institution.
   * @returns A promise that resolves to the newly created Institution entity.
   */
  public async create(
    institutionData: CreateInstitutionType
  ): Promise<Institution> {
    // Now, TypeScript knows that institutionData contains `name` and `description` as strings,
    // matching what `em.create` expects.
    const institution = this.em.create(Institution, institutionData)
    await this.em.flush()
    return institution
  }

  /**
   * Retrieves all institutions from the database, populating their associated professors.
   * @returns A promise that resolves to an array of all Institution entities.
   */
  public async findAll(): Promise<Institution[]> {
    return this.em.find(Institution, {}, { populate: ['professors'] })
  }

  /**
   * Retrieves a single institution by its ID, populating its associated professors.
   * @param id - The ID of the institution to find.
   * @returns A promise that resolves to the found Institution entity.
   * @throws NotFoundError If no institution with the given ID is found (from findOneOrFail).
   */
  public async findOne(id: string): Promise<Institution> {
    return this.em.findOneOrFail(
      Institution,
      { id },
      { populate: ['professors'] }
    )
  }

  /**
   * Updates an existing institution's data by its ID.
   * @param id - The ID of the institution to update.
   * @param institutionData - An object containing the fields to update.
   * @returns A promise that resolves to the updated Institution entity.
   * @throws NotFoundError If no institution with the given ID is found (from findOneOrFail).
   */
  public async update(
    id: string,
    institutionData: Partial<Institution>
  ): Promise<Institution> {
    const institution = await this.em.findOneOrFail(Institution, { id })
    this.em.assign(institution, institutionData)
    await this.em.flush()
    return institution
  }

  /**
   * Deletes an institution from the database by its ID.
   * @param id - The ID of the institution to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  public async remove(id: string): Promise<void> {
    const institution = this.em.getReference(Institution, id)
    await this.em.removeAndFlush(institution)
  }
}
