/**
 * @module App
 * @remarks Application factory module.
 */
import './shared/config/env.validator.js';
import express, { Express, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

// Database & Config
import { orm } from './shared/db/orm.js';
import { swaggerSpec } from './docs/swagger.config.js';
import { corsOptions, authLimiter, apiLimiter } from './shared/config/security.config.js';
import { logger } from './shared/utils/logger.js';
import { errorHandler } from './shared/middlewares/error.middleware.js';

// Routes
import { courseTypeRouter } from './models/courseType/courseType.routes.js';
import { institutionRouter } from './models/institution/institution.routes.js';
import { studentRouter } from './models/student/student.routes.js';
import { professorRouter } from './models/professor/professor.routes.js';
import { courseRouter } from './models/course/course.routes.js';
import { materialRouter } from './models/course/embeddables/material.routes.js';
import { appealRouter } from './models/appeal/appeal.routes.js';
import { joinRequestRouter } from './models/joinRequest/joinRequest.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { userRouter } from './models/user/user.routes.js';
import { assessmentRouter } from './models/assessment/assessment.routes.js';
import { enrollementRouter } from './models/Enrollement/enrollement.routes.js';
import { paymentRouter } from './models/payment/payment.routes.js';
import { adminRouter } from './models/admin/admin.routes.js';
import { contactRouter } from './models/contact/contact.routes.js';

export const createApp = (): Express => {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: false,
      customLogLevel: function (req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        } else if (res.statusCode >= 500 || err) {
          return 'error';
        }
        return 'info';
      },
      customSuccessMessage: function (req, res: Response & { responseTime?: number }) {
        return `${req.method} ${req.url} - ${res.statusCode} ${res.statusMessage} - ${res.responseTime}ms`;
      },
      customErrorMessage: function (req, res, err) {
        return `${req.method} ${req.url} - ${res.statusCode} ${res.statusMessage} - ${err.message}`;
      },
      customProps: function (req, _res) {
        return {
          context: {
            authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
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

  // Security Middlewares
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(cookieParser());

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // MikroORM Context Middleware
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next);
  });

  // Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Route Registration
  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/users', apiLimiter, userRouter);
  app.use('/api/courseTypes', apiLimiter, courseTypeRouter);
  app.use('/api/institutions', apiLimiter, institutionRouter);
  app.use('/api/students', apiLimiter, studentRouter);
  app.use('/api/professors', apiLimiter, professorRouter);
  app.use('/api/courses', apiLimiter, courseRouter);
  app.use('/api/materials', apiLimiter, materialRouter);
  app.use('/api/appeals', apiLimiter, appealRouter);
  app.use('/api/join-requests', apiLimiter, joinRequestRouter);
  app.use('/api/assessments', apiLimiter, assessmentRouter);
  app.use('/api/enrollments', apiLimiter, enrollementRouter);
  app.use('/api/payments', apiLimiter, paymentRouter);
  app.use('/api/admin', apiLimiter, adminRouter);
  app.use('/api/contact', apiLimiter, contactRouter);

  // 404 Handler
  app.use((_, res) => {
    return res.status(404).send({ message: 'Resource not found' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};