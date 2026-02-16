'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { sequelize, dbConnection as postgresConnection } from "./db-postgres.js";
import { mongoConnection } from "./db-mongo.js";
import { corsOptions } from "./cors-configuration.js";
import { helmetConfiguration } from "./helmet-configuration.js";

// ========================
// ROUTES
// ========================
import authRoutes from '../src/auth/auth.routes.js';
import analyticsRoutes from '../src/analytics/analytics.routes.js';
import restaurantRoutes from '../src/restaurants/restaurant.routes.js';
import tableRoutes from '../src/tables/table.routes.js';
import inventoryRoutes from '../src/inventory/inventory.routes.js';
import reservationRoutes from '../src/Reservations/reservation.routes.js';

// Nuevos módulos
import categoryRoutes from '../src/gastronomy-oferts/category-routes.js';
import productRoutes from '../src/gastronomy-oferts/product-routes.js';
import eventRoutes from '../src/Eventos/events-routes.js';
import menuRoutes from '../src/menu/menu-routes.js';
import searchRoutes from '../src/search/search-routes.js';

// ========================
// ROLES
// ========================
import { Role } from '../src/auth/role.model.js';
import { ALLOWED_ROLES } from '../helpers/role-constants.js';

const BASE_PATH = '/restaurantManagement/v1';

// ========================
// MIDDLEWARES
// ========================
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: "10mb" }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
};

// ========================
// ROUTES
// ========================
const routes = (app) => {

    // 🔐 Auth
    app.use(`${BASE_PATH}/auth`, authRoutes);

    // 🏢 Core
    app.use(`${BASE_PATH}/restaurants`, restaurantRoutes);
    app.use(`${BASE_PATH}/tables`, tableRoutes);
    app.use(`${BASE_PATH}/inventory`, inventoryRoutes);
    app.use(`${BASE_PATH}/reservations`, reservationRoutes);

    // 📊 Analytics
    app.use(`${BASE_PATH}/analytics`, analyticsRoutes);

    // 🍽 Categorías y Productos
    app.use(`${BASE_PATH}/categories`, categoryRoutes);
    app.use(`${BASE_PATH}/products`, productRoutes);

    // 🎉 Eventos
    app.use(`${BASE_PATH}/events`, eventRoutes);

    // 📋 Menús
    app.use(`${BASE_PATH}/menus`, menuRoutes);
    app.use(`${BASE_PATH}/restaurants/:restaurantId/menus`, menuRoutes);

    // 🔍 Búsqueda
    app.use(`${BASE_PATH}/search`, searchRoutes);

    // ========================
    // HEALTH CHECK
    // ========================
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

    // ========================
    // 404 HANDLER
    // ========================
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    });
};

// ========================
// SERVER INIT
// ========================
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
            console.log(`Server running on port: ${PORT}`);
            console.log(`Health: http://localhost:${PORT}${BASE_PATH}/health`);
            console.log('---------------------------------------------');
        });

    } catch (error) {
        console.error('CRITICAL ERROR: Server initialization failed:', error.message);
        process.exit(1);
    }
};
