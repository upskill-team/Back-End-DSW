/**
 * @module Models/Contact/Routes
 * @remarks Express routes for contact form endpoints.
 */

import { Router } from 'express';
import * as contactController from './contact.controller.js';

export const contactRouter = Router();

/**
 * POST /api/contact
 * Submit a contact/support message
 * Public endpoint - no authentication required
 */
contactRouter.post('/', contactController.submitContactForm);
