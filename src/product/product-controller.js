'use strict';

import Product from './products-model.js';
import { cloudinary, extractPublicId } from '../../middlewares/restaurant-uploader.js';

/* Crear producto */
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, type, category, restaurant, preparationTime } = req.body;

        let ingredients = req.body.ingredients;
        if (typeof ingredients === 'string') {
            try { ingredients = JSON.parse(ingredients); } catch { ingredients = []; }
        }

        const product = await Product.create({
            name,
            description,
            price,
            type,
            category,
            restaurant,
            ingredients: ingredients || [],
            preparationTime: preparationTime || null,
            image: req.file ? req.file.path : null
        });

        return res.status(201).json({ success: true, product });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* Listar productos */
export const getProducts = async (req, res) => {
    try {
        const { type, category, isAvailable, restaurant } = req.query;
        const filter = { isActive: true };

        if (type)       filter.type       = type;
        if (category)   filter.category   = category;
        if (restaurant) filter.restaurant = restaurant;
        if (isAvailable !== undefined)
            filter.isAvailable = isAvailable === 'true';

        const products = await Product.find(filter)
            .populate('category', 'name')
            .populate('restaurant', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description')
            .populate('restaurant', 'name');

        if (!product)
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });

        return res.status(200).json({ success: true, product });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const updateData = { ...req.body };

        if (req.file) {
            const existing = await Product.findById(id, 'image');

            if (existing?.image) {
                const publicId = extractPublicId(existing.image);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            updateData.image = req.file.path;
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return res.status(200).json({ success: true, product });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        await Product.findByIdAndUpdate(id, { isActive: false });

        return res.status(200).json({
            success: true,
            message: 'Producto desactivado'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};