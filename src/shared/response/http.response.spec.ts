import { Response } from 'express';
import { HttpResponse, HttpStatus } from './http.response';

describe('HttpResponse - Unit Tests', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('Ok', () => {
    it('should return 200 status with success message', () => {
      const data = { id: 1, name: 'Test' };
      
      HttpResponse.Ok(mockRes as Response, data);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: 'Success',
        data: data,
      });
    });

    it('should return 200 without data if not provided', () => {
      HttpResponse.Ok(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: 'Success',
        data: undefined,
      });
    });
  });

  describe('Created', () => {
    it('should return 201 status with created message', () => {
      const data = { id: 2, name: 'New Item' };
      
      HttpResponse.Created(mockRes as Response, data);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.CREATED,
        message: 'Created',
        data: data,
      });
    });

    it('should return 201 without data if not provided', () => {
      HttpResponse.Created(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.CREATED,
        message: 'Created',
        data: undefined,
      });
    });
  });

  describe('BadRequest', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 400 status with error message in development', () => {
      process.env.NODE_ENV = 'development';
      const errors = { field: 'Email is invalid' };
      
      HttpResponse.BadRequest(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        errors: errors,
      });
    });

    it('should return generic message for object errors in production', () => {
      process.env.NODE_ENV = 'production';
      const errors = { field: 'Email is invalid', details: 'Detailed error' };
      
      HttpResponse.BadRequest(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        errors: 'La solicitud contiene datos inválidos.',
      });
    });

    it('should return string errors as-is in production', () => {
      process.env.NODE_ENV = 'production';
      const errors = 'Email already exists';
      
      HttpResponse.BadRequest(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        errors: errors,
      });
    });

    it('should handle undefined errors', () => {
      process.env.NODE_ENV = 'development';
      
      HttpResponse.BadRequest(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        errors: undefined,
      });
    });
  });

  describe('Unauthorized', () => {
    it('should return 401 status with error message', () => {
      const errors = 'Invalid credentials';
      
      HttpResponse.Unauthorized(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        errors: errors,
      });
    });

    it('should return 401 without errors if not provided', () => {
      HttpResponse.Unauthorized(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        errors: undefined,
      });
    });
  });

  describe('NotFound', () => {
    it('should return 404 status with error message', () => {
      const errors = 'User not found';
      
      HttpResponse.NotFound(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        errors: errors,
      });
    });

    it('should return 404 without errors if not provided', () => {
      HttpResponse.NotFound(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        errors: undefined,
      });
    });
  });

  describe('InternalServerError', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 500 status with detailed errors in development', () => {
      process.env.NODE_ENV = 'development';
      const errors = 'Database connection failed';
      
      HttpResponse.InternalServerError(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        errors: errors,
      });
    });

    it('should return generic message in production', () => {
      process.env.NODE_ENV = 'production';
      const errors = 'Database connection failed';
      
      HttpResponse.InternalServerError(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        errors: 'Ocurrió un error interno en el servidor. Por favor, contacte al soporte.',
      });
    });

    it('should handle undefined errors in production', () => {
      process.env.NODE_ENV = 'production';
      
      HttpResponse.InternalServerError(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        errors: 'Ocurrió un error interno en el servidor. Por favor, contacte al soporte.',
      });
    });

    it('should return detailed errors in development when undefined', () => {
      process.env.NODE_ENV = 'development';
      
      HttpResponse.InternalServerError(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        errors: undefined,
      });
    });
  });

  describe('HttpStatus Enum', () => {
    it('should have correct status code values', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });
});
