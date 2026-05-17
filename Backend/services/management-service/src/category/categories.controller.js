'use strict';

import Category from './categories.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const roles = req.userRoles || [];
    const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null; // Acceso total
    
    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

/* Listar categorías */
export const getCategories = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const filter = { isActive: true };

        const roles = req.userRoles || [];
        const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
        const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

        // SEGURIDAD: Filtrar por propiedad
        if (isRestauranteAdmin && !isSystemAdmin) {
            // Buscamos sus locales
            const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
            const myIds = myRestaurants.map(r => r._id.toString());
            
            if (restaurantId) {
                if (!myIds.includes(restaurantId)) {
                    return res.status(403).json({ success: false, message: 'No tienes permiso para ver categorías de este restaurante' });
                }
                filter.restaurantId = restaurantId;
            } else {
                filter.restaurantId = { $in: myIds };
            }
        } else if (restaurantId) {
            filter.restaurantId = restaurantId;
        }

        const categories = await Category.find(filter).populate('restaurantId', 'name');

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* Crear categoría */
export const createCategory = async (req, res) => {
    try {
        const { name, description, restaurantId } = req.body;

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para crear categorías en este restaurante' });
        }

        const category = await Category.create({
            name,
            description,
            restaurantId,
            image: req.file ? req.file.path : null
        });

        return res.status(201).json({ success: true, category });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* Obtener una categoría */
export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('restaurantId', 'name');
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

        // SEGURIDAD
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === category.restaurantId.toString())) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta categoría' });
        }

        return res.status(200).json({ success: true, category });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* Actualizar categoría */
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

        // SEGURIDAD
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === category.restaurantId.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(200).json({ success: true, category: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* Eliminar categoría */
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

        // SEGURIDAD
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === category.restaurantId.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        category.isActive = false;
        await category.save();
        
        return res.status(200).json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
