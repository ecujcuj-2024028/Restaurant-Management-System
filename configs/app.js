'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { dbConnection as postgresConnection } from "./db-postgres.js";
import { mongoConnection } from "./db-mongo.js";
import { corsOptions } from "./cors-configuration.js";
import { helmetConfiguration } from "./helmet-configuration.js";

import authRoutes from "../src/auth/auth.routes.js";

const BASE_PATH = '/restaurantManagement/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({extended: false, limit: "10mb"}));
    app.use(express.json({limit: '10mb'}));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
}

const routes = (app) => {
    // Registro de rutas de Autenticación y Usuarios
    app.use(`${BASE_PATH}/auth`, authRoutes); 
    
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

    // Manejo de rutas no encontradas
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
        await Promise.all([
            postgresConnection(), // Para Usuarios y Seguridad
            mongoConnection()     // Para el resto del sistema
        ]);

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