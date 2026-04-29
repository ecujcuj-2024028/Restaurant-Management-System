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

        // En microservicios que no son Identity, confiamos en el payload del JWT
        // decoded suele traer { sub, email, roles, name, surname }
        req.user = {
            Id: decoded.sub,
            Name: decoded.name,
            Surname: decoded.surname,
            Email: decoded.email,
            Status: true // Asumimos true ya que el token es válido
        };
        req.userId = decoded.sub;
        req.userRoles = decoded.roles;
        
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
