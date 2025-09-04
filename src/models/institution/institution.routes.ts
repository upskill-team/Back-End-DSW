/**
 * @module Models/Institution/Routes
 * @remarks Defines the API routes for the institution module.
 * It maps HTTP endpoints to controller functions, applies authentication middleware to all routes,
 * and uses validation middleware for create/update operations.
 * @see {@link InstitutionController}
 * @see {@link InstitutionSchemas}
 * @see {@link authMiddleware}
 */
import { Router } from 'express'
import {
  add,
  findAll,
  findOne,
  remove,
  update,
} from './institution.controller.js'
import { validationMiddleware } from '../../shared/middlewares/validate.middleware.js'
import {
  CreateInstitutionSchema,
  UpdateInstitutionSchema,
} from './institution.schemas.js'
import { authMiddleware, roleAuthMiddleware } from '../../auth/auth.middleware.js'
import { UserRole } from '../user/user.entity.js'

export const institutionRouter = Router()

// Apply the authentication middleware to all routes within this module.
// This ensures that only authenticated users can access these endpoints.
institutionRouter.use(authMiddleware)



/**
 * @swagger
 * components:
 *   schemas:
 *     Institution:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the institution
 *         name:
 *           type: string
 *           description: The name of the institution
 *         professors:
 *           type: array
 *       example:
 *         id: 1
 *         name: "Galactic Academy"
 *         professors: []
 */

/**
 * @swagger
 * tags:
 *   name: institutions
 *   description: The institutions
 */

/**
 * @swagger
 * /api/institutions:
 *   get:
 *     summary: Returns the list of all the institutions
 *     tags: [institutions]
 *     responses:
 *       200:
 *         description: The list of the institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Institution'
 */

const adminOnly = roleAuthMiddleware([UserRole.ADMIN])

institutionRouter.get('/', findAll)


/**
 * @swagger
 * /api/institutions/{id}:
 *   get:
 *     summary: Get the institution by id
 *     tags: [institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: The institution description by id
 *         contents:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       404:
 *         description: The institution was not found
 */

institutionRouter.get('/:id', findOne)

/**
 * @swagger
 * /api/institutions:
 *   post:
 *     summary: Create a new institution
 *     tags: [institutions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Institution'
 *     responses:
 *       201:
 *         description: The institution was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       500:
 *         description: Some server error
 */
institutionRouter.post('/', adminOnly, validationMiddleware(CreateInstitutionSchema), add)

/**
 * @swagger
 * /api/institutions/{id}:
 *   put:
 *     summary: Update the institution by the id
 *     tags: [institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Institution'
 *     responses:
 *       200:
 *         description: The institution was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       404:
 *         description: The institution was not found
 *       500:
 *         description: Some error happened
 *
 *   patch:
 *     summary: Update the institution by the id
 *     tags: [institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Institution'
 *     responses:
 *       200:
 *         description: The institution was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       404:
 *         description: The institution was not found
 *       500:
 *         description: Some error happened
 */

institutionRouter.put(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
)
institutionRouter.patch(
  '/:id',
  adminOnly,
  validationMiddleware(UpdateInstitutionSchema),
  update
)

/**
 * @swagger
 * /api/institutions/{id}:
 *   delete:
 *     summary: Remove the institution by id
 *     tags: [institutions]
 *     parameters:
 *       - in: path
 */
institutionRouter.delete('/:id', adminOnly, remove)
