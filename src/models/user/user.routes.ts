/**
 * @module Models/User/Routes
 * @remarks Defines the API routes for the User module, primarily for profile management.
 */
import { Router } from 'express'
import { updateProfile, getProfile } from './user.controller.js'
import { authMiddleware } from '../../auth/auth.middleware.js'
import { uploadProfilePicture } from '../../shared/middlewares/file-upload.middleware.js'



export const userRouter = Router()

// All routes within this router require an authenticated user.
userRouter.use(authMiddleware)

userRouter.get('/me', authMiddleware, getProfile);

// Route to update the authenticated user's profile.
userRouter.patch(
  '/me',
  uploadProfilePicture.single('profilePicture'),
  updateProfile
)