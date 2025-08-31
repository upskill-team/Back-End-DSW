import swaggerJsdoc from 'swagger-jsdoc';

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

const specs = swaggerJsdoc(options);
export default specs