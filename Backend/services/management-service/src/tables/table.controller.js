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

const UBICACIONES_MESA = ['interior', 'exterior', 'terraza', 'vip'];

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

const validarCamposMesa = ({ number, capacity, location, availability }) => {
    if (number !== undefined && (!Number.isInteger(Number(number)) || Number(number) <= 0)) {
        return 'El número de mesa debe ser un entero mayor a cero';
    }

    if (capacity !== undefined && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) {
        return 'La capacidad debe ser un entero mayor a cero';
    }

    if (location !== undefined && !UBICACIONES_MESA.includes(location)) {
        return 'Ubicación inválida';
    }

    if (availability !== undefined && !normalizarDisponibilidad(availability)) {
        return 'Estado inválido. Use disponible, ocupado o reservado';
    }

    return null;
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

export const updateTable = async (req, res) => {
    try {
        const { tableId } = req.params;
        const {
            restaurant,
            number,
            capacity,
            location,
            availability
        } = req.body;

        const errorValidacion = validarCamposMesa({
            number,
            capacity,
            location,
            availability
        });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
            });
        }

        const table = await Table.findByPk(tableId);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        const accesoRestauranteActual = await validarAccesoARestaurante(req, table.restaurant);

        if (!accesoRestauranteActual.permitido) {
            return res.status(accesoRestauranteActual.status).json({
                success: false,
                message: accesoRestauranteActual.message
            });
        }

        if (restaurant && restaurant !== table.restaurant) {
            const accesoNuevoRestaurante = await validarAccesoARestaurante(req, restaurant);

            if (!accesoNuevoRestaurante.permitido) {
                return res.status(accesoNuevoRestaurante.status).json({
                    success: false,
                    message: accesoNuevoRestaurante.message
                });
            }
        }

        const camposActualizacion = {};

        if (restaurant !== undefined) camposActualizacion.restaurant = restaurant;
        if (number !== undefined) camposActualizacion.number = Number(number);
        if (capacity !== undefined) camposActualizacion.capacity = Number(capacity);
        if (location !== undefined) camposActualizacion.location = location;
        if (availability !== undefined) {
            camposActualizacion.availability = normalizarDisponibilidad(availability);
        }

        const updatedTable = await table.update(camposActualizacion);

        return res.status(200).json({
            success: true,
            message: 'Mesa actualizada correctamente',
            table: updatedTable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating table',
            error: error.message
        });
    }
};

export const deleteTable = async (req, res) => {
    try {
        const { tableId } = req.params;

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

        await table.destroy();

        return res.status(200).json({
            success: true,
            message: 'Mesa eliminada correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting table',
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