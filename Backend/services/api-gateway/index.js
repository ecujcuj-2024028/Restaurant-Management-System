import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/restaurantManagement/v1';

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

/**
 * CONFIGURACIÓN DE PROXIES
 * Usamos una función de filtro para que el proxy intercepte las rutas
 * sin que Express las "recorte".
 */

// Proxy para el Identity Service
app.use(createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathFilter: (path) => path.startsWith(`${BASE_PATH}/auth`) || path.startsWith(`${BASE_PATH}/users`)
}));

// Proxy para el Management Service
app.use(createProxyMiddleware({
    target: process.env.MANAGEMENT_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathFilter: (path) =>
        path.startsWith(`${BASE_PATH}/restaurants`) ||
        path.startsWith(`${BASE_PATH}/tables`) ||
        path.startsWith(`${BASE_PATH}/inventory`) ||
        path.startsWith(`${BASE_PATH}/menus`) ||
        path.startsWith(`${BASE_PATH}/products`) ||
        path.startsWith(`${BASE_PATH}/categories`) ||
        path.startsWith(`${BASE_PATH}/search`)
}));

// Proxy para el Order Service
app.use(createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathFilter: (path) =>
        path.startsWith(`${BASE_PATH}/orders`) ||
        path.startsWith(`${BASE_PATH}/reservations`) ||
        path.startsWith(`${BASE_PATH}/external-orders`) ||
        path.startsWith(`${BASE_PATH}/customer`)
}));

// Proxy para el Analytics & Events Service
app.use(createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathFilter: (path) =>
        path.startsWith(`${BASE_PATH}/analytics`) ||
        path.startsWith(`${BASE_PATH}/events`) ||
        path.startsWith(`${BASE_PATH}/reports`)
}));

app.listen(PORT, () => {
    console.log(`API Gateway funcionando en http://localhost:${PORT}${BASE_PATH}`);
});