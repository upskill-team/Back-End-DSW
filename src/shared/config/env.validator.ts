/**
 * @module EnvValidator
 * @description Validates essential environment variables at application startup.
 */
import * as v from 'valibot';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Defines the schema for the required environment variables.
 * This ensures that the application has the necessary configuration to run safely.
 */
const EnvSchema = v.object({
  // MongoDB
  MONGO_USER: v.pipe(v.string(), v.minLength(1, 'MONGO_USER is required.')),
  MONGO_PASS: v.pipe(v.string(), v.minLength(1, 'MONGO_PASS is required.')),
  MONGO_CLUSTER: v.pipe(
    v.string(),
    v.minLength(1, 'MONGO_CLUSTER is required.')
  ),
  MONGO_DB_NAME: v.pipe(
    v.string(),
    v.minLength(1, 'MONGO_DB_NAME is required.')
  ),

  // Security
  JWT_SECRET: v.pipe(
    v.string(),
    v.minLength(1, 'JWT_SECRET is required and cannot be empty.')
  ),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: v.pipe(
    v.string(),
    v.minLength(1, 'CLOUDINARY_CLOUD_NAME is required.')
  ),
  CLOUDINARY_API_KEY: v.pipe(
    v.string(),
    v.minLength(1, 'CLOUDINARY_API_KEY is required.')
  ),
  CLOUDINARY_API_SECRET: v.pipe(
    v.string(),
    v.minLength(1, 'CLOUDINARY_API_SECRET is required.')
  ),

  // Email Service
  EMAIL_HOST: v.pipe(v.string(), v.minLength(1, 'EMAIL_HOST is required.')),
  EMAIL_PORT: v.pipe(v.string(), v.minLength(1, 'EMAIL_PORT is required.')),
  EMAIL_USER: v.pipe(v.string(), v.minLength(1, 'EMAIL_USER is required.')),
  EMAIL_PASS: v.pipe(v.string(), v.minLength(1, 'EMAIL_PASS is required.')),
});

try {
  // Parse the environment variables against the schema
  v.parse(EnvSchema, process.env);
  console.log('Environment variables validated successfully.');
} catch (error) {
  const issues = (error as v.ValiError<typeof EnvSchema>).issues
    .map((issue) => `- ${issue.path?.[0].key}: ${issue.message}`)
    .join('\n');
  console.error(
    `\nFATAL ERROR: Missing or invalid environment variables:\n${issues}\n`
  );
  process.exit(1); // Stop the application
}
