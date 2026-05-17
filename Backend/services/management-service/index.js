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
import restaurantRoutes from './src/restaurants/restaurant.routes.js';
import tableRoutes      from './src/tables/table.routes.js';
import inventoryRoutes  from './src/inventory/inventory.routes.js';
import menuRoutes       from './src/menu/menu-routes.js';
import productRoutes    from './src/product/product-routes.js';
import categoryRoutes   from './src/category/categories.routes.js';
import searchRoutes     from './src/search/search-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.MANAGEMENT_SERVICE_PORT || 3002;
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
app.use(`${BASE_PATH}/restaurants`, restaurantRoutes);
app.use(`${BASE_PATH}/tables`,      tableRoutes);
app.use(`${BASE_PATH}/inventory`,   inventoryRoutes);
app.use(`${BASE_PATH}/menus`,        menuRoutes);
app.use(`${BASE_PATH}/products`,    productRoutes);
app.use(`${BASE_PATH}/categories`,  categoryRoutes);
app.use(`${BASE_PATH}/search`,      searchRoutes);

// Health Check
app.get(`${BASE_PATH}/health`, (req, res) => {
    return res.status(200).json({
        status: 'Healthy',
        service: 'Management Service (Gestión)',
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

// Manejador de 404 para depuración
app.use((req, res) => {
    console.log(`[ManagementService] 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada en Management Service: ${req.method} ${req.originalUrl}`
    });
});

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
            console.log(`Management Service running on port: ${PORT}`);
            console.log('---------------------------------------------');
        });
    } catch (error) {
        console.error('Failed to start Management Service:', error);
        process.exit(1);
    }
};

startServer();
