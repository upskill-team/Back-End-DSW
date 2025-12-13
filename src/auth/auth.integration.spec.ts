import { MikroORM, EntityManager } from '@mikro-orm/core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../models/user/user.entity.js';
import { Student } from '../models/student/student.entity.js';
import { RefreshToken } from './refreshToken.entity.js';
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
      const registerData = {
        mail: 'newuser@test.com',
        password_plaintext: 'password123',
        name: 'John',
        surname: 'Doe',
        role: UserRole.STUDENT,
      };

      const result = await authService.register(registerData as any);

      expect(result.id).toBeDefined();
      expect(result.mail).toBe('newuser@test.com');
      
      const savedUser = await em.findOne(User, { mail: 'newuser@test.com' });
      expect(savedUser).toBeDefined();
      expect(savedUser!.id).toEqual(result.id);
    });

    it('should hash password before persisting', async () => {
      const registerData = {
        mail: 'hashtest@test.com',
        password_plaintext: 'plainPassword123',
        name: 'Hash',
        surname: 'Test',
        role: UserRole.STUDENT,
      };

      await authService.register(registerData as any);

      const freshEm = orm.em.fork();
      const savedUser = await freshEm.findOne(User, {
        mail: 'hashtest@test.com',
      });
      expect(savedUser?.password).not.toBe('plainPassword123');

      const isValidHash = await bcrypt.compare(
        'plainPassword123',
        savedUser!.password
      );
      expect(isValidHash).toBe(true);
    });

    it('should create student profile associated to user', async () => {
      const registerData = {
        mail: 'student@test.com',
        password_plaintext: 'password123',
        name: 'Student',
        surname: 'Profile',
        role: UserRole.STUDENT,
      };

      await authService.register(registerData as any);

      const savedUser = await em.findOne(
        User,
        { mail: 'student@test.com' },
        { populate: ['studentProfile'] }
      );
      expect(savedUser?.studentProfile).toBeDefined();
      expect(savedUser?.studentProfile).toBeInstanceOf(Student);
    });

    it('should reject registration with duplicate email', async () => {
      await userFactory.create(em, { mail: 'existing@test.com' });

      const registerData = {
        mail: 'existing@test.com',
        password_plaintext: 'password123',
        name: 'Duplicate',
        surname: 'User',
        role: UserRole.STUDENT,
      };

      await expect(authService.register(registerData as any)).rejects.toThrow(
        'Email already used'
      );
    });

    it('should not persist user when email already exists', async () => {
      await userFactory.create(em, { mail: 'duplicate@test.com' });
      const initialCount = await em.count(User, { mail: 'duplicate@test.com' });

      const registerData = {
        mail: 'duplicate@test.com',
        password_plaintext: 'password123',
        name: 'Another',
        surname: 'User',
        role: UserRole.STUDENT,
      };

      try {
        await authService.register(registerData as any);
      } catch {
        // Expected
      }

      const finalCount = await em.count(User, { mail: 'duplicate@test.com' });
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('login', () => {
    it('should return valid JWT token and Refresh Token with correct credentials', async () => {
      const password = 'correctPassword123';
      await userFactory.create(em, {
        mail: 'login@test.com',
        password: password,
      });

      const result = await authService.login({
        mail: 'login@test.com',
        password_plaintext: password,
        rememberMe: true, 
      });

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
      expect(result).toHaveProperty('refreshToken'); 
      expect(typeof result.refreshToken).toBe('string');

      const decoded = jwt.verify(
        result.accessToken, 
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBe(UserRole.STUDENT);
    });

    it('should create a refresh token in the database when rememberMe is true', async () => {
        const password = 'pass';
        const user = await userFactory.create(em, {
            mail: 'rt@test.com',
            password: password
        });

        await authService.login({
            mail: 'rt@test.com',
            password_plaintext: password,
            rememberMe: true 
        });

        const storedRt = await em.findOne(RefreshToken, { user: user });
        expect(storedRt).toBeDefined();
        expect(storedRt?.revoked).toBe(false);
    });

    it('should include correct data in token payload', async () => {
      const user = await userFactory.create(em, {
        mail: 'payload@test.com',
        password: 'password123',
        role: UserRole.PROFESSOR,
      });

      const result = await authService.login({
        mail: 'payload@test.com',
        password_plaintext: 'password123',
        rememberMe: false, 
      });

      const decoded = jwt.verify(
        result.accessToken, 
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded).toHaveProperty('id', user.id?.toString());
      expect(decoded).toHaveProperty('role', UserRole.PROFESSOR);
    });

    it('should throw error when user does not exist', async () => {
      await expect(
        authService.login({
          mail: 'nonexistent@test.com',
          password_plaintext: 'password123',
          rememberMe: false,
        })
      ).rejects.toThrow('Credenciales inválidas.');
    });

    it('should throw error when password is incorrect', async () => {
      await userFactory.create(em, {
        mail: 'wrongpass@test.com',
        password: 'correctPassword',
      });

      await expect(
        authService.login({
          mail: 'wrongpass@test.com',
          password_plaintext: 'wrongPassword',
          rememberMe: false,
        })
      ).rejects.toThrow('Credenciales inválidas.');
    });

    it('should allow login for users with PROFESSOR role', async () => {
      await userFactory.create(em, {
        mail: 'professor@test.com',
        password: 'profPass123',
        role: UserRole.PROFESSOR,
      });

      const result = await authService.login({
        mail: 'professor@test.com',
        password_plaintext: 'profPass123',
        rememberMe: false,
      });

      expect(result).toHaveProperty('accessToken'); 

      const decoded = jwt.verify(
        result.accessToken, 
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded.role).toBe(UserRole.PROFESSOR);
    });
  });

  describe('register + login flow', () => {
    it('should allow login immediately after registration', async () => {
      const registerData = {
        mail: 'flow@test.com',
        password_plaintext: 'flowPassword123',
        name: 'Flow',
        surname: 'Test',
        role: UserRole.STUDENT,
      };

      await authService.register(registerData as any);
      em.clear();

      const loginResult = await authService.login({
        mail: 'flow@test.com',
        password_plaintext: 'flowPassword123',
        rememberMe: false,
      });

      expect(loginResult).toHaveProperty('accessToken');
      
      const decoded = jwt.verify(
        loginResult.accessToken,
        process.env.JWT_SECRET || 'hyp3rS3cr3t_JW7_t0k3n_dsw'
      ) as any;
      expect(decoded.id).toBeDefined();
    });
  });
});