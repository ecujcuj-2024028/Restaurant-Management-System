'use strict';

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kinal Restaurant Management System API',
            version: '1.0.0',
            description: 'API profesional para la gestión de múltiples restaurantes, inventarios, pedidos y reservaciones.',
            contact: {
                name: 'Kinal Dev Team',
                email: 'ecujcuj-2024028@kinal.edu.gt'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/restaurantManagement/v1',
                description: 'API Gateway (Punto de entrada único)'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/**/*.js',
        './index.js'
    ],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger | Order Service Docs available at http://localhost:3003/api-docs');
};
