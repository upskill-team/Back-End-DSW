/**
 * @module Shared/Middleware/Validation
 * @remarks Provides a reusable middleware for request body validation using Valibot.
 */

import { Request, Response, NextFunction } from 'express';
import { BaseSchema, safeParse, flatten, BaseIssue } from 'valibot';
import { HttpResponse } from '../response/http.response.js';


/**
 * Creates an Express middleware that validates the request body against a given Valibot schema.
 * If validation is successful, the sanitized and typed `req.body` is passed to the next handler.
 * If validation fails, it sends a 400 Bad Request response with detailed error messages.
 * @function validationMiddleware
 * @template TInput - The input type of the schema.
 * @template TOutput - The output type of the schema after parsing.
 * @param {BaseSchema<TInput, TOutput, BaseIssue<TInput>>} schema - The Valibot schema to validate against.
 * @returns {function(Request, Response, NextFunction): void | Response} An Express middleware function.
 */
export const validationMiddleware = <TInput, TOutput>(
  schema: BaseSchema<TInput, TOutput, BaseIssue<TInput>>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = safeParse(schema, req.body);

    if (result.success) {
      req.body = result.output;
      return next();
    }

    const errors = flatten(result.issues).nested;

    return HttpResponse.BadRequest(res, errors);
  };
};
