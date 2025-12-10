/**
 * @module Auth/Service
 * @remarks Manages authentication logic, including JWT generation,
 * refresh token rotation, and password management.
 */
import { EntityManager } from '@mikro-orm/core'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User, UserRole } from '../models/user/user.entity.js'
import { Student } from '../models/student/student.entity.js'
import { RefreshToken } from './refreshToken.entity.js'
import { sendEmail } from '../shared/services/email.service.js'
import { render } from '@react-email/render'
import { ResetPasswordEmail } from '../emails/templates/ResetPasswordEmail.js'
import { Logger } from 'pino'

export class AuthService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'AuthService' } })
  }

  /**
   * Registers a new user and creates their student profile.
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
   * Generates Access and Refresh tokens for a user.
   * Persists the Refresh Token in the database.
   */
  private async generateTokens(user: User) {
    const payload = { id: user.id, role: user.role };
    const JWT_SECRET = process.env.JWT_SECRET!;
    
    // 1. Access Token (Short lived: 15 min)
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    // 2. Refresh Token (Long lived: 7 days)
    const refreshTokenStr = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Explicitly setting revoked: false to satisfy MikroORM strict typing
    const refreshTokenEntity = this.em.create(RefreshToken, {
      token: refreshTokenStr,
      user: user,
      expiresAt: expiresAt,
      revoked: false 
    });

    await this.em.persistAndFlush(refreshTokenEntity);

    return { accessToken, refreshToken: refreshTokenStr };
  }

  /**
   * Validates credentials and returns both tokens.
   */
  public async login(credentials: {
    mail: string
    password_plaintext: string
  }): Promise<{ accessToken: string; refreshToken: string }> {
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

    // Generate token pair
    const tokens = await this.generateTokens(user);

    this.logger.info({ userId: user.id }, 'User logged in successfully.')

    return tokens;
  }

  /**
   * Handles Token Rotation.
   * Validates the old refresh token, revokes it, and issues a new pair.
   * Detects reuse of revoked tokens (theft attempt).
   */
  public async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await this.em.findOne(RefreshToken, { token }, { populate: ['user'] });

    if (!refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Reuse Detection
    if (refreshToken.revoked) {
      this.logger.warn({ userId: refreshToken.user.id }, 'Security Warning: Reuse of revoked token detected. Revoking all sessions.');
      
      // Revoke all tokens for this user family
      await this.em.nativeUpdate(RefreshToken, { user: refreshToken.user }, { revoked: true });
      
      throw new Error('Security breach detected. Please login again.');
    }

    if (refreshToken.expiresAt < new Date()) {
       throw new Error('Refresh token expired');
    }

    // Rotate: Revoke current and create new
    const newRefreshTokenStr = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newRefreshTokenEntity = this.em.create(RefreshToken, {
      token: newRefreshTokenStr,
      user: refreshToken.user,
      expiresAt,
      revoked: false
    });

    // Link the chain
    refreshToken.revoked = true;
    refreshToken.replacedByToken = newRefreshTokenStr;

    await this.em.persistAndFlush([refreshToken, newRefreshTokenEntity]);

    // Generate new Access Token
    const payload = { id: refreshToken.user.id, role: refreshToken.user.role };
    const JWT_SECRET = process.env.JWT_SECRET!;
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    return { accessToken, refreshToken: newRefreshTokenStr };
  }

  /**
   * Revokes a refresh token (Logout).
   */
  public async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
        const tokenEntity = await this.em.findOne(RefreshToken, { token: refreshToken });
        if (tokenEntity) {
            tokenEntity.revoked = true;
            await this.em.flush();
        }
    }
  }

  /**
   * Initiates password recovery.
   */
  public async forgotPassword(mail: string): Promise<void> {
     this.logger.info({ mail }, 'Forgot password process initiated.')

    const user = await this.em.findOne(User, { mail })

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
   * Resets password with token.
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