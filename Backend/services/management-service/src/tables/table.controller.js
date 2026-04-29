'use strict';

import Table from './table.model.js';
import Restaurant from '../restaurants/restaurant.model.js';

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
        const { availability } = req.body;

        const validStatus = ['disponible', 'ocupado', 'reservado'];

        if (!validStatus.includes(availability)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const table = await Table.findByPk(tableId);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        table.availability = availability;
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
