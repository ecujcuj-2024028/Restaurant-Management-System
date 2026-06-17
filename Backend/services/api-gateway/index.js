import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/restaurantManagement/v1';

// Middlewares globales que no consumen el body
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} se unió a la sala: ${roomId}`);
    });
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

/**
 * ENDPOINT INTERNO PARA MICROSERVICIOS
 * Solo aquí usamos express.json() para no romper los proxies
 */
app.post(`${BASE_PATH}/internal/emit`, express.json(), (req, res) => {
    const { event, data, room } = req.body;
    if (!event || !data) return res.status(400).json({ message: "Faltan campos event o data" });
    if (room) io.to(room).emit(event, data);
    else io.emit(event, data);
    return res.status(200).json({ success: true });
});

// Proxies - Deben ir ANTES de cualquier express.json() global
app.use(createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathFilter: (path) => path.startsWith(`${BASE_PATH}/auth`) || path.startsWith(`${BASE_PATH}/users`)
}));

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

app.use(createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathFilter: (path) =>
        path.startsWith(`${BASE_PATH}/orders`) ||
        path.startsWith(`${BASE_PATH}/reservations`) ||
        path.startsWith(`${BASE_PATH}/external-orders`) ||
        path.startsWith(`${BASE_PATH}/customer`)
}));

app.use(createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathFilter: (path) =>
        path.startsWith(`${BASE_PATH}/analytics`) ||
        path.startsWith(`${BASE_PATH}/events`) ||
        path.startsWith(`${BASE_PATH}/notifications`) ||
        path.startsWith(`${BASE_PATH}/reports`)
}));

httpServer.listen(PORT, () => {
    console.log(`API Gateway con WebSockets en http://localhost:${PORT}${BASE_PATH}`);
});
