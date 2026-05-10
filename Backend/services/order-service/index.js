'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from 'dotenv';

// Configuraciones y Middlewares
import { sequelize, dbConnection as postgresConnection } from "./configs/db-postgres.js";
import { mongoConnection } from "./configs/db-mongo.js";
import { corsOptions } from "./configs/cors-configuration.js";
import { helmetConfiguration } from "./configs/helmet-configuration.js";
import { setupSwagger } from "./configs/swagger.js";
import { errorHandler } from './middlewares/server-genericError-handler.js';

// Rutas
import orderRoutes            from './src/orders/order.routes.js';
import reservationRoutes      from './src/reservations/reservation.routes.js';
import externalOrderRoutes    from './src/external-orders/external-order.routes.js';
import customerHistoryRoutes  from './src/customer/customerHistory.routes.js';

// Importar modelos ANTES de sequelize.sync() para registrarlos
import './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3003;
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
app.use(`${BASE_PATH}/orders`,       orderRoutes);
app.use(`${BASE_PATH}/reservations`, reservationRoutes);
app.use(`${BASE_PATH}/external-orders`, externalOrderRoutes);
app.use(`${BASE_PATH}/history`,      customerHistoryRoutes);

// Health Check
app.get(`${BASE_PATH}/health`, (req, res) => {
    return res.status(200).json({
        status: 'Healthy',
        service: 'Order Service (Transaccional)',
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
        await sequelize.sync();
        await mongoConnection();

        setupSwagger(app);

        app.listen(PORT, () => {
            console.log('---------------------------------------------');
            console.log(`Order Service running on port: ${PORT}`);
            console.log('---------------------------------------------');
        });
    } catch (error) {
        console.error('Failed to start Order Service:', error);
        process.exit(1);
    }
};

startServer();
