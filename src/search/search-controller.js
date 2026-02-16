'use strict';

import Restaurant from '../restaurants/restaurant.model.js';
import Category   from '../gastronomy oferts/category-model.js';
import Product    from '../gastronomy oferts/products-model.js';

export const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2)
            return res.status(400).json({
                success: false,
                message: 'El parámetro "q" debe tener al menos 2 caracteres'
            });

        const regex = { $regex: q, $options: 'i' };

        const [restaurants, products] = await Promise.all([
            Restaurant.find({ name: regex, isActive: true })
                .populate('categories', 'name')
                .select('name description address rating image')
                .limit(5),

            Product.find({ name: regex, isActive: true, isAvailable: true })
                .populate('restaurant', 'name')
                .populate('category',   'name')
                .select('name price type image')
                .limit(10)
        ]);

        return res.status(200).json({
            success: true,
            data: { restaurants, products }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const searchRestaurants = async (req, res) => {
    try {
        const { name, category, city, minRating, page = 1, limit = 10 } = req.query;
        const filter = { isActive: true };

        if (name) filter.name = { $regex: name, $options: 'i' };
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };
        if (minRating) filter.rating = { $gte: parseFloat(minRating) };

        if (category) {
            const cats = await Category.find({
                name:     { $regex: category, $options: 'i' },
                isActive: true
            }).select('_id');

            if (cats.length === 0)
                return res.status(200).json({
                    success: true,
                    count: 0,
                    total: 0,
                    restaurants: []
                });

            filter.categories = { $in: cats.map(c => c._id) };
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Restaurant.countDocuments(filter);

        const restaurants = await Restaurant.find(filter)
            .populate('categories', 'name image')
            .select('name description address rating categories image')
            .sort({ rating: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            count: restaurants.length,
            total,
            pagination: {
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            },
            restaurants
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const {
            name, type, category, restaurant,
            minPrice, maxPrice,
            page = 1, limit = 10
        } = req.query;

        const filter = { isActive: true, isAvailable: true };

        if (name)       filter.name       = { $regex: name, $options: 'i' };
        if (type)       filter.type       = type;
        if (category)   filter.category   = category;
        if (restaurant) filter.restaurant = restaurant;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Product.countDocuments(filter);

        const products = await Product.find(filter)
            .populate('category',   'name')
            .populate('restaurant', 'name')
            .select('name description price type category restaurant image preparationTime')
            .sort({ price: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            count: products.length,
            total,
            pagination: {
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            },
            products
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};