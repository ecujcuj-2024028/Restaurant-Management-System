import { ADMIN_SISTEMA } from '../helpers/role-constants.js';
import Restaurant from '../src/restaurants/restaurant.model.js';

export const validateReportOwnership = async (req, res, next) => {
    try {
        const isAdminSistema = req.userRoles?.includes(ADMIN_SISTEMA);
        if (isAdminSistema) return next();

        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'El parámetro restaurantId es requerido'
            });
        }

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante no encontrado'
            });
        }

        if (restaurant.ownerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado, no eres el propietario de este restaurante'
            });
        }

        req.resource = restaurant;
        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};