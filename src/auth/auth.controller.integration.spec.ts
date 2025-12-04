import { Request, Response } from 'express';

// 1. Mock the ORM module (CRITICAL: Must be done before importing the controller)
jest.mock('../shared/db/orm', () => ({
  orm: {
    em: {
      fork: jest.fn(() => ({
        // Return an empty object or whatever AuthService needs if it used it directly
      })),
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
      body: { mail: 'test@test.com', password_plaintext: '123456' },
      log: { child: () => ({ info: jest.fn(), error: jest.fn() }) } as any 
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    nextFn = jest.fn();
    jest.clearAllMocks();
  });

  it('Should integrate Controller and Service for a successful login', async () => {
    const mockToken = { token: 'integration_test_token' };
    
    // Configure the Service mock
    (AuthService.prototype.login as jest.Mock).mockResolvedValue(mockToken);

    // Execute the Controller
    await login(mockReq as Request, mockRes as Response, nextFn);

    // Verifications
    expect(AuthService.prototype.login).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Success',
      data: mockToken
    }));
  });
});