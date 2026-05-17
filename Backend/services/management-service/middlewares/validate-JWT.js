import { verifyJWT } from '../helpers/generate-jwt.js';

/**
 * Middleware para validar JWT en microservicios (Trust JWT Payload)
 */
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

        // Limpiar el token si viene con Bearer
        token = token.replace(/^Bearer\s+/, '');

        // Verificar el token
        const decoded = await verifyJWT(token);
        
        console.log("=== DEBUG JWT DECODED ===");
        console.log(JSON.stringify(decoded, null, 2));

        // En microservicios que no son Identity, confiamos en el payload del JWT
        req.user = {
            Id: decoded.sub || decoded.uid || decoded.id,
            Name: decoded.name,
            Surname: decoded.surname,
            Email: decoded.email,
            Status: true
        };
        req.userId = decoded.sub || decoded.uid || decoded.id;
        req.userRoles = decoded.roles || [];
        
        console.log("req.userId assigned as:", req.userId);
        
        next();
    } catch (error) {
        console.error('Error validating JWT:', error);

        let message = 'Error al verificar el token';

        if (error.name === 'TokenExpiredError') {
            message = 'Token expirado';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token inválido';
        }

        return res.status(401).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
