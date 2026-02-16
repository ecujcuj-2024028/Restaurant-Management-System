'use strict';

import Inventory from './inventory.model.js';

export const createInventoryItem = async (req, res) => {
    try {
        const data = req.body;

        const item = await Inventory.create({
            ...data
        });

        return res.status(201).json({
            success: true,
            item
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getInventory = async (req, res) => {
    try {
        const items = await Inventory
            .find()
            .populate('restaurant');

        return res.status(200).json({
            success: true,
            items
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching inventory',
            error: error.message
        });
    }
};