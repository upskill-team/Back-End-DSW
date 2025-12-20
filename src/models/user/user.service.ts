/**
 * @module Models/User/Service
 * @remarks Encapsulates the business logic for managing user profiles.
 * @see {@link Models/User/Controller} for HTTP request handlers.
 */
import { EntityManager } from '@mikro-orm/core'
import { User } from './user.entity.js'
import { ObjectId } from '@mikro-orm/mongodb'
import type { UpdateProfileType } from './user.schemas.js'
import { Logger } from 'pino'

/**
 * Provides methods for managing user profiles.
 * @class UserService
 */
export class UserService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'UserService' } })
  }

  /**
   * Updates the profile of an authenticated user.
   * It handles data validation, checks for email conflicts, and persists the changes.
   * @param {string} userId - The ID of the user performing the update.
   * @param {UpdateProfileType} data - The validated data to update (name, surname, etc.).
   * @returns {Promise<User>} A promise resolving to the updated User entity.
   * @throws {Error} If the new email is already in use by another account.
   */
  public async updateProfile(
    userId: string,
    data: UpdateProfileType,
    imageUrl?: string
  ): Promise<User> {
    this.logger.info({ userId, data }, 'Attempting to update user profile.')

    const user = await this.em.findOneOrFail(User, { _id: new ObjectId(userId) })

    if (data.mail && data.mail !== user.mail) {
      const existingUser = await this.em.findOne(User, { mail: data.mail })
      if (existingUser) {
        this.logger.warn({ userId, newMail: data.mail }, 'Update failed: email already in use.')
        throw new Error('The email is already in use by another account.')
      }
    }

    const { birthdate, ...restOfData } = data
    const updatePayload: Partial<User> = { ...restOfData }
    
    if (birthdate) {
      updatePayload.birthdate = new Date(birthdate)
    }

    if (imageUrl) {
      updatePayload.profile_picture = imageUrl;
    }

    this.em.assign(user, updatePayload)
    await this.em.flush()

    this.logger.info({ userId: user.id }, 'User profile updated successfully.')

    delete (user as Partial<User>).password
    return user
  }

  /**
   * Retrieves the profile of a user by their ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<User | null>} The User entity or null if not found.
   */
  public async getProfile(userId: string): Promise<User | null> {
    this.logger.info({ userId }, 'Fetching user profile.');
    
    const user = await this.em.findOne(
      User,
      { _id: new ObjectId(userId) },
      { populate: ['studentProfile', 'professorProfile'] }
    );

    if (!user) {
      this.logger.warn({ userId }, 'User profile not found.');
      return null;
    }

    delete (user as Partial<User>).password;
    return user;
  }
}