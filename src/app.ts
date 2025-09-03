/**
 * @module App
 * @description Main application entry point.
 * Configures the Express server, initializes middleware, registers routes,
 * sets up the MikroORM context, and starts the server.
 */

import './shared/config/env.validator.js'
import express, {Response} from 'express'
import { courseTypeRouter } from './models/courseType/courseType.routes.js'
import { institutionRouter } from './models/institution/institution.routes.js'
import { studentRouter } from './models/student/student.routes.js'
import { professorRouter } from './models/professor/professor.routes.js'
import { courseRouter } from './models/course/course.routes.js'
import { appealRouter } from './models/appeal/appeal.routes.js'
import { authRouter } from './auth/auth.routes.js'
import { orm } from './shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core'
import cors from 'cors'
import { errorHandler } from './shared/middlewares/error.middleware.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express';
import specs from './shared/swagger/swagger.js'
import { logger } from './shared/utils/logger.js'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'

const app = express()

/**
 * @description HTTP request logger middleware.
 * Uses the shared pino logger instance to log incoming requests and their responses.
 * It adds a unique request ID to each log entry for easy tracing and redacts
 * sensitive information like passwords and authorization headers.
 */
app.use(
  pinoHttp({
    logger,
    
    genReqId: (req, res) => {
      const id = randomUUID()
      res.setHeader('X-Request-Id', id)
      return id
    },

    autoLogging: false,

    customLogLevel: function (req, res: Response, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn'
      } else if (res.statusCode >= 500 || err) {
        return 'error'
      }
      return 'info'
    },

    customSuccessMessage: function (req, res: Response & { responseTime?: number }) {
      return `${req.method} ${req.url} - ${res.statusCode} ${res.statusMessage} - ${res.responseTime}ms`
    },
    customErrorMessage: function (req, res: Response, err) {
      return `${req.method} ${req.url} - ${res.statusCode} ${res.statusMessage} - ${err.message}`
    },

    customProps: function (req, _res: Response) {
      return {
        context: {
          authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
          body:
            req.body && (req.body.password || req.body.password_plaintext)
              ? { ...req.body, password: '[REDACTED]', password_plaintext: '[REDACTED]' }
              : req.body,
        },
      }
    },
  })
);

// Apply Helmet to set various security-related HTTP headers
app.use(helmet())

app.use(cors({ origin: 'http://localhost:5173' }))

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

async function startApp() {
  await orm.connect()
  const migrator = orm.getMigrator()
  await migrator.up()
  
   /**
   * @description Rate limiter for sensitive authentication endpoints.
   * Helps prevent brute-force attacks on login and password reset functionalities.
   * Limits each IP to 10 requests per 15 minutes.
   */
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  })

  /**
   * @description General rate limiter for all other API routes.
   * Protects against general DoS attacks and abuse.
   * Limits each IP to 100 requests per 15 minutes.
   */
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  })
  
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next) //em is the EntityManager
  })

  // Swagger setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
  // Apply the stricter limiter specifically to auth routes, overriding the general one
  app.use('/api/auth', authLimiter, authRouter)
  app.use('/api/courseTypes', apiLimiter, courseTypeRouter)
  app.use('/api/institutions', apiLimiter, institutionRouter)
  app.use('/api/students', apiLimiter, studentRouter)
  app.use('/api/professors', apiLimiter, professorRouter)
  app.use('/api/courses', apiLimiter, courseRouter)
  app.use('/api/appeals', apiLimiter, appealRouter)

  app.use((_, res) => {
    return res.status(404).send({ message: 'Resource not found' })
  })

  app.use(errorHandler)

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000/')
  })
}

startApp()