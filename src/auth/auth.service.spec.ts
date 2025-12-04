import { AuthService } from './auth.service';
import { User, UserRole } from '../models/user/user.entity';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from 'pino';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- Mocks ---
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Helper type to avoid repeating the definition in every test
type RegisterInput = Omit<User, 'password'> & { password_plaintext: string };

describe('AuthService - Unit Tests', () => {
  let service: AuthService;
  let mockEm: jest.Mocked<EntityManager>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Mock Entity Manager
    mockEm = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // Mock Logger
    mockLogger = {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    service = new AuthService(mockEm, mockLogger);
    jest.clearAllMocks();
  });

  // --- TEST 1: Successful Registration Test ---
  it('TEST 1: Should register a user successfully', async () => {
    // 1. Setup
    mockEm.findOne.mockResolvedValue(null); // User does not exist
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pass');
    
    const mockUser = { id: '1', role: UserRole.STUDENT } as User;
    mockEm.create.mockReturnValue(mockUser);

    const inputData = {
      name: 'John',
      surname: 'Doe',
      mail: 'john@test.com',
      password_plaintext: 'password123',
    };

    // 2. Execution
    // Type casting input to satisfy TypeScript strict checks
    const result = await service.register(inputData as RegisterInput);

    // 3. Verification
    expect(mockEm.findOne).toHaveBeenCalledWith(User, { mail: 'john@test.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(mockEm.persistAndFlush).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  // --- TEST 2: Registration Error Test ---
  it('TEST 2: Should fail if email already exists', async () => {
    // 1. Setup: Email ALREADY exists
    mockEm.findOne.mockResolvedValue({ id: 'existing' } as User);

    const inputData = {
      name: 'Jane',
      surname: 'Doe',
      mail: 'jane@test.com',
      password_plaintext: '12345',
    };

    // 2. Execution & Verification
    await expect(service.register(inputData as RegisterInput)).rejects.toThrow('Email already used');

    expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
  });

  // --- TEST 3: Successful Login Test ---
  it('TEST 3: Should login and return token if credentials are valid', async () => {
    // 1. Setup
    const mockUser = { id: '1', password: 'hashed_pass', role: 'student' } as User;
    mockEm.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('fake_token_jwt');

    // 2. Execution
    const result = await service.login({
      mail: 'john@test.com',
      password_plaintext: 'password123'
    });

    // 3. Verification
    expect(result).toHaveProperty('token', 'fake_token_jwt');
    expect(jwt.sign).toHaveBeenCalled();
  });

  // --- TEST 4: Failed Login Test ---
  it('TEST 4: Should fail if password is incorrect', async () => {
    // 1. Setup
    const mockUser = { id: '1', password: 'hashed_pass' } as User;
    mockEm.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Incorrect password

    // 2. Execution & Verification
    await expect(service.login({
      mail: 'john@test.com',
      password_plaintext: 'wrong_password'
    })).rejects.toThrow('Credenciales inválidas.');
  });
});