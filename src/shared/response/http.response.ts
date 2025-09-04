/**
 * @module Shared/Response
 * @remarks Provides a standardized class for handling HTTP responses.
 * This class centralizes response logic, ensuring consistent response formats
 * across the entire API for successes and different types of errors.
 */

import { Response } from 'express';

/**
 * Enum for standard HTTP status codes used in the application.
 * @enum {number}
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * A utility class with static methods to send standardized HTTP responses.
 * @class HttpResponse
 */
export class HttpResponse {
  /**
   * Sends a 200 OK response.
   * @param {Response} res - The Express response object.
   * @param {any} [data] - The payload to send in the response body.
   * @returns {Response} The Express response object.
   */
  public static Ok(res: Response, data?: any): Response {
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Success',
      data: data,
    });
  }

  /**
   * Sends a 201 Created response.
   * @param {Response} res - The Express response object.
   * @param {any} [data] - The payload of the newly created resource.
   * @returns {Response} The Express response object.
   */
  public static Created(res: Response, data?: any): Response {
    return res.status(HttpStatus.CREATED).json({
      status: HttpStatus.CREATED,
      message: 'Created',
      data: data,
    });
  }

  /**
   * Sends a 400 Bad Request response.
   * @param {Response} res - The Express response object.
   * @param {any} [errors] - Details about the validation or request errors.
   * @returns {Response} The Express response object.
   */
  public static BadRequest(res: Response, errors?: any): Response {
    return res.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      message: 'Bad Request',
      errors: errors,
    });
  }

  /**
   * Sends a 401 Unauthorized response.
   * @param {Response} res - The Express response object.
   * @param {any} [errors] - Details about the authorization failure.
   * @returns {Response} The Express response object.
   */
  public static Unauthorized(res: Response, errors?: any): Response {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      status: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      errors: errors,
    });
  }

  /**
   * Sends a 404 Not Found response.
   * @param {Response} res - The Express response object.
   * @param {any} [errors] - A message indicating the resource was not found.
   * @returns {Response} The Express response object.
   */
  public static NotFound(res: Response, errors?: any): Response {
    return res.status(HttpStatus.NOT_FOUND).json({
      status: HttpStatus.NOT_FOUND,
      message: 'Not Found',
      errors: errors,
    });
  }

  /**
   * Sends a 500 Internal Server Error response.
   * @param {Response} res - The Express response object.
   * @param {any} [errors] - Details about the server error.
   * @returns {Response} The Express response object.
   */
  public static InternalServerError(res: Response, errors?: any): Response {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      errors: errors,
    });
  }
}
