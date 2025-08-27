import { EntityManager } from '@mikro-orm/core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import { User, UserRole } from '../models/user/user.entity.js';
import { Student } from '../models/student/student.entity.js';
import { ObjectId } from '@mikro-orm/mongodb';
import { sendEmail } from '../shared/services/email.service.js';

// Service for authentication logic
export class AuthService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  // Registers a new user and creates their student profile
  public async register(
    userData: Omit<User, 'password'> & { password_plaintext: string }
  ): Promise<User> {
    // Check if email is already used
    const existingUser = await this.em.findOne(User, { mail: userData.mail });
    if (existingUser) {
      throw new Error('Email already used');
    }
    // Hash the password before saving
    const SALT_ROUNDS = 10;
    const hashedPassword = await bcrypt.hash(
      userData.password_plaintext,
      SALT_ROUNDS
    );

    // Create new user and student profile
    const newUser = this.em.create(User, {
      name: userData.name,
      surname: userData.surname,
      mail: userData.mail,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });

    const newStudentProfile = this.em.create(Student, { user: newUser });
    newUser.studentProfile = newStudentProfile;

    // Save both user and profile
    await this.em.persistAndFlush([newUser, newStudentProfile]);

    // Remove password before returning user
    delete (newUser as Partial<User>).password;
    return newUser;
  }

  // Logs in a user and returns a JWT token
  public async login(credentials: {
    mail: string;
    password_plaintext: string;
  }): Promise<{ token: string }> {
    // Find user by email
    const user = await this.em.findOne(User, { mail: credentials.mail });

    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(
      credentials.password_plaintext,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas.');
    }

    // Create JWT token with user info
    const payload = { id: user.id, role: user.role };
    const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return { token };
  }

  // Gets user profile by ID
  public async getProfile(userId: string): Promise<User | null> {
    const userObjectId = new ObjectId(userId);
    const user = await this.em.findOne(User, {_id: userObjectId}, { populate: ['studentProfile', 'professorProfile'] });

    if (!user) return null;

    // Remove password before returning user
    delete (user as Partial<User>).password;
    return user;
  }

  public async forgotPassword(mail: string): Promise<void> {
    const user = await this.em.findOne(User, { mail });

    // For security, don't reveal if the user exists.
    // If a user is found, proceed with token generation and email sending.
    if (user) {
      // Generate a random token
      const resetToken = crypto.randomBytes(32).toString('hex');

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      await this.em.persistAndFlush(user);

      // Create the reset URL for the email
      const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

      // Email content
      const message = `
        <h1>Has solicitado restablecer tu contraseña</h1>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña. El enlace es válido por 1 hora.</p>
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        <p>Si no solicitaste esto, por favor ignora este correo.</p>
      `;

      // Send the email
      await sendEmail({
        to: user.mail,
        subject: 'Restablecimiento de Contraseña - UpSkill',
        html: message,
      });
    }
    // If user is not found, the function completes without error, hiding that fact from potential attackers.
  }

  public async resetPassword(token: string, password_plaintext: string): Promise<void> {
    // Find the user by the token and check if it hasn't expired
    const user = await this.em.findOne(User, {
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error('El token es inválido o ha expirado.');
    }

    // Hash the new password
    const SALT_ROUNDS = 10;
    user.password = await bcrypt.hash(password_plaintext, SALT_ROUNDS);

    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.em.persistAndFlush(user);
  }

}
