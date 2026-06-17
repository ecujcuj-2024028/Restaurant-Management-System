'use strict';

import { Op } from 'sequelize';
import Table from './table.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order_service:3003/restaurantManagement/v1';

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
        // Soporta tanto ?restaurantId=ID como /restaurant/ID
        const restaurantId = req.query.restaurantId || req.params.restaurantId;
        const { availability, onlyActiveReservation } = req.query; // Nueva bandera
        const where = { isActive: true };

        const roles = req.userRoles || [];
        const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
        const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);
        const userId = req.userId;

        if (isSystemAdmin) {
            if (restaurantId) where.restaurant = restaurantId;
        } else if (isRestauranteAdmin) {
            const myRestaurants = await Restaurant.find({ ownerId: userId, isActive: true }, '_id');
            const myIds = myRestaurants.map(r => r._id.toString());

            if (restaurantId) {
                if (!myIds.includes(restaurantId)) {
                    return res.status(403).json({ success: false, message: `No tienes permiso para ver mesas del restaurante ${restaurantId}` });
                }
                where.restaurant = restaurantId;
            } else {
                where.restaurant = { [Op.in]: myIds }; 
            }
        } else {
            // CLIENTE
            if (!restaurantId) {
                return res.status(400).json({ success: false, message: 'Se requiere restaurantId para consultar mesas' });
            }
            where.restaurant = restaurantId;

            // --- LÓGICA DE FILTRADO POR RESERVACIÓN ACTIVA (Solo si se pide explícitamente) ---
            if (onlyActiveReservation === 'true') {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const url = new URL(`${ORDER_SERVICE_URL}/reservations`);
                    url.searchParams.append('status', 'confirmada');
                    url.searchParams.append('date', today);

                    const response = await fetch(url.toString(), {
                        headers: { 'Authorization': req.header('Authorization') }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const myReservations = data?.reservations || [];
                        
                        const now = new Date();
                        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                        
                        const activeTableIds = myReservations
                            .filter(res => {
                                const resRestId = res.restaurantId?._id || res.restaurantId;
                                if (resRestId.toString() !== restaurantId) return false;

                                const [resH, resM] = res.time.split(':').map(Number);
                                const resTime = new Date();
                                resTime.setHours(resH, resM, 0, 0);
                                
                                const endTime = new Date(resTime.getTime() + 120 * 60000);
                                const endHHMM = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                                
                                return currentHHMM >= res.time && currentHHMM <= endHHMM;
                            })
                            .map(res => res.tableId);

                        if (activeTableIds.length === 0) {
                            return res.status(200).json({ success: true, count: 0, tables: [] });
                        }
                        where.id = { [Op.in]: activeTableIds };
                    }
                } catch (err) {
                    console.error('[ManagementService] Error fetching reservations:', err.message);
                }
            }
        }

        if (availability) where.availability = availability;

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
