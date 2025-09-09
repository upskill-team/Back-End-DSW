import { Request, Response, NextFunction } from 'express';
import { HttpResponse } from '../../../shared/response/http.response.js';

/**
 * Handles the upload of a single course material file.
 * It expects the file to have been processed by a multer middleware.
 * @param {Request} req The Express request object, containing req.file.
 * @param {Response} res The Express response object.
 * @returns {Response} A JSON response with the URL of the uploaded file.
 */
function uploadMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return HttpResponse.BadRequest(res, 'No se proporcionó ningún archivo.');
    }

    const fileUrl = req.file.path;
    const originalName = req.file.originalname;

    return HttpResponse.Ok(res, { 
        url: fileUrl,
        title: originalName
    });
  } catch (error) {
    next(error);
  }
}

export { uploadMaterial };