'use strict';

import Table from './table.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { ADMIN_SISTEMA } from '../../helpers/role-constants.js';

const ESTADOS_MESA = {
    disponible: 'disponible',
    ocupado: 'ocupado',
    reservado: 'reservado',
    AVAILABLE: 'disponible',
    OCCUPIED: 'ocupado',
    RESERVED: 'reservado'
};

const normalizarDisponibilidad = (valor) => {
    if (!valor || typeof valor !== 'string') return null;

    const valorLimpio = valor.trim();

    return ESTADOS_MESA[valorLimpio] || ESTADOS_MESA[valorLimpio.toUpperCase()] || null;
};

const usuarioEsAdminSistema = (req) => {
    return Array.isArray(req.userRoles) && req.userRoles.includes(ADMIN_SISTEMA);
};

const validarAccesoARestaurante = async (req, restaurantId) => {
    if (usuarioEsAdminSistema(req)) {
        return {
            permitido: true
        };
    }

    const restaurant = await Restaurant.findById(restaurantId)
        .select('ownerId')
        .lean();

    if (!restaurant) {
        return {
            permitido: false,
            status: 404,
            message: 'Restaurante no encontrado'
        };
    }

    if (String(restaurant.ownerId) !== String(req.userId)) {
        return {
            permitido: false,
            status: 403,
            message: 'No tiene permisos para modificar mesas de este restaurante'
        };
    }

    return {
        permitido: true
    };
};

export const createTable = async (req, res) => {
    try {
        const data = req.body;

        const table = await Table.create(data);

        return res.status(201).json({
            success: true,
            table
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getTables = async (req, res) => {
    try {
        const tables = await Table.findAll();

        const tablesWithRestaurant = await Promise.all(tables.map(async (t) => {
            const tableData = t.toJSON();

            if (tableData.restaurant) {
                const restData = await Restaurant.findById(tableData.restaurant).lean();
                tableData.restaurant = restData || tableData.restaurant;
            }

            return tableData;
        }));

        return res.status(200).json({
            success: true,
            tables: tablesWithRestaurant
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching tables',
            error: error.message
        });
    }
};

export const getTablesByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const tables = await Table.findAll({
            where: {
                restaurant: restaurantId,
                isActive: true
            }
        });

        const restaurant = await Restaurant.findById(restaurantId).lean();

        const tablesWithRestaurant = tables.map((t) => {
            const tableData = t.toJSON();
            tableData.restaurant = restaurant || tableData.restaurant;
            return tableData;
        });

        return res.status(200).json({
            success: true,
            tables: tablesWithRestaurant
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching tables',
            error: error.message
        });
    }
};

export const updateTableStatus = async (req, res) => {
    try {
        const { tableId } = req.params;
        const { availability, status } = req.body;

        const nuevaDisponibilidad = normalizarDisponibilidad(availability || status);

        if (!nuevaDisponibilidad) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Use disponible, ocupado o reservado'
            });
        }

        const table = await Table.findByPk(tableId);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        const accesoRestaurante = await validarAccesoARestaurante(req, table.restaurant);

        if (!accesoRestaurante.permitido) {
            return res.status(accesoRestaurante.status).json({
                success: false,
                message: accesoRestaurante.message
            });
        }

        table.availability = nuevaDisponibilidad;

        const updatedTable = await table.save();

        return res.status(200).json({
            success: true,
            message: 'Estado actualizado correctamente',
            table: updatedTable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating table status',
            error: error.message
        });
    }
};