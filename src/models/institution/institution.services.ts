/**
 * @module Models/Institution/Service
 * @remarks Encapsulates the business logic for managing institutions.
 */
import { EntityManager } from '@mikro-orm/core';
import { Institution } from './institution.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import {
  CreateInstitutionType,
  UpdateInstitutionType,
  UpdateManagedInstitutionType,
} from './institution.schemas.js';
import { Logger } from 'pino';
import { mapInstitutionToFilter } from './institution.mappers.js';
import type { InstitutionFilterResponse } from './institution.dtos.js';

export class InstitutionService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'InstitutionService' } });
  }

  /**
   * Normalizes a string for comparison by converting to lowercase, removing accents and special characters.
   * @param {string} str - The input string.
   * @returns {string} The normalized string.
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculates the Levenshtein distance between two strings.
   * A lower number means the strings are more similar.
   * @param {string} s1 - The first string.
   * @param {string} s2 - The second string.
   * @returns {number} The Levenshtein distance.
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(null));
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[len1][len2];
  }

  /**
   * Checks for duplicate or highly similar institution names to prevent typos and duplicates.
   * @param {string} name - The proposed name for the new institution.
   * @param {string[]} [aliases=[]] - Optional list of aliases for the new institution.
   * @returns {Promise<string | null>} An error message if a duplicate or similar name is found, otherwise null.
   */
  private async checkSimilarity(
    name: string,
    aliases: string[] = []
  ): Promise<string | null> {
    const normalizedName = this.normalizeString(name);
    const normalizedAliases = aliases
      .map((a) => this.normalizeString(a))
      .filter(Boolean);
    const allUniqueNames = [...new Set([normalizedName, ...normalizedAliases])];

    // Step 1: Check for exact matches in names or aliases. This is a hard block.
    const exactMatch = await this.em.findOne(Institution, {
      $or: [
        { normalizedName: { $in: allUniqueNames } },
        { aliases: { $in: allUniqueNames } },
      ],
    });
    if (exactMatch) {
      return `Ya existe una institución con un nombre o alias coincidente: "${exactMatch.name}".`;
    }

    // Step 2: Check for high similarity (potential typos) ONLY against existing full names.
    const allInstitutions = await this.em.find(Institution, {});
    for (const inst of allInstitutions) {
      const distance = this.levenshteinDistance(
        normalizedName,
        inst.normalizedName
      );

      // Error Threshold: If the distance is very small, it's highly likely a typo. Block it.
      // We use a threshold of 20% of the longer string's length.
      const threshold =
        Math.max(normalizedName.length, inst.normalizedName.length) * 0.2;

      // We also check a minimum distance to avoid false positives on very short names.
      if (distance > 0 && distance <= 2 && distance <= threshold) {
        return `The name is too similar to an existing institution: "${inst.name}". Please check for a typo.`;
      }
    }

    return null;
  }

  /**
   * Creates a new institution with the professor as manager.
   * @param {string} professorId - The ID of the professor creating the institution.
   * @param {CreateInstitutionType} institutionData - The data for the new institution.
   * @returns {Promise<Institution>} The newly created institution.
   */
  public async createByProfessor(
    professorId: string,
    institutionData: CreateInstitutionType
  ): Promise<Institution> {
    this.logger.info(
      { professorId, name: institutionData.name },
      'Professor creating new institution.'
    );
    const professor = await this.em.findOneOrFail(
      Professor,
      { _id: new ObjectId(professorId) },
      { populate: ['managedInstitution', 'institution'] }
    );
    if (professor.managedInstitution) {
      throw new Error(
        'You already manage an institution. You cannot create another one.'
      );
    }
    if (professor.institution) {
      throw new Error(
        'You already belong to an institution. You must leave it first.'
      );
    }

    const similarityError = await this.checkSimilarity(
      institutionData.name,
      institutionData.aliases
    );
    if (similarityError) {
      this.logger.error({ name: institutionData.name }, similarityError);
      throw new Error(similarityError);
    }

    const normalizedName = this.normalizeString(institutionData.name);
    const normalizedAliases =
      institutionData.aliases
        ?.map((a) => this.normalizeString(a))
        .filter(Boolean) || [];
    const institution = this.em.create(Institution, {
      ...institutionData,
      normalizedName,
      aliases: normalizedAliases.length > 0 ? normalizedAliases : undefined,
      manager: professor,
    });
    professor.managedInstitution = institution;
    professor.institution = institution;
    await this.em.flush();
    this.logger.info(
      { institutionId: institution.id },
      'Institution created successfully.'
    );
    return institution;
  }

  /**
   * Retrieves all institutions for public filter/dropdown.
   * Returns only id and name - NO sensitive data.
   * @returns {Promise<InstitutionFilterResponse[]>} A list of filtered institutions.
   */
  public async findAll(): Promise<InstitutionFilterResponse[]> {
    this.logger.info('Fetching all institutions for filter.');
    const institutions = await this.em.find(Institution, {});
    return institutions.map((inst) => mapInstitutionToFilter(inst));
  }

  /**
   * Retrieves all institutions (for admin purposes).
   * @returns {Promise<Institution[]>} A list of all institutions.
   */
  public async findAllAdmin(): Promise<Institution[]> {
    this.logger.info('Admin fetching all institutions.');
    return this.em.find(
      Institution,
      {},
      { populate: ['manager.user', 'professors.user'] }
    );
  }

  /**
   * Retrieves a single institution by its ID.
   * @param {string} id - The ID of the institution to find.
   * @returns {Promise<Institution>} The requested institution.
   */
  public async findOne(id: string): Promise<Institution> {
    this.logger.info({ institutionId: id }, 'Fetching institution.');
    const objectId = new ObjectId(id);
    return this.em.findOneOrFail(
      Institution,
      { _id: objectId },
      { populate: ['manager.user', 'professors.user'] }
    );
  }

  /**
   * Updates an institution. (Admin only)
   * @param {string} id - The ID of the institution to update.
   * @param {UpdateInstitutionType} data - The data to update.
   * @returns {Promise<Institution>} The updated institution.
   */
  public async update(
    id: string,
    data: UpdateInstitutionType
  ): Promise<Institution> {
    this.logger.info({ institutionId: id, data }, 'Updating institution.');
    const objectId = new ObjectId(id);
    const institution = await this.em.findOneOrFail(Institution, {
      _id: objectId,
    });
    if (data.name && data.name !== institution.name) {
      const similarityError = await this.checkSimilarity(
        data.name,
        data.aliases
      );
      if (similarityError) {
        throw new Error(similarityError);
      }
      const normalizedName = this.normalizeString(data.name);
      this.em.assign(institution, { ...data, normalizedName });
    } else {
      this.em.assign(institution, data);
    }
    await this.em.flush();
    this.logger.info(
      { institutionId: id },
      'Institution updated successfully.'
    );
    return institution;
  }

  /**
   * Deletes an institution. (Admin only)
   * @param {string} id - The ID of the institution to remove.
   * @returns {Promise<void>}
   */
  public async remove(id: string): Promise<void> {
    this.logger.info({ institutionId: id }, 'Deleting institution.');
    const objectId = new ObjectId(id);
    const institution = await this.em.findOneOrFail(
      Institution,
      { _id: objectId },
      { populate: ['manager', 'professors'] }
    );
    for (const professor of institution.professors) {
      professor.institution = undefined;
      if (professor.managedInstitution?.id === institution.id) {
        professor.managedInstitution = undefined;
      }
    }
    await this.em.removeAndFlush(institution);
    this.logger.info(
      { institutionId: id },
      'Institution deleted successfully.'
    );
  }

  /**
   * Adds a professor to an institution. Used internally after a join request is accepted.
   * @param {string} institutionId - The ID of the institution.
   * @param {string} professorId - The ID of the professor to add.
   * @param {string} managerId - The ID of the manager authorizing the action.
   * @returns {Promise<Institution>} The updated institution.
   */
  public async addProfessor(
    institutionId: string,
    professorId: string,
    managerId: string
  ): Promise<Institution> {
    this.logger.info(
      { institutionId, professorId, managerId },
      'Adding professor to institution.'
    );
    const institution = await this.em.findOneOrFail(
      Institution,
      { _id: new ObjectId(institutionId) },
      { populate: ['manager'] }
    );
    if (institution.manager.id !== managerId) {
      throw new Error('Only the institution manager can add professors.');
    }
    const professor = await this.em.findOneOrFail(
      Professor,
      { _id: new ObjectId(professorId) },
      { populate: ['institution'] }
    );
    if (professor.institution) {
      throw new Error('The professor already belongs to an institution.');
    }
    professor.institution = institution;
    await this.em.flush();
    this.logger.info(
      { institutionId, professorId },
      'Professor added to institution successfully.'
    );
    return institution;
  }

  /**
   * Removes a professor from an institution. Can be done by the manager or the professor themselves.
   * @param {string} institutionId - The ID of the institution.
   * @param {string} professorId - The ID of the professor to remove.
   * @param {string} requesterId - The ID of the user performing the action.
   * @returns {Promise<void>}
   */
  public async removeProfessor(
    institutionId: string,
    professorId: string,
    requesterId: string
  ): Promise<void> {
    this.logger.info(
      { institutionId, professorId, requesterId },
      'Removing professor from institution.'
    );
    const institution = await this.em.findOneOrFail(
      Institution,
      { _id: new ObjectId(institutionId) },
      { populate: ['manager'] }
    );
    const professor = await this.em.findOneOrFail(
      Professor,
      { _id: new ObjectId(professorId) },
      { populate: ['institution', 'managedInstitution'] }
    );
    const isManager = institution.manager.id === requesterId;
    const isSelf = professorId === requesterId;
    if (!isManager && !isSelf) {
      throw new Error(
        'Only the professor or the institution manager can perform this action.'
      );
    }
    if (isSelf && professor.managedInstitution?.id === institutionId) {
      throw new Error('You cannot leave an institution you manage.');
    }
    if (professor.institution?.id !== institutionId) {
      throw new Error('The professor does not belong to this institution.');
    }
    professor.institution = undefined;
    await this.em.flush();
    this.logger.info(
      { institutionId, professorId },
      'Professor removed from institution successfully.'
    );
  }

  /**
   * Gets the institution managed by a professor.
   * @param {string} professorId - The ID of the professor.
   * @returns {Promise<Institution | null>} The managed institution, or null if none.
   */
  public async getManagedInstitution(
    professorId: string
  ): Promise<Institution | null> {
    this.logger.info(
      { professorId },
      'Fetching managed institution for professor.'
    );
    const professor = await this.em.findOne(
      Professor,
      { _id: new ObjectId(professorId) },
      { populate: ['managedInstitution'] }
    );
    const managedInstitution = professor?.managedInstitution;
    if (managedInstitution?.id) {
      return this.findOne(managedInstitution.id);
    }
    return null;
  }

  /**
   * Updates the institution managed by a professor. (Manager only)
   * @param {string} managerId - The ID of the professor who is the manager.
   * @param {UpdateManagedInstitutionType} data - The data to update (description, aliases).
   * @returns {Promise<Institution>} The updated institution.
   */
  public async updateManagedInstitution(
    managerId: string,
    data: UpdateManagedInstitutionType
  ): Promise<Institution> {
    this.logger.info(
      { managerId, data },
      'Manager updating their institution.'
    );
    const professor = await this.em.findOneOrFail(
      Professor,
      { _id: new ObjectId(managerId) },
      { populate: ['managedInstitution'] }
    );
    if (!professor.managedInstitution) {
      throw new Error('You do not manage any institution.');
    }
    const institution = professor.managedInstitution;
    if (data.aliases) {
      // Also check for exact duplicates in aliases when updating
      const duplicateError = await this.checkSimilarity('', data.aliases);
      if (duplicateError) {
        throw new Error(duplicateError);
      }
      data.aliases = data.aliases.map((alias) => this.normalizeString(alias));
    }
    this.em.assign(institution, data);
    await this.em.flush();
    this.logger.info(
      { institutionId: institution.id },
      'Managed institution updated successfully.'
    );
    return this.findOne(institution.id!);
  }
}
