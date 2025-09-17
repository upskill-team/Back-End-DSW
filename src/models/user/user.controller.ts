/**
 * @module Models/User/Controller
 * @remarks Handles HTTP requests for the User module.
 * @see {@link UserService} for business logic.
 */
import { NextFunction, Request, Response } from 'express'
import { orm } from '../../shared/db/orm.js'
import { UserService } from './user.service.js'
import { HttpResponse } from '../../shared/response/http.response.js'
import { UpdateProfileSchema } from './user.schemas.js'
import { safeParse } from 'valibot'


/**
 * Handles the update of the authenticated user's profile.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The next middleware function.
 * @returns The updated user profile data.
 */
async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const service = new UserService(orm.em.fork(), req.log);
    const userId = req.user!.id;

    const profileData = req.body;
    const imageUrl = (req.file as Express.Multer.File)?.path;

    const validationResult = safeParse(UpdateProfileSchema, profileData);
    if (!validationResult.success) {
      return HttpResponse.BadRequest(res, validationResult.issues);
    }
    
    const updatedUser = await service.updateProfile(
      userId,
      validationResult.output,
      imageUrl
    );

    return HttpResponse.Ok(res, updatedUser);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the retrieval of the authenticated user's profile.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The next middleware function.
 */
async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // La lógica del servicio para obtener el perfil ya está en AuthService,
    // pero la moveremos a UserService para mayor consistencia.
    const service = new UserService(orm.em.fork(), req.log);
    const userId = req.user!.id;

    const userProfile = await service.getProfile(userId);

    if (!userProfile) {
      return HttpResponse.NotFound(res, 'Perfil de usuario no encontrado.');
    }

    return HttpResponse.Ok(res, userProfile);
  } catch (error) {
    next(error);
  }
}

export { updateProfile, getProfile }