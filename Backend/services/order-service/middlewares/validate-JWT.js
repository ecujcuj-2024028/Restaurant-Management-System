import { verifyJWT } from '../helpers/generate-jwt.js';

const isValidUserId = (userId) => {
    if (userId === undefined || userId === null) return false;
    const normalized = String(userId).trim().toLowerCase();
    return normalized !== '' && normalized !== 'undefined' && normalized !== 'null';
};

export const validateJWT = async (req, res, next) => {
    try {
        let token =
            req.header('x-token') ||
            req.header('authorization');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No hay token en la petición',
            });
        }

        token = token.replace(/^Bearer\s+/, '');

        const decoded = await verifyJWT(token);
        const userId = decoded?.sub;

        if (!isValidUserId(userId)) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido: identificador de usuario inválido.',
            });
        }

        req.user = {
            Id     : String(userId),
            id     : String(userId),
            Name   : decoded.name,
            Surname: decoded.surname,
            Email  : decoded.email,
            Status : true,
        };
        req.userId    = String(userId);
        req.userRoles = decoded.roles || [];

        next();
    } catch (error) {
        console.error('Error validating JWT:', error);

        let message = 'Error al verificar el token';
        if (error.name === 'TokenExpiredError') message = 'Token expirado';
        if (error.name === 'JsonWebTokenError')  message = 'Token inválido';

        return res.status(401).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};