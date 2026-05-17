/**
 * Middleware para restringir rutas por roles
 * @param {...string} roles - Lista de roles permitidos
 */
export const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({
                success: false,
                message: 'Se requiere validar el token antes de verificar el rol'
            });
        }

        // Extraer los nombres de los roles que tiene el usuario
        // 1. Intentar desde req.userRoles (poblado por validateJWT desde el payload)
        // 2. Intentar desde req.user.UserRoles (si es objeto de DB con includes)
        let userRoles = [];
        
        if (req.userRoles && Array.isArray(req.userRoles)) {
            userRoles = req.userRoles;
        } else if (req.user.UserRoles && Array.isArray(req.user.UserRoles)) {
            userRoles = req.user.UserRoles.map(ur => ur.Role.Name);
        }

        console.log(`[hasRole] Required: [${roles.join(', ')}], User has: [${userRoles.join(', ')}]`);

        // Verificar si el usuario tiene al menos uno de los roles requeridos
        const hasPermission = roles.some(role => userRoles.includes(role));

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `El servicio requiere uno de estos roles: [${roles.join(', ')}]`
            });
        }

        next();
    };
};