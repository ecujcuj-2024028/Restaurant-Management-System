'use strict';
 
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
 
import { sequelize, dbConnection as postgresConnection } from "./db-postgres.js";
import { mongoConnection } from "./db-mongo.js";
import { corsOptions } from "./cors-configuration.js";
import { helmetConfiguration } from "./helmet-configuration.js";
 
// Routes
import authRoutes from '../src/auth/auth.routes.js';
import analyticsRoutes from '../src/analytics/analytics.routes.js';
import restaurantRoutes from '../src/restaurants/restaurant.routes.js';
import tableRoutes from '../src/tables/table.routes.js';
import inventoryRoutes from '../src/inventory/inventory.routes.js';
import reservationRoutes from '../src/Reservations/reservation.routes.js';
 
// Roles
import { Role } from '../src/auth/role.model.js';
import { ALLOWED_ROLES } from '../helpers/role-constants.js';
 
const BASE_PATH = '/restaurantManagement/v1';
 
/* =========================
Middlewares
========================= */
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: "10mb" }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
};
 
/* =========================
Routes
========================= */
const routes = (app) => {
 
    // Auth
    app.use(`${BASE_PATH}/auth`, authRoutes);
 
    // Core Modules
    app.use(`${BASE_PATH}/restaurants`, restaurantRoutes);
    app.use(`${BASE_PATH}/tables`, tableRoutes);
    app.use(`${BASE_PATH}/inventory`, inventoryRoutes);
    app.use(`${BASE_PATH}/reservations`, reservationRoutes);
 
 
    // Analytics
    app.use(`${BASE_PATH}/analytics`, analyticsRoutes);
 
    // Health Check
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
 
    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    });
};
 
/* =========================
Server Init
========================= */
export const initServer = async () => {
 
    const app = express();
    const PORT = process.env.PORT || 3000;
 
    try {
        console.log('--- STARTING GASTROMANAGER INFRASTRUCTURE ---');
 
        // Conexiones en paralelo
        await Promise.all([
            postgresConnection(),
            mongoConnection()
        ]);
 
        // Sync solo en desarrollo
        if (process.env.NODE_ENV === 'development') {
 
            await sequelize.sync({ alter: true });
            console.log('PostgreSQL | Tables synchronized');
 
            // Crear roles si no existen
            const count = await Role.count();
 
            if (count === 0) {
                await Role.bulkCreate(
                    ALLOWED_ROLES.map(name => ({ Name: name }))
                );
                console.log('PostgreSQL | Default roles created');
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
};
 
 