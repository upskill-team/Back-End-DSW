import { HttpStatus } from '../response/http.response.js';

export class HttpError extends Error {
  public readonly statusCode: HttpStatus;

  constructor(message: string, statusCode: HttpStatus) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}