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
        
        console.log("=== [DEBUG] JWT Decoded Payload ===");
        console.log(JSON.stringify(decoded, null, 2));

        // Extraer ID de usuario (probar varios nombres comunes)
        const userId = decoded.sub || decoded.uid || decoded.id || decoded.userId;
        
        // Extraer roles (probar 'roles' o 'role')
        const roles = decoded.roles || (decoded.role ? [decoded.role] : []);

        // Configurar el request
        req.userId = String(userId);
        req.userRoles = Array.isArray(roles) ? roles : [roles];
        
        req.user = {
            Id: req.userId,
            Name: decoded.name || 'User',
            Surname: decoded.surname || '',
            Email: decoded.email || '',
            Status: true
        };

        console.log(`[validateJWT] Authenticated User: ${req.userId} with roles: [${req.userRoles.join(', ')}]`);
        
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
