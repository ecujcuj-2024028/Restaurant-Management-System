'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { dbConnection } from "./db.js";
import { corsOptions } from "./cors-configuration.js";
import { helmetConfiguration } from "./helmet-configuration.js";

const BASE_PATH = '/restaurantManagement';

const middlewares = (app) => {
    app.use(express.urlencoded({extended: false, limit: "10mb"}));
    app.use(express.json({limit: '10mb'}));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
}

const routes = (app) => {
    app.get(`${BASE_PATH}/health`, (req, res) => {
        return res.status(200).json({
            status: 'OK',
            message: 'Server is healthy and running',
            database: 'Connected'
        });
    });
}

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 3000;
    app.set('trust proxy', 1);

    try {
        await dbConnection();
        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log('--- RESTAURANT MANAGEMENT SYSTEM ---');
            console.log('Server is running on port', PORT);
            console.log('Health check available at:', `http://localhost:${PORT}${BASE_PATH}/health`);
        });
    } catch (error) {
        console.error('Error initializing server:', error.message);
        process.exit(1);
    }
}