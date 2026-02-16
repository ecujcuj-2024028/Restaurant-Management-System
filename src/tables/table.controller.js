'use strict';

import Table from './table.model.js';

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
        const tables = await Table.find().populate('restaurant');

        return res.status(200).json({
            success: true,
            tables
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching tables',
            error: error.message
        });
    }
};
