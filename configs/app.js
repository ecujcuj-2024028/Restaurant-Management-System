'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sequelize } from "./db-postgres.js";
import { dbConnection as postgresConnection } from "./db-postgres.js";
import { mongoConnection } from "./db-mongo.js";
import { corsOptions } from "./cors-configuration.js";
import { helmetConfiguration } from "./helmet-configuration.js";

import restaurantRoutes from '../src/restaurants/restaurant.routes.js';
import tableRoutes from '../src/tables/table.routes.js';
import inventoryRoutes from '../src/inventory/inventory.routes.js';
import authRoutes from '../src/auth/auth.routes.js';
import { Role } from '../src/auth/role.model.js';
import { ALLOWED_ROLES } from '../helpers/role-constants.js';

const BASE_PATH = '/restaurantManagement/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({extended: false, limit: "10mb"}));
    app.use(express.json({limit: '10mb'}));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
}

const routes = (app) => {
    app.use(`${BASE_PATH}/auth`, authRoutes);
    app.use(`${BASE_PATH}/login`, tableRoutes);

    app.use(`${BASE_PATH}/restaurants`, restaurantRoutes);
    app.use(`${BASE_PATH}/tables`, tableRoutes);
    app.use(`${BASE_PATH}/inventory`, inventoryRoutes);

    app.get(`${BASE_PATH}/health`, (req, res) => {
        return res.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'GastroManager Admin Server',
            databases: {
                postgresql: 'Connected',
                mongodb: 'Connected'
            }
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    });
}


export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 3000;

    try {
        console.log('--- STARTING GASTROMANAGER INFRASTRUCTURE ---');
        
        // Inicializar conexiones en paralelo para mayor velocidad
        await postgresConnection(); 
        await mongoConnection();

        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('PostgreSQL | Tablas creadas o actualizadas');
            
            const count = await Role.count();
            if (count === 0) {
                await Role.bulkCreate(ALLOWED_ROLES.map(name => ({ Name: name })));
                console.log('PostgreSQL | Roles creados');
            }
        }

        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log('---------------------------------------------');
            console.log(`Server is running on port: ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
            console.log('---------------------------------------------');
        });
    } catch (error) {
        console.error('CRITICAL ERROR: Server initialization failed:', error.message);
        process.exit(1);
    }
}