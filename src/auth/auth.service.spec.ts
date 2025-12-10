import 'reflect-metadata';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../models/user/user.entity.js';
import { RefreshToken } from './refreshToken.entity.js';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// FIX: Usamos la implementación real de crypto para no romper MikroORM, 
// y solo mockeamos randomBytes que es lo que necesitamos controlar.
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn().mockReturnValue({ toString: () => 'mockRefreshToken' }),
  };
});

describe('AuthService - Unit Tests', () => {
  let authService: AuthService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockEm = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      nativeUpdate: jest.fn(),
      flush: jest.fn(),
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
      
      mockEm.create.mockImplementation((entity, data) => data as any);

      const registerData = {
        mail: 'test@test.com',
        password_plaintext: 'plainPassword123',
        name: 'Test',
        surname: 'User',
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

      mockEm.create.mockImplementation((entity, data) => data as any);

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
  });

  describe('login', () => {
    it('should return JWT access token and refresh token when credentials are correct', async () => {
      // 1. Arrange
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.STUDENT,
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      // Mock creation of RefreshToken entity to satisfy strict typing
      mockEm.create.mockImplementation((entity, data) => ({ ...data, id: 'rt_123' }) as any);
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt.access.token');

      // 2. Act
      const result = await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'correctPassword',
      });

      // 3. Assert
      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('jwt.access.token');
      
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toBe('mockRefreshToken');
      
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
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
      ).rejects.toThrow('Credenciales inválidas.');
    });
  });

  describe('refreshToken (Rotation)', () => {
    it('should rotate tokens: revoke old one and issue new pair', async () => {
      // 1. Arrange: Valid existing token
      const mockUser = { id: '123', role: UserRole.STUDENT } as User;
      const existingToken = {
        token: 'oldToken',
        user: mockUser,
        expiresAt: new Date(Date.now() + 10000), // Valid in future
        revoked: false,
      } as RefreshToken;

      mockEm.findOne.mockResolvedValue(existingToken);
      mockEm.create.mockImplementation((entity, data) => data as any);
      (jwt.sign as jest.Mock).mockReturnValue('new.access.token');

      // 2. Act
      const result = await authService.refreshToken('oldToken');

      // 3. Assert
      expect(result.accessToken).toBe('new.access.token');
      expect(result.refreshToken).toBe('mockRefreshToken');
      
      // Check rotation logic:
      expect(existingToken.revoked).toBe(true); // Old token revoked
      expect(existingToken.replacedByToken).toBe('mockRefreshToken'); // Linked to new
      
      // Should save both old (updated) and new tokens
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ token: 'oldToken', revoked: true }),
        expect.objectContaining({ token: 'mockRefreshToken', revoked: false })
      ]));
    });

    it('should detect reuse of revoked token and trigger security breach (revoke all)', async () => {
      // 1. Arrange: Revoked token
      const mockUser = { id: '123' } as User;
      const stolenToken = {
        token: 'stolenToken',
        user: mockUser,
        revoked: true, // Already used!
      } as RefreshToken;

      mockEm.findOne.mockResolvedValue(stolenToken);

      // 2. Act & Assert
      await expect(authService.refreshToken('stolenToken'))
        .rejects.toThrow('Security breach detected. Please login again.');

      // 3. Verify security measure: Revoke ALL tokens for this user
      expect(mockEm.nativeUpdate).toHaveBeenCalledWith(
        RefreshToken,
        { user: mockUser },
        { revoked: true }
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token provided', async () => {
      // 1. Arrange
      const tokenString = 'valid-refresh-token';
      const mockTokenEntity = {
        token: tokenString,
        revoked: false
      } as RefreshToken;

      mockEm.findOne.mockResolvedValue(mockTokenEntity);

      // 2. Act
      await authService.logout(tokenString);

      // 3. Assert
      expect(mockEm.findOne).toHaveBeenCalledWith(RefreshToken, { token: tokenString });
      expect(mockTokenEntity.revoked).toBe(true);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should do nothing if token is not found (idempotent)', async () => {
      // 1. Arrange
      mockEm.findOne.mockResolvedValue(null);

      // 2. Act
      await authService.logout('non-existent-token');

      // 3. Assert
      expect(mockEm.flush).not.toHaveBeenCalled();
    });
  });
});