import { AuthService } from './auth.service.js';
import { User, UserRole } from '../models/user/user.entity.js';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService - Unit Tests', () => {
  let authService: AuthService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockEm = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    mockLogger = {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    authService = new AuthService(mockEm, mockLogger);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password before saving user', async () => {
      // 1. Arrange
      const hashedPassword = '$2a$10$hashedPasswordExample';
      mockEm.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockUser = {
        id: '123',
        role: UserRole.STUDENT,
        password: hashedPassword,
      } as User;
      mockEm.create.mockReturnValue(mockUser);

      const registerData = {
        mail: 'test@test.com',
        password_plaintext: 'plainPassword123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // 3. Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
    });

    it('should create user with provided data', async () => {
      // 1. Arrange
      mockEm.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');

      const mockUser = { id: '123' } as User;
      mockEm.create.mockReturnValue(mockUser);

      const registerData = {
        mail: 'test@test.com',
        password_plaintext: 'password123',
        name: 'John',
        surname: 'Doe',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // 3. Assert
      expect(mockEm.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          mail: 'test@test.com',
          name: 'John',
          surname: 'Doe',
          role: UserRole.STUDENT,
        })
      );
    });

    it('should persist user and student profile', async () => {
      // 1. Arrange
      mockEm.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');

      const mockUser = { id: '123' } as User;
      mockEm.create.mockReturnValue(mockUser);

      const registerData = {
        mail: 'test@test.com',
        password_plaintext: 'password123',
        name: 'Test',
        surname: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // 3. Assert
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should verify email does not exist before registering', async () => {
      // 1. Arrange
      mockEm.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');
      mockEm.create.mockReturnValue({ id: '123' } as User);

      const registerData = {
        mail: 'test@test.com',
        password_plaintext: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act
      await authService.register(registerData as any);

      // 3. Assert
      expect(mockEm.findOne).toHaveBeenCalledWith(User, {
        mail: 'test@test.com',
      });
    });

    it('should throw error when email already exists', async () => {
      // 1. Arrange
      const existingUser = { id: '123', mail: 'existing@test.com' } as User;
      mockEm.findOne.mockResolvedValue(existingUser);

      const registerData = {
        mail: 'existing@test.com',
        password_plaintext: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act & Assert
      await expect(authService.register(registerData as any)).rejects.toThrow(
        'Email already used'
      );
    });

    it('should not persist user when email already exists', async () => {
      // 1. Arrange
      const existingUser = { id: '123', mail: 'existing@test.com' } as User;
      mockEm.findOne.mockResolvedValue(existingUser);

      const registerData = {
        mail: 'existing@test.com',
        password_plaintext: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      // 2. Act
      try {
        await authService.register(registerData as any);
      } catch (error) {
        // Expected
      }

      // 3. Assert
      expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return JWT token when credentials are correct', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.STUDENT,
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt.token.here');

      // 2. Act
      const result = await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'correctPassword',
      });

      // 3. Assert
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('jwt.token.here');
    });

    it('should find user by email in database', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      // 2. Act
      await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'password',
      });

      // 3. Assert
      expect(mockEm.findOne).toHaveBeenCalledWith(User, {
        mail: 'test@test.com',
      });
    });

    it('should verify password with bcrypt', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      // 2. Act
      await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'plainPassword',
      });

      // 3. Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword',
        'hashedPassword'
      );
    });

    it('should include id and role in token payload', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.PROFESSOR,
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      // 2. Act
      await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'password',
      });

      // 3. Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          role: UserRole.PROFESSOR,
        }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should throw error when user does not exist', async () => {
      // 1. Arrange
      mockEm.findOne.mockResolvedValue(null);

      // 2. Act & Assert
      await expect(
        authService.login({
          mail: 'nonexistent@test.com',
          password_plaintext: 'password',
        })
      ).rejects.toThrow();
    });

    it('should throw error when password is incorrect', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // 2. Act & Assert
      await expect(
        authService.login({
          mail: 'test@test.com',
          password_plaintext: 'wrongPassword',
        })
      ).rejects.toThrow();
    });

    it('should not generate token when password is incorrect', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // 2. Act
      try {
        await authService.login({
          mail: 'test@test.com',
          password_plaintext: 'wrongPassword',
        });
      } catch (error) {
        // Expected
      }

      // 3. Assert
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
