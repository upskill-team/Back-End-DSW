import { Request, Response, NextFunction } from 'express';
import { BaseSchema, safeParse, flatten, BaseIssue } from 'valibot';
import { HttpResponse } from '../response/http.response.js';


/**
 *  Middleware to validate request bodies against a given Valibot schema.
 *  If validation passes, the request body is replaced with the parsed output.
 *  If validation fails, a 400 Bad Request response is sent with the validation errors.
 * @param schema - Valibot schema to validate the request body against
 * @returns 
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
