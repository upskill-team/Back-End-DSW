import { EntityManager } from '@mikro-orm/core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole } from '../models/user/user.entity.js';
import { Student } from '../models/student/student.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { sendEmail } from '../shared/services/email.service.js';
import { render } from '@react-email/render';
import { ResetPasswordEmail } from '../emails/ResetPasswordEmail.js';

/**
 * Service for authentication logic, including registration, login, and password recovery.
 */
export class AuthService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  /**
   * Registers a new user and creates their student profile.
   * @param userData The user's registration data.
   * @returns The newly created User entity, without the password.
   */
  public async register(
    userData: Omit<User, 'password'> & { password_plaintext: string }
  ): Promise<User> {
    const existingUser = await this.em.findOne(User, { mail: userData.mail });
    if (existingUser) {
      throw new Error('Email already used');
    }
    
    const SALT_ROUNDS = 10;
    const hashedPassword = await bcrypt.hash(userData.password_plaintext, SALT_ROUNDS);

    const newUser = this.em.create(User, {
      name: userData.name,
      surname: userData.surname,
      mail: userData.mail,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });

    const newStudentProfile = this.em.create(Student, { user: newUser });
    newUser.studentProfile = newStudentProfile;

    await this.em.persistAndFlush([newUser, newStudentProfile]);

    delete (newUser as Partial<User>).password;
    return newUser;
  }

  /**
   * Logs in a user and returns a JWT token.
   * @param credentials The user's login credentials.
   * @returns An object containing the JWT token.
   */
  public async login(credentials: {
    mail: string;
    password_plaintext: string;
  }): Promise<{ token: string }> {
    const user = await this.em.findOne(User, { mail: credentials.mail });

    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password_plaintext, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas.');
    }

    const payload = { id: user.id, role: user.role };
    const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return { token };
  }

  /**
   * Gets a user's profile by their ID.
   * @param userId The ID of the user to retrieve.
   * @returns The User entity or null if not found.
   */
  public async getProfile(userId: string): Promise<User | null> {
    const userObjectId = new ObjectId(userId);
    const user = await this.em.findOne(User, { _id: userObjectId }, { populate: ['studentProfile', 'professorProfile'] });

    if (!user) return null;

    delete (user as Partial<User>).password;
    return user;
  }

  /**
   * Handles the forgot password request. Generates a secure token,
   * stores its hash, and sends a reset email to the user.
   * @param mail The email of the user requesting a password reset.
   */
  public async forgotPassword(mail: string): Promise<void> {
    const user = await this.em.findOne(User, { mail });

    // For security, don't reveal if the user exists.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = passwordResetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      await this.em.persistAndFlush(user);

      const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
      const emailHtml = await render(ResetPasswordEmail({ name: user.name, resetUrl }));

      try {
        await sendEmail({
          to: user.mail,
          subject: 'Restablecimiento de Contraseña - UpSkill',
          html: emailHtml,
        });
      } catch (error) {
        // If email sending fails, clear the tokens to allow the user to try again.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await this.em.persistAndFlush(user);
        throw new Error('Could not send password reset email.');
      }
    }
  }

  /**
   * Resets a user's password using a valid, non-expired token.
   * @param token The plain reset token from the URL.
   * @param password_plaintext The new password to set.
   */
  public async resetPassword(token: string, password_plaintext: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.em.findOne(User, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error('El token es inválido o ha expirado.');
    }

    const SALT_ROUNDS = 10;
    user.password = await bcrypt.hash(password_plaintext, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.em.persistAndFlush(user);
  }
}