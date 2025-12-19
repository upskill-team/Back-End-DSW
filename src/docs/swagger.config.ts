/**
 * @module Docs/SwaggerConfig
 * @remarks Provides Swagger/OpenAPI configuration for API documentation generation.
 */

import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Swagger API documentation configuration for the UpSkill learning platform.
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'UpSkill API',
    version: '1.0.0',
    description:
      'A comprehensive API for the UpSkill learning platform. Manage courses, students, professors, institutions and more.',
    contact: {
      name: 'GitHub Repository',
      url: 'https://github.com/upskill-team/Back-End-DSW',
    },
  },
  externalDocs: {
    description: 'UpSkill Platform',
    url: 'https://up-skill.app',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token stored in HttpOnly cookie',
      },
    },
    schemas: {
      BaseEntity: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB unique identifier',
            example: '507f1f77bcf86cd799439011',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation date',
            example: '2024-12-19T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update date',
            example: '2024-12-19T15:45:00.000Z',
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Validation Error' },
          errors: {
            type: 'object',
            description: 'Details of fields with validation errors',
            example: {
              name: ['Name is required.'],
              mail: ['Email is not valid.'],
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 500 },
          message: { type: 'string', example: 'Internal Server Error' },
          errors: {
            type: 'string',
            example: 'An unexpected error occurred.',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              status: 401,
              message: 'Unauthorized',
              errors:
                'Authorization token not provided or incorrectly formatted.',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Client does not have permission to access this resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              status: 403,
              message: 'Forbidden',
              errors:
                'You do not have the necessary permissions to perform this action.',
            },
          },
        },
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              status: 404,
              message: 'Not Found',
              errors: 'The requested resource does not exist.',
            },
          },
        },
      },
      ValidationError: {
        description: 'Data validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
        },
      },
    },
    parameters: {
      IdParameter: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Unique identifier of the resource',
        schema: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
      PageParameter: {
        name: 'page',
        in: 'query',
        description: 'Page number',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
          example: 1,
        },
      },
      LimitParameter: {
        name: 'limit',
        in: 'query',
        description: 'Items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
          example: 10,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and user session management',
    },
    {
      name: 'Users',
      description: 'User profile management',
    },
    {
      name: 'Courses',
      description: 'Course and educational content management',
    },
    {
      name: 'Course Types',
      description: 'Course categories and types',
    },
    {
      name: 'Institutions',
      description: 'Educational institution management',
    },
    {
      name: 'Professors',
      description: 'Professor profiles and management',
    },
    {
      name: 'Students',
      description: 'Student profiles and management',
    },
    {
      name: 'Enrollments',
      description: 'Student course enrollments',
    },
    {
      name: 'Assessments',
      description: 'Assessments and quizzes',
    },
    {
      name: 'Payments',
      description: 'Payment processing',
    },
    {
      name: 'Appeals',
      description: 'Appeals and requests',
    },
    {
      name: 'Join Requests',
      description: 'Requests to join institutions',
    },
    {
      name: 'Materials',
      description: 'Learning materials',
    },
    {
      name: 'Admin',
      description: 'Administrative functions',
    },
    {
      name: 'Contact',
      description: 'Contact messages',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ['./src/docs/**/*.yaml'],
};

export const swaggerSpec = swaggerJSDoc(options);
