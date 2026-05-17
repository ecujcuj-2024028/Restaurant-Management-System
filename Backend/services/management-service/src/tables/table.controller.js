'use strict';

import Table from './table.model.js';
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

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: verificar propiedad del restaurante
───────────────────────────────────────────────────────────────────────────── */
const checkOwnership = async (req, restaurantId) => {
    const isAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    if (isAdmin) return true;
    
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId: req.userId });
    return !!restaurant;
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /tables  — Listar todas las mesas (filtrado por restaurante)
───────────────────────────────────────────────────────────────────────────── */
export const getTables = async (req, res) => {
    try {
        const { restaurantId, availability } = req.query;
        const where = { isActive: true };

        const roles = req.userRoles || [];
        const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
        const userId = req.userId;

        console.log(`[ManagementService] getTables - User: ${userId}, roles: [${roles.join(', ')}], isSystemAdmin: ${isSystemAdmin}`);

        if (!isSystemAdmin) {
            // Buscamos sus locales en Mongo para filtrar en Postgres
            const myRestaurants = await Restaurant.find({ ownerId: userId, isActive: true }, '_id');
            const myIds = myRestaurants.map(r => r._id.toString());

            if (restaurantId) {
                if (!myIds.includes(restaurantId)) {
                    return res.status(403).json({ success: false, message: 'No tienes permiso para ver mesas de este restaurante' });
                }
                where.restaurant = restaurantId;
            } else {
                where.restaurant = myIds; 
            }
        } else if (restaurantId) {
            where.restaurant = restaurantId;
        }

        if (availability) where.availability = availability;

        // USA findAll porque es SEQUELIZE
        const tables = await Table.findAll({ 
            where,
            order: [['number', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            count: tables.length,
            tables
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /tables  — Crear mesa
───────────────────────────────────────────────────────────────────────────── */
export const createTable = async (req, res) => {
    try {
        const { restaurant, number, capacity, type, location } = req.body;

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, restaurant))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para crear mesas en este restaurante' });
        }

        const existing = await Table.findOne({ where: { restaurant, number, isActive: true } });
        if (existing) {
            return res.status(400).json({ success: false, message: `La mesa #${number} ya existe en este restaurante.` });
        }

        const table = await Table.create({
            restaurant,
            number,
            capacity,
            type,
            location
        });

        return res.status(201).json({ success: true, table });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /tables/:id  — Obtener mesa
───────────────────────────────────────────────────────────────────────────── */
export const getTable = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id);

        if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, table.restaurant))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta mesa' });
        }

        return res.status(200).json({ success: true, table });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PUT /tables/:id  — Actualizar mesa
───────────────────────────────────────────────────────────────────────────── */
export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        
        const table = await Table.findByPk(id);
        if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, table.restaurant))) {
            return res.status(403).json({ success: false, message: 'No autorizado para modificar esta mesa' });
        }

        await table.update(req.body);

        return res.status(200).json({ success: true, table });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /tables/:id  — Eliminar (desactivar) mesa
───────────────────────────────────────────────────────────────────────────── */
export const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findByPk(id);
        if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, table.restaurant))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta mesa' });
        }

        table.isActive = false;
        await table.save();

        return res.status(200).json({ success: true, message: 'Mesa desactivada correctamente' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /tables/:id/status  — Cambiar disponibilidad
───────────────────────────────────────────────────────────────────────────── */
export const updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { availability } = req.body;

        const table = await Table.findByPk(id);
        if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, table.restaurant))) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        table.availability = availability;
        await table.save();

        return res.status(200).json({ success: true, table });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
