/**
 * @module App
 * @remarks Main application entry point. This file configures and initializes the Express server,
 * including middleware setup, route registration, MikroORM integration, and error handling.
 * It serves as the central hub for assembling all parts of the application.
 */
import './shared/config/env.validator.js'
import express, { Response } from 'express'
import { courseTypeRouter } from './models/courseType/courseType.routes.js'
import { institutionRouter } from './models/institution/institution.routes.js'
import { studentRouter } from './models/student/student.routes.js'
import { professorRouter } from './models/professor/professor.routes.js'
import { courseRouter } from './models/course/course.routes.js'
import { materialRouter } from './models/course/embeddables/material.routes.js'
import { appealRouter } from './models/appeal/appeal.routes.js'
import { joinRequestRouter } from './models/joinRequest/joinRequest.routes.js'
import { authRouter } from './auth/auth.routes.js'
import { userRouter } from './models/user/user.routes.js'
import { assessmentRouter } from './models/assessment/assessment.routes.js';
import { orm } from './shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core'
import cors from 'cors'
import { errorHandler } from './shared/middlewares/error.middleware.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { logger } from './shared/utils/logger.js'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'
import { swaggerSpec } from './docs/swagger.config.js'

const app = express();

/**
 * @remarks HTTP request logger middleware using pino-http.
 * It logs every incoming request and its response, adding a unique request ID for tracing.
 * Sensitive data like passwords and authorization headers are automatically redacted.
 */
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    autoLogging: false,
    customLogLevel: function (req, res: Response, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    customSuccessMessage: function (
      req,
      res: Response & { responseTime?: number }
    ) {
      return `${req.method} ${req.url} - ${res.statusCode} ${res.statusMessage} - ${res.responseTime}ms`;
    },
    customErrorMessage: function (req, res: Response, err) {
      return `${req.method} ${req.url} - ${res.statusCode} ${res.statusMessage} - ${err.message}`;
    },
    customProps: function (req, _res: Response) {
      return {
        context: {
          authorization: req.headers.authorization
            ? 'Bearer [REDACTED]'
            : undefined,
          body:
            req.body && (req.body.password || req.body.password_plaintext)
              ? {
                  ...req.body,
                  password: '[REDACTED]',
                  password_plaintext: '[REDACTED]',
                }
              : req.body,
        },
      };
    },
  })
);

// Apply Helmet to set various security-related HTTP headers
app.use(helmet());

// Configure CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middlewares for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Main function to bootstrap and start the application.
 * It initializes the database connection, runs migrations, sets up rate limiters,
 * registers routes, and starts the Express server.
 */
async function startApp() {
  // Initialize database connection and run migrations
  await orm.connect();

  // FIX: Temporarily disabled migrations due to issues, using syncSchema instead
  // const migrator = orm.getMigrator();
  // await migrator.up();

  // FIX: Using syncSchema to update database schema automatically
  await orm.getSchemaGenerator().updateSchema();

  /**
   * Rate limiter for sensitive authentication endpoints to prevent brute-force attacks.
   */
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message:
        'Too many requests from this IP, please try again after 15 minutes',
    },
  });

  /**
   * General rate limiter for all other API routes to protect against DoS attacks.
   */
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message:
        'Too many requests from this IP, please try again after 15 minutes',
    },
  });

  /**
   * MikroORM middleware to create a new RequestContext for each request.
   * This is crucial for isolating database operations per request.
   */
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next); // em is the EntityManager
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Register API routes with their respective rate limiters
  app.use('/api/auth', authLimiter, authRouter)
  app.use('/api/users', apiLimiter, userRouter)
  app.use('/api/courseTypes', apiLimiter, courseTypeRouter)
  app.use('/api/institutions', apiLimiter, institutionRouter)
  app.use('/api/students', apiLimiter, studentRouter)
  app.use('/api/professors', apiLimiter, professorRouter)
  app.use('/api/courses', apiLimiter, courseRouter)
  app.use('/api/materials', apiLimiter, materialRouter)
  app.use('/api/appeals', apiLimiter, appealRouter)
  app.use('/api/join-requests', apiLimiter, joinRequestRouter)
  app.use('/api/assessments', apiLimiter, assessmentRouter);

  // Middleware for handling 404 Not Found errors
  app.use((_, res) => {
    return res.status(404).send({ message: 'Resource not found' });
  });

  // Centralized error handling middleware
  app.use(errorHandler);

  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}/`);
    logger.info(`API docs available at http://localhost:${PORT}/api-docs`);
  });
}

startApp();
