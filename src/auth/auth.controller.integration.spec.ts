import { Request, Response } from 'express';

// 1. Mock the ORM module BEFORE import
jest.mock('../shared/db/orm', () => ({
  orm: {
    em: {
      fork: jest.fn(() => ({})),
    },
  },
}));

// 2. Mock AuthService
jest.mock('./auth.service');

// 3. Imports
import { login } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController Integration', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockReq = {
      // Body original sin rememberMe
      body: { mail: 'test@test.com', password_plaintext: '123456' },
      log: { child: () => ({ info: jest.fn(), error: jest.fn() }) } as any 
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    
    nextFn = jest.fn();
    jest.clearAllMocks();
  });

  it('Should integrate Controller and Service for a successful login', async () => {
    const mockTokens = { 
      accessToken: 'integration_access_token',
      refreshToken: 'integration_refresh_token'
    };
    
    // Configure the Service mock
    (AuthService.prototype.login as jest.Mock).mockResolvedValue(mockTokens);

    // Execute the Controller
    await login(mockReq as Request, mockRes as Response, nextFn);

    // Verifications
    expect(AuthService.prototype.login).toHaveBeenCalledWith({
      mail: 'test@test.com',
      password_plaintext: '123456',
      rememberMe: false 
    });
    
    // 1. Check Cookie was set (HttpOnly) because refreshToken is present
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken', 
      'integration_refresh_token',
      expect.objectContaining({ httpOnly: true })
    );

    // 2. Check JSON response (Only Access Token)
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Success',
      data: { token: 'integration_access_token' }
    }));
  });
});