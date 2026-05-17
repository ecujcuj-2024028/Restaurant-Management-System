'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from 'dotenv';

// Configuraciones y Middlewares
import { sequelize, dbConnection as postgresConnection } from "./configs/db-postgres.js";
import { corsOptions } from "./configs/cors-configuration.js";
import { helmetConfiguration } from "./configs/helmet-configuration.js";
import { setupSwagger } from "./configs/swagger.js";
import { errorHandler } from './middlewares/server-genericError-handler.js';
import { validateJWT } from './middlewares/validate-JWT.js';

// Modelos y Helpers
import { User, UserProfile } from './src/user/user.model.js';
import { Role, UserRole } from './src/auth/role.model.js';
import { hashPassword } from './utils/password-utils.js';
import { ADMIN_SISTEMA, ALLOWED_ROLES } from './helpers/role-constants.js';

// Rutas
import authRoutes from './src/auth/auth.routes.js';
import userRoutes from './src/user/user.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.IDENTITY_SERVICE_PORT || 3001;
const BASE_PATH = '/restaurantManagement/v1';

/* =========================
   Lógica de Administrador Root
   ========================= */
const ensureRootAdmin = async () => {
    try {
        const existingRoot = await User.findOne({ where: { Email: process.env.ROOT_ADMIN_EMAIL } });
        if (existingRoot) {
            console.log('PostgreSQL | Root admin already exists');
            return;
        }

        console.log('PostgreSQL | Creating ROOT ADMIN...');
        const hashedPassword = await hashPassword(process.env.ROOT_ADMIN_PASSWORD);
        const user = await User.create({
            Name: 'Root',
            Surname: 'Admin',
            Username: process.env.ROOT_ADMIN_USERNAME,
            Email: process.env.ROOT_ADMIN_EMAIL,
            Password: hashedPassword,
            Status: true
        });

        await UserProfile.create({ UserId: user.Id, Phone: '00000000' });

        const role = await Role.findOne({ where: { Name: ADMIN_SISTEMA } });
        if (role) {
            await UserRole.create({ UserId: user.Id, RoleId: role.Id });
            console.log('PostgreSQL | ROOT ADMIN CREATED SUCCESSFULLY');
        }
    } catch (error) {
        console.error('Error ensuring root admin:', error);
    }
};

/* =========================
   Middlewares e Infraestructura
   ========================= */
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));
app.use(helmet(helmetConfiguration));
app.use(morgan('dev'));

// Logger global para depuración de rutas
app.use((req, res, next) => {
    console.log(`[IdentityService] ${req.method} ${req.url}`);
    next();
});

// Rutas
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/users`, validateJWT, userRoutes);

// Health Check
app.get(`${BASE_PATH}/health`, (req, res) => {
    return res.status(200).json({
        status: 'Healthy',
        service: 'Identity Service (Auth & Users)',
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

        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: false }); // Usamos false para no romper nada existente
            
            const count = await Role.count();
            if (count === 0) {
                await Role.bulkCreate(ALLOWED_ROLES.map(name => ({ Name: name })));
                console.log('PostgreSQL | Default roles created');
            }
        }

        await ensureRootAdmin();
        setupSwagger(app);

        app.listen(PORT, () => {
            console.log('---------------------------------------------');
            console.log(`Identity Service running on port: ${PORT}`);
            console.log('---------------------------------------------');
        });
    } catch (error) {
        console.error('Failed to start Identity Service:', error);
        process.exit(1);
    }
};

startServer();
