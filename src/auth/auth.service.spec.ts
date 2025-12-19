import 'reflect-metadata';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../models/user/user.entity.js';
import { RefreshToken } from './refreshToken.entity.js';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

jest.mock('../shared/services/email.service.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

let capturedProps: any = null;

jest.mock('../emails/templates/ResetPasswordEmail.js', () => ({
  ResetPasswordEmail: jest.fn((props) => {
    capturedProps = props;
    return { type: 'ResetPasswordEmail', props };
  }),
}));

jest.mock('@react-email/render', () => ({
  render: jest.fn().mockReturnValue('<html>Mocked Email</html>'),
}));

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn((size) => {
      // Return different values based on context (32 bytes for reset token, 40 for refresh)
      if (size === 32) {
        return { toString: () => 'mockresettoken12345' };
      }
      return { toString: () => 'mockRefreshToken' };
    }),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mockedHashedToken'),
    })),
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

      await authService.register(registerData as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
    });

    it('should create user with provided data', async () => {
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

      await authService.register(registerData as any);

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
      const existingUser = { id: '123', mail: 'existing@test.com' } as User;
      mockEm.findOne.mockResolvedValue(existingUser);

      const registerData = {
        mail: 'existing@test.com',
        password_plaintext: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      await expect(authService.register(registerData as any)).rejects.toThrow(
        'Email already used'
      );
    });
  });

  describe('login', () => {
    it('should return JWT access token and refresh token when credentials are correct', async () => {
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.STUDENT,
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      mockEm.create.mockImplementation(
        (entity, data) => ({ ...data, id: 'rt_123' } as any)
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt.access.token');

      const result = await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'correctPassword',
        rememberMe: true,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('jwt.access.token');

      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toBe('mockRefreshToken');

      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });

    it('should return only access token when rememberMe is false', async () => {
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.STUDENT,
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt.access.token');

      const result = await authService.login({
        mail: 'test@test.com',
        password_plaintext: 'correctPassword',
        rememberMe: false,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('jwt.access.token');

      expect(result.refreshToken).toBeUndefined();

      expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
    });

    it('should throw error when user does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        authService.login({
          mail: 'nonexistent@test.com',
          password_plaintext: 'password',
          rememberMe: false,
        })
      ).rejects.toThrow();
    });

    it('should throw error when password is incorrect', async () => {
      const mockUser = {
        id: '123',
        mail: 'test@test.com',
        password: 'hashedPassword',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          mail: 'test@test.com',
          password_plaintext: 'wrongPassword',
          rememberMe: false,
        })
      ).rejects.toThrow('Credenciales inválidas.');
    });
  });

  describe('refreshToken (Rotation)', () => {
    it('should rotate tokens: revoke old one and issue new pair', async () => {
      const mockUser = { id: '123', role: UserRole.STUDENT } as User;
      const existingToken = {
        token: 'oldToken',
        user: mockUser,
        expiresAt: new Date(Date.now() + 10000),
        revoked: false,
      } as RefreshToken;

      mockEm.findOne.mockResolvedValue(existingToken);
      mockEm.create.mockImplementation((entity, data) => data as any);
      (jwt.sign as jest.Mock).mockReturnValue('new.access.token');

      const result = await authService.refreshToken('oldToken');

      expect(result.accessToken).toBe('new.access.token');
      expect(result.refreshToken).toBe('mockRefreshToken');

      expect(existingToken.revoked).toBe(true);
      expect(existingToken.replacedByToken).toBe('mockRefreshToken');

      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ token: 'oldToken', revoked: true }),
          expect.objectContaining({
            token: 'mockRefreshToken',
            revoked: false,
          }),
        ])
      );
    });

    it('should detect reuse of revoked token and trigger security breach (revoke all)', async () => {
      const mockUser = { id: '123' } as User;
      const stolenToken = {
        token: 'stolenToken',
        user: mockUser,
        revoked: true,
      } as RefreshToken;

      mockEm.findOne.mockResolvedValue(stolenToken);

      await expect(authService.refreshToken('stolenToken')).rejects.toThrow(
        'Security breach detected. Please login again.'
      );

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
      const tokenString = 'valid-refresh-token';
      const mockTokenEntity = {
        token: tokenString,
        revoked: false,
      } as RefreshToken;

      mockEm.findOne.mockResolvedValue(mockTokenEntity);

      await authService.logout(tokenString);

      expect(mockEm.findOne).toHaveBeenCalledWith(RefreshToken, {
        token: tokenString,
      });
      expect(mockTokenEntity.revoked).toBe(true);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should do nothing if token is not found (idempotent)', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await authService.logout('non-existent-token');

      expect(mockEm.flush).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    let sendEmail: jest.Mock;
    let render: jest.Mock;

    beforeEach(async () => {
      const emailService = await import('../shared/services/email.service.js');
      const reactEmail = await import('@react-email/render');
      sendEmail = emailService.sendEmail as jest.Mock;
      render = reactEmail.render as jest.Mock;

      jest.clearAllMocks();
      capturedProps = null;
      sendEmail.mockResolvedValue(true);
      render.mockReturnValue('<html>Mocked Email</html>');
    });

    it('should set reset token expiration to 15 minutes (900000 ms)', async () => {
      // Arrange
      const mockUser = {
        id: '123',
        mail: 'test@example.com',
        name: 'Test User',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);
      const startTime = Date.now();

      // Act
      await authService.forgotPassword('test@example.com');

      // Assert
      expect(mockUser.resetPasswordExpires).toBeDefined();
      const expirationTime = mockUser.resetPasswordExpires!.getTime();
      const expectedTime = startTime + 900000; // 15 minutes in milliseconds

      // Allow 1 second tolerance for test execution time
      expect(expirationTime).toBeGreaterThanOrEqual(expectedTime - 1000);
      expect(expirationTime).toBeLessThanOrEqual(expectedTime + 1000);
    });

    it('should use production URL when NODE_ENV is production', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockUser = {
        id: '123',
        mail: 'test@example.com',
        name: 'Test User',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);

      // Act
      await authService.forgotPassword('test@example.com');

      // Assert
      expect(capturedProps).not.toBeNull();
      expect(capturedProps.resetUrl).toContain(
        'https://up-skill.app/reset-password?token='
      );
      expect(capturedProps.resetUrl).toContain('mockresettoken12345');

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should use localhost URL when NODE_ENV is not production', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockUser = {
        id: '123',
        mail: 'test@example.com',
        name: 'Test User',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);

      // Act
      await authService.forgotPassword('test@example.com');

      // Assert
      expect(capturedProps).not.toBeNull();
      expect(capturedProps.resetUrl).toContain(
        'https://localhost:5173/reset-password?token='
      );
      expect(capturedProps.resetUrl).toContain('mockresettoken12345');

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should generate reset token and send email successfully', async () => {
      // Arrange
      const mockUser = {
        id: '123',
        mail: 'test@example.com',
        name: 'Test User',
      } as User;

      mockEm.findOne.mockResolvedValue(mockUser);

      // Act
      await authService.forgotPassword('test@example.com');

      // Assert
      expect(mockUser.resetPasswordToken).toBeDefined();
      expect(mockUser.resetPasswordToken).toBe('mockedHashedToken');
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(mockUser);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Restablecimiento de Contraseña - UpSkill',
          html: '<html>Mocked Email</html>',
        })
      );
    });

    it('should not send email if user does not exist', async () => {
      // Arrange
      mockEm.findOne.mockResolvedValue(null);

      // Act
      await authService.forgotPassword('nonexistent@example.com');

      // Assert
      expect(sendEmail).not.toHaveBeenCalled();
      expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
    });
  });
});
