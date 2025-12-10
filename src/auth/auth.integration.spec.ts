import { MikroORM, EntityManager } from '@mikro-orm/core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../models/user/user.entity.js';
import { Student } from '../models/student/student.entity.js';
import { RefreshToken } from './refreshToken.entity.js'; // Imported RefreshToken
import {
  initTestDb,
  clearDatabase,
  closeTestDb,
} from '../shared/testing/test-helpers.js';
import { userFactory } from '../shared/testing/factories/index.js';
import { Logger } from 'pino';

describe('AuthService - Integration Tests', () => {
  let orm: MikroORM;
  let em: EntityManager;
  let authService: AuthService;
  let mockLogger: jest.Mocked<Logger>;

  beforeAll(async () => {
    orm = await initTestDb();
  });

  beforeEach(async () => {
    await clearDatabase(orm);
    em = orm.em.fork();

    mockLogger = {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    authService = new AuthService(em, mockLogger);
  });

  afterAll(async () => {
    await closeTestDb(orm);
  });

  describe('register', () => {
    it('should persist user and student profile to database', async () => {
      // 1. Arrange
      const registerData = {
        mail: 'newuser@test.com',
        password_plaintext: 'password123',
        name: 'John',
        surname: 'Doe',
        role: UserRole.STUDENT,
      };

      // 2. Act
      const result = await authService.register(registerData as any);

      // 3. Assert
      expect(result.id).toBeDefined();
      expect(result.mail).toBe('newuser@test.com');
      expect(result.name).toBe('John');
      expect(result.surname).toBe('Doe');

      // Verificar que se guardó en DB
      const savedUser = await em.findOne(User, { mail: 'newuser@test.com' });
      expect(savedUser).toBeDefined();
      expect(savedUser!.id).toEqual(result.id);
    });

    it('should hash password before persisting', async () => {
      // 1. Arrange
      const registerData = {
        mail: 'hashtest@test.com',
        password_plaintext: 'plainPassword123',
        name: 'Hash',
        surname: 'Test',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // 3. Assert
      // Crear un nuevo fork del EM para obtener datos frescos de DB
      const freshEm = orm.em.fork();
      const savedUser = await freshEm.findOne(User, {
        mail: 'hashtest@test.com',
      });
      expect(savedUser?.password).toBeDefined();
      expect(savedUser?.password).not.toBe('plainPassword123');

      // Verificar que es un hash de bcrypt válido
      const isValidHash = await bcrypt.compare(
        'plainPassword123',
        savedUser!.password
      );
      expect(isValidHash).toBe(true);
    });

    it('should create student profile associated to user', async () => {
      // 1. Arrange
      const registerData = {
        mail: 'student@test.com',
        password_plaintext: 'password123',
        name: 'Student',
        surname: 'Profile',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // 3. Assert
      const savedUser = await em.findOne(
        User,
        { mail: 'student@test.com' },
        { populate: ['studentProfile'] }
      );
      expect(savedUser?.studentProfile).toBeDefined();
      expect(savedUser?.studentProfile).toBeInstanceOf(Student);
    });

    it('should reject registration with duplicate email', async () => {
      // 1. Arrange
      await userFactory.create(em, { mail: 'existing@test.com' });

      const registerData = {
        mail: 'existing@test.com',
        password_plaintext: 'password123',
        name: 'Duplicate',
        surname: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act & Assert
      await expect(authService.register(registerData as any)).rejects.toThrow(
        'Email already used'
      );
    });

    it('should not persist user when email already exists', async () => {
      // 1. Arrange
      await userFactory.create(em, { mail: 'duplicate@test.com' });

      const initialCount = await em.count(User, { mail: 'duplicate@test.com' });

      const registerData = {
        mail: 'duplicate@test.com',
        password_plaintext: 'password123',
        name: 'Another',
        surname: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act
      try {
        await authService.register(registerData as any);
      } catch {
        // Expected
      }

      // 3. Assert
      const finalCount = await em.count(User, { mail: 'duplicate@test.com' });
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('login', () => {
    it('should return valid JWT token and Refresh Token with correct credentials', async () => {
      // 1. Arrange
      const password = 'correctPassword123';
      await userFactory.create(em, {
        mail: 'login@test.com',
        password: password,
      });

      // 2. Act
      const result = await authService.login({
        mail: 'login@test.com',
        password_plaintext: password,
      });

      // 3. Assert
      expect(result).toHaveProperty('accessToken'); // Changed check
      expect(typeof result.accessToken).toBe('string');
      expect(result).toHaveProperty('refreshToken'); // Added check
      expect(typeof result.refreshToken).toBe('string');

      // Verificar que el token es válido
      const decoded = jwt.verify(
        result.accessToken, // Updated property
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBe(UserRole.STUDENT);
    });

    it('should create a refresh token in the database', async () => {
        // 1. Arrange
        const password = 'pass';
        const user = await userFactory.create(em, {
            mail: 'rt@test.com',
            password: password
        });

        // 2. Act
        await authService.login({
            mail: 'rt@test.com',
            password_plaintext: password
        });

        // 3. Assert
        const storedRt = await em.findOne(RefreshToken, { user: user });
        expect(storedRt).toBeDefined();
        expect(storedRt?.revoked).toBe(false);
    });

    it('should include correct data in token payload', async () => {
      // 1. Arrange
      const user = await userFactory.create(em, {
        mail: 'payload@test.com',
        password: 'password123',
        role: UserRole.PROFESSOR,
      });

      // 2. Act
      const result = await authService.login({
        mail: 'payload@test.com',
        password_plaintext: 'password123',
      });

      // 3. Assert
      const decoded = jwt.verify(
        result.accessToken, // Updated property
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded).toHaveProperty('id', user.id?.toString());
      expect(decoded).toHaveProperty('role', UserRole.PROFESSOR);
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
    });

    it('should throw error when user does not exist', async () => {
      // 1. Arrange
      // No crear ningún usuario

      // 2. Act & Assert
      await expect(
        authService.login({
          mail: 'nonexistent@test.com',
          password_plaintext: 'password123',
        })
      ).rejects.toThrow('Credenciales inválidas.');
    });

    it('should throw error when password is incorrect', async () => {
      // 1. Arrange
      await userFactory.create(em, {
        mail: 'wrongpass@test.com',
        password: 'correctPassword',
      });

      // 2. Act & Assert
      await expect(
        authService.login({
          mail: 'wrongpass@test.com',
          password_plaintext: 'wrongPassword',
        })
      ).rejects.toThrow('Credenciales inválidas.');
    });

    it('should allow login for users with PROFESSOR role', async () => {
      // 1. Arrange
      await userFactory.create(em, {
        mail: 'professor@test.com',
        password: 'profPass123',
        role: UserRole.PROFESSOR,
      });

      // 2. Act
      const result = await authService.login({
        mail: 'professor@test.com',
        password_plaintext: 'profPass123',
      });

      // 3. Assert
      expect(result).toHaveProperty('accessToken'); // Updated property

      const decoded = jwt.verify(
        result.accessToken, // Updated property
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded.role).toBe(UserRole.PROFESSOR);
    });
  });

  describe('register + login flow', () => {
    it('should allow login immediately after registration', async () => {
      // 1. Arrange
      const registerData = {
        mail: 'flow@test.com',
        password_plaintext: 'flowPassword123',
        name: 'Flow',
        surname: 'Test',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // Limpiar identity map para forzar recarga de DB
      em.clear();

      const loginResult = await authService.login({
        mail: 'flow@test.com',
        password_plaintext: 'flowPassword123',
      });

      // 3. Assert
      expect(loginResult).toHaveProperty('accessToken');

      const decoded = jwt.verify(
        loginResult.accessToken, // Updated property
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded.id).toBeDefined();
    });
  });
});