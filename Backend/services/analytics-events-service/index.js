'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from 'dotenv';

// Configuraciones y Middlewares
import { dbConnection as postgresConnection } from "./configs/db-postgres.js";
import { mongoConnection } from "./configs/db-mongo.js";
import { corsOptions } from "./configs/cors-configuration.js";
import { helmetConfiguration } from "./configs/helmet-configuration.js";
import { setupSwagger } from "./configs/swagger.js";
import { errorHandler } from './middlewares/server-genericError-handler.js';

// Rutas
import analyticsRoutes from './src/analytics/analytics.routes.js';
import eventsRoutes    from './src/events/events-routes.js';
import reportsRoutes   from './src/reports/reports.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.ANALYTICS_SERVICE_PORT || 3004;
const BASE_PATH = '/restaurantManagement/v1';

/* =========================
   Middlewares e Infraestructura
   ========================= */
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));
app.use(helmet(helmetConfiguration));
app.use(morgan('dev'));

// Rutas
app.use(`${BASE_PATH}/analytics`, analyticsRoutes);
app.use(`${BASE_PATH}/events`,    eventsRoutes);
app.use(`${BASE_PATH}/reports`,   reportsRoutes);

// Health Check
app.get(`${BASE_PATH}/health`, (req, res) => {
    return res.status(200).json({
        status: 'Healthy',
        service: 'Analytics & Events Service',
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

/* =========================
   Arranque
   ========================= */
const startServer = async () => {
    try {
        await postgresConnection();
        await mongoConnection();

        setupSwagger(app);

        app.listen(PORT, () => {
            console.log('---------------------------------------------');
            console.log(`Analytics Service running on port: ${PORT}`);
            console.log('---------------------------------------------');
        });
    } catch (error) {
        console.error('Failed to start Analytics Service:', error);
        process.exit(1);
    }
};

startServer();
