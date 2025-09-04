/**
 * @module Shared/Swagger
 * @remarks Configures and generates the OpenAPI specification for the API using swagger-jsdoc.
 * This setup scans JSDoc comments in the route files to build the API documentation.
 */

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Options for the swagger-jsdoc library.
 * It specifies the main API definition and the paths to the files containing OpenAPI annotations.
 * @const {swaggerJsdoc.Options}
 */
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Skill UP API',
            version: '1.0.0',
            description: 'API for managing Skill UP platform',
            contact: {
                name: 'gugliermino carlos',
                email: 'ricardogugliermino@gmail.com'
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Local server'
                }
            ]
        }
    },
    apis: ['./src/models/**/*.ts', './src/models/**/*.js', './src/auth/*.ts', './src/auth/*.js'],
};

/**
 * The generated OpenAPI specification object.
 * @const {object}
 */
const specs = swaggerJsdoc(options);
export default specs