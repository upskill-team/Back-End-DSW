/**
 * @module AuthService
 * @description Manages the business logic for user authentication.
 * Responsibilities: registering new users, validating credentials for login,
 * and handling the password recovery flow.
 * @see {@link ./auth.controller.ts}
 */
import { EntityManager } from '@mikro-orm/core'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User, UserRole } from '../models/user/user.entity.js'
import { Student } from '../models/student/student.entity.js'
import { ObjectId } from '@mikro-orm/mongodb'
import { sendEmail } from '../shared/services/email.service.js'
import { render } from '@react-email/render'
import { ResetPasswordEmail } from '../emails/ResetPasswordEmail.js'
import { Logger } from 'pino'

/**
 * Provides methods for handling the user authentication lifecycle.
 * @class AuthService
 */
export class AuthService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'AuthService' } })
  }

  /**
   * Registers a new user in the system and creates their associated student profile.
   * Hashes the password before persisting to ensure security.
   * @param userData - User data for registration, including the plaintext password.
   * @returns {Promise<User>} A promise that resolves to the newly created user entity (without the password).
   * @throws {Error} If the provided email is already in use.
   */
  public async register(
    userData: Omit<User, 'password'> & { password_plaintext: string }
  ): Promise<User> {
    this.logger.info({ mail: userData.mail }, 'Attempting to register new user.')

    const existingUser = await this.em.findOne(User, { mail: userData.mail })
    if (existingUser) {
      this.logger.warn({ mail: userData.mail }, 'Registration failed: email already in use.')

      throw new Error('Email already used')
    }

    const SALT_ROUNDS = 10
    const hashedPassword = await bcrypt.hash(
      userData.password_plaintext,
      SALT_ROUNDS
    )

    const newUser = this.em.create(User, {
      name: userData.name,
      surname: userData.surname,
      mail: userData.mail,
      password: hashedPassword,
      role: UserRole.STUDENT,
    })

    const newStudentProfile = this.em.create(Student, { user: newUser })
    newUser.studentProfile = newStudentProfile

    await this.em.persistAndFlush([newUser, newStudentProfile])

    this.logger.info({ userId: newUser.id }, 'User registered successfully.')

    delete (newUser as Partial<User>).password
    return newUser
  }

  /**
   * Validates a user's credentials and generates a JWT if they are correct.
   * @param credentials - Object containing the user's email and plaintext password.
   * @returns {Promise<{ token: string }>} A promise that resolves to an object containing the JWT.
   * @throws {Error} If the credentials are invalid or the user does not exist.
   */
  public async login(credentials: {
    mail: string
    password_plaintext: string
  }): Promise<{ token: string }> {
    this.logger.info({ mail: credentials.mail }, 'User login attempt.')

    const user = await this.em.findOne(User, { mail: credentials.mail })

    if (!user) {
      this.logger.warn({ mail: credentials.mail }, 'Login failed: user not found.')

      throw new Error('Credenciales inválidas.')
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password_plaintext,
      user.password
    )

    if (!isPasswordValid) {
      this.logger.warn({ mail: credentials.mail }, 'Login failed: invalid password.')

      throw new Error('Credenciales inválidas.')
    }

    const payload = { id: user.id, role: user.role }
    // FIX: The '||' fallback is now removed.
    const JWT_SECRET = process.env.JWT_SECRET!
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })

    this.logger.info({ userId: user.id }, 'User logged in successfully.')

    return { token }
  }

  /**
   * Retrieves a user's profile by their ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<User | null>} The User entity or null if not found.
   */
  public async getProfile(userId: string): Promise<User | null> {
    this.logger.info({ userId }, 'Fetching user profile.')

    const userObjectId = new ObjectId(userId)
    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ['studentProfile', 'professorProfile'] }
    )

    if (!user) {
      this.logger.warn({ userId }, 'User profile not found.')

      return null
    }

    delete (user as Partial<User>).password
    return user
  }

  /**
   * Initiates the password recovery process. Generates a secure token,
   * stores it in the database, and sends a reset link email to the user.
   * @param {string} mail - The email of the user who forgot their password.
   * @returns {Promise<void>} A promise that resolves when the process is complete.
   * @throws {Error} If the email sending fails.
   */
  public async forgotPassword(mail: string): Promise<void> {
     this.logger.info({ mail }, 'Forgot password process initiated.')

    const user = await this.em.findOne(User, { mail })

    // For security, don't reveal if the user exists.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

      user.resetPasswordToken = passwordResetToken
      user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hour

      await this.em.persistAndFlush(user)

      const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`
      const emailHtml = await render(
        ResetPasswordEmail({ name: user.name, resetUrl })
      )

      try {
        await sendEmail({
          to: user.mail,
          subject: 'Restablecimiento de Contraseña - UpSkill',
          html: emailHtml,
        })
        this.logger.info({ mail }, 'Password reset email sent successfully.')

      } catch(error) {
        this.logger.error({ err: error, mail }, 'Failed to send password reset email.')

        // If email sending fails, clear the tokens to allow the user to try again.
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        await this.em.persistAndFlush(user)
        throw new Error('Could not send password reset email.')
      }
    } else {
      this.logger.info({ mail }, 'Forgot password attempt for non-existent user.')
    }
  }

  /**
   * Resets a user's password using a valid, non-expired token.
   * @param {string} token - The plain reset token from the URL.
   * @param {string} password_plaintext - The new password to set.
   * @returns {Promise<void>}
   * @throws {Error} If the token is invalid or has expired.
   */
  public async resetPassword(
    token: string,
    password_plaintext: string
  ): Promise<void> {
    this.logger.info('Attempting to reset password with token.')

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await this.em.findOne(User, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      this.logger.warn('Password reset failed: token is invalid or has expired.')

      throw new Error('El token es inválido o ha expirado.')
    }

    const SALT_ROUNDS = 10
    user.password = await bcrypt.hash(password_plaintext, SALT_ROUNDS)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await this.em.persistAndFlush(user)
    
    this.logger.info({ userId: user.id }, 'Password reset successfully.')
  }
}
