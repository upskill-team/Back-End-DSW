import './shared/config/env.validator.js'

import express from 'express'
import { courseTypeRouter } from './models/courseType/courseType.routes.js'
import { institutionRouter } from './models/institution/institution.routes.js'
import { studentRouter } from './models/student/student.routes.js'
import { professorRouter } from './models/professor/professor.routes.js'
import { courseRouter } from './models/course/course.routes.js'
import { appealRouter } from './models/appeal/appeal.routes.js'
import { orm, syncSchema } from './shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core'
import { authRouter } from './auth/auth.routes.js'
import cors from 'cors'
import { errorHandler } from './shared/middlewares/error.middleware.js'
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
// Attach pino-http logger to each request. It will automatically handle
// request/response logging and add a `log` property to the `req` object.
app.use(
  pinoHttp({
    logger,
    // Assigns a unique ID to each request. This ID is accessible on req.id
    // and is automatically included in every log entry for this request.
    genReqId: function (req, res) {
      const existingId = req.id ?? req.headers['x-request-id']
      if (existingId) return existingId
      const id = randomUUID()
      res.setHeader('X-Request-Id', id)
      return id
    },

    // customProps is the SAFE way to add context to logs.
    // It does NOT mutate the original `req` object, solving our previous issues.
    customProps: function (req, _res) {
      return {
        // We log a sanitized version of the request context here.
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
)

app.use(cors({ origin: 'http://localhost:5173' }))

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  RequestContext.create(orm.em, next) //em is the EntityManager
})

app.use('/api/courseTypes', courseTypeRouter)
app.use('/api/institutions', institutionRouter)
app.use('/api/students', studentRouter)
app.use('/api/professors', professorRouter)
app.use('/api/courses', courseRouter)
app.use('/api/appeals', appealRouter)
app.use('/api/auth', authRouter)

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' })
})

app.use(errorHandler)

// Never in production
await syncSchema() // Ensure the database schema is in sync before starting the server

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000/')
})
