/**
 * @module Shared/Middleware/FileUpload
 * @remarks Configures and exports Multer middleware for handling file uploads via Cloudinary.
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import * as dotenv from 'dotenv';

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

const materialStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'upskill/course_materials', // Carpeta dedicada para materiales
    allowed_formats: ['pdf', 'docx', 'xlsx', 'pptx', 'zip'], // Formatos permitidos
  } as any,
})

/**
 * Multer middleware instance configured to handle course material uploads to Cloudinary.
 * It accepts a single file with the field name 'material' and imposes a 25MB size limit.
 * @const {multer.Instance} uploadMaterialToCloudinary
 */
export const uploadMaterialToCloudinary = multer({
  storage: materialStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // Límite de 25MB por archivo
  },
})

/**
 * Multer middleware para manejar la subida de datos completos del curso:
 * - Un único archivo de imagen para el curso (campo 'image').
 * - Múltiples archivos de materiales del curso (campo 'materials').
 * @const {multer.Instance} uploadCourseData
 */
export const uploadCourseData = multer({
  storage: materialStorage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
}).any()