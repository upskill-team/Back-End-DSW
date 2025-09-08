/**
 * @module Docs/SwaggerConfig
 * @remarks Provides Swagger/OpenAPI configuration for API documentation generation.
 */

import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Swagger API documentation configuration for the UpSkill learning platform.
 *
 * This configuration defines the OpenAPI 3.0 specification including:
 * - API metadata and contact information
 * - Server configurations for different environments
 * - Reusable security schemes, schemas, and responses
 * - Global security requirements
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'UpSkill API',
    version: '1.0.0',
    description:
      'A comprehensive API documentation for the UpSkill learning platform.',
    contact: {
      name: 'UpSkill Team',
      url: 'https://github.com/upskill-team/Back-End-DSW',
    },
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
        description: 'Input your JWT token in the format: Bearer {token}',
      },
    },
    schemas: {
      ValidationError: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Bad Request' },
          errors: {
            type: 'object',
            description: 'Object detailing which fields failed validation.',
            example: {
              name: ['Name is required.'],
              questionText: ['Question text is required.'],
              payload: {
                options: ['At least 2 options are required.'],
                correctAnswer: ['Correct answer index must be an integer.'],
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer' },
          message: { type: 'string' },
          errors: { type: 'string', example: 'A detailed error message.' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              status: 401,
              message: 'Unauthorized',
              errors:
                'Token de autorización no proporcionado o con formato incorrecto.',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Client does not have access rights to the content.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            examples: {
              rolePermission: {
                summary: 'Insufficient role permissions',
                value: {
                  status: 403,
                  message: 'Forbidden',
                  errors: 'No tienes permiso para realizar esta acción.',
                },
              },
              resourceOwnership: {
                summary: 'Resource ownership required',
                value: {
                  status: 403,
                  message: 'Forbidden',
                  errors:
                    'User is not a professor or does not own this resource.',
                },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'The specified resource was not found.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            examples: {
              general: {
                summary: 'Resource not found',
                value: {
                  status: 404,
                  message: 'Not Found',
                  errors: 'Resource not found',
                },
              },
              course: {
                summary: 'Course not found',
                value: {
                  status: 404,
                  message: 'Not Found',
                  errors: 'Course not found.',
                },
              },
              question: {
                summary: 'Question not found',
                value: {
                  status: 404,
                  message: 'Not Found',
                  errors: 'Question not found.',
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

/**
 * Configuration options for swagger-jsdoc.
 *
 * @type {swaggerJSDoc.Options}
 */
const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ['./src/docs/**/*.yaml'],
};

/**
 * Generated Swagger specification object based on the configuration.
 * This object contains the complete OpenAPI specification that can be used
 * by Swagger UI or other OpenAPI tools.
 *
 * @type {object} The complete OpenAPI 3.0 specification
 */
export const swaggerSpec = swaggerJSDoc(options);
