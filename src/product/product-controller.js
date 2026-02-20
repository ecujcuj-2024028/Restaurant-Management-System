'use strict';

import Product  from '../product/products-model.js';
import Category from '../gastronomy-oferts/category-model.js';

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
            .populate('category',   'name')
            .populate('restaurant', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category',   'name description')
            .populate('restaurant', 'name');

        if (!product)
            return res.status(404).json({
                success: false,
                message: `Producto no encontrado con id ${req.params.id}`
            });

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const data = req.body;

        const categoryExists = await Category.findById(data.category);
        if (!categoryExists)
            return res.status(404).json({
                success: false,
                message: `Categoría no encontrada con id ${data.category}`
            });

        const product = await Product.create({
            ...data,
            restaurant: req.user.restaurant
        });

        return res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product)
            return res.status(404).json({
                success: false,
                message: `Producto no encontrado con id ${req.params.id}`
            });

        if (req.user.role !== 'admin' &&
            product.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para actualizar este producto'
            });

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            product: updated
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product)
            return res.status(404).json({
                success: false,
                message: `Producto no encontrado con id ${req.params.id}`
            });

        if (req.user.role !== 'admin' &&
            product.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para eliminar este producto'
            });

        await Product.findByIdAndUpdate(req.params.id, { isActive: false });

        return res.status(200).json({
            success: true,
            message: 'Producto desactivado correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};