'use strict';

import Restaurant from './restaurant.model.js';

export const createRestaurant = async (req, res) => {
    try {
        const data = req.body;

        const restaurant = await Restaurant.create({
            ...data,
            photos: req.file ? [req.file.path] : []
        });

        return res.status(201).json({
            success: true,
            restaurant
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();

        return res.status(200).json({
            success: true,
            restaurants
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching restaurants',
            error: error.message
        });
    }
};
