/**
 * @module Shared/Middleware/FileUpload
 * @remarks Configures and exports Multer middleware for handling file uploads via Cloudinary.
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import * as dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express'

dotenv.config();

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage for CV files in Cloudinary
const cvStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'upskill/cvs',
    allowed_formats: ['pdf', 'doc', 'docx'],
  } as any,
});

/**
 * Multer middleware instance configured to handle CV uploads to Cloudinary.
 * It accepts a single file with the field name 'document' and imposes a 10MB size limit.
 * @const {multer.Instance} uploadCvToCloudinary
 */
export const uploadCvToCloudinary = multer({
  storage: cvStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'upskill/course_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  } as any,
});

/**
 * Multer middleware instance configured to handle course image uploads to Cloudinary.
 * It accepts a single file with the field name 'image' and imposes a 5MB size limit.
 * @const {multer.Instance} uploadCourseImage
 */
export const uploadCourseImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const courseDataStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // This function is executed for EVERY file
    let folder = 'upskill/course_data/other'; // Default folder
    const allowed_formats = ['pdf', 'docx', 'xlsx', 'pptx', 'zip', 'jpg', 'jpeg', 'png', 'webp']; // Combined formats

    // If the file comes from the ‘image’ field, we send it to the images folder.
    if (file.fieldname === 'image') {
      folder = 'upskill/course_images';
    } 
    // If the file comes from the ‘materials’ field, we send it to the materials field.
    else if (file.fieldname === 'materials') { 
      folder = 'upskill/course_materials';
    }

    return {
      folder: folder,
      allowed_formats: allowed_formats,
    };
  },
})

const materialStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'upskill/course_materials',
    allowed_formats: ['pdf', 'docx', 'xlsx', 'pptx', 'zip'],
  } as any,
})

export const uploadMaterialToCloudinary = multer({
  storage: materialStorage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
})

/**
 * Multer middleware to handle the upload of complete course data:
 * - A single image file for the course (field ‘image’).
 * - Multiple course material files (field ‘materials’).
 * @const {multer.Instance} uploadCourseData
 */
export const uploadCourseData = multer({
  storage: courseDataStorage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
}).any()

/**
 * A middleware wrapper that handles common Multer errors.
 * @param uploadMiddleware The Multer middleware to execute (e.g., uploadCourseData).
 * @returns A new Express middleware with built-in error handling.
 */
export const handleMulterUpload = (
  uploadMiddleware: (req: Request, res: Response, callback: (err?: any) => void) => void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // We execute the Multer middleware, passing it the error handling callback.
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        console.error("Error de Multer:", err);
        return res.status(400).json({ status: 400, message: "Error en la subida de archivos", errors: err.message });
      } else if (err) {
        console.error("Error desconocido en la subida:", err);
        return res.status(500).json({ status: 500, message: "Error interno en la subida de archivos", errors: err.message });
      }
      // If there are no errors, we move on to the next middleware in the chain (the controller).
      next();
    });
  };
};

const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'upskill/profile_pictures', // Dedicated folder for avatars
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }], // Optional: resize images
  } as any,
});

/**
 * Multer middleware to handle the upload of a single profile photo.
 * Accepts a file in the ‘profilePicture’ field with a limit of 5MB.
 * @const {multer.Instance} uploadProfilePicture
 */
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});