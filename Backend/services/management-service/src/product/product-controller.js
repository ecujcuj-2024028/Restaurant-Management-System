'use strict';

import Product from './products-model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { cloudinary, extractPublicId } from '../../middlewares/restaurant-uploader.js';
import { InventoryItem } from '../inventory/inventory.model.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: Parsear Ingredientes de forma segura
───────────────────────────────────────────────────────────────────────────── */
const parseIngredients = (ingredients) => {
    if (!ingredients) return [];
    
    let parsed = [];
    if (typeof ingredients === 'string') {
        try {
            parsed = JSON.parse(ingredients);
        } catch (e) {
            console.error("Error parseando ingredientes string:", e);
            return [];
        }
    } else {
        parsed = ingredients;
    }

    // Asegurar que sea un array y limpiar campos vacíos o nulos
    if (!Array.isArray(parsed)) return [];
    
    return parsed.filter(i => i && typeof i === 'object' && i.name);
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /products  — Crear producto
───────────────────────────────────────────────────────────────────────────── */
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, type, category, restaurant, preparationTime } = req.body;

        const ingredients = parseIngredients(req.body.ingredients);

        const product = await Product.create({
            name,
            description,
            price: Number(price),
            type,
            category,
            restaurant,
            ingredients,
            preparationTime: preparationTime ? Number(preparationTime) : null,
            image: req.file ? req.file.path : null,
        });

        return res.status(201).json({ success: true, product });
    } catch (error) {
        console.error("Error en createProduct:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /products  — Listar productos
───────────────────────────────────────────────────────────────────────────── */
export const getProducts = async (req, res) => {
    try {
        const { type, category, isAvailable, restaurant } = req.query;
        const filter = { isActive: true };

        if (type) filter.type = type;
        if (category) filter.category = category;
        if (restaurant) filter.restaurant = restaurant;
        if (isAvailable !== undefined)
            filter.isAvailable = isAvailable === 'true';

        const products = await Product.find(filter)
            .populate('category', 'name')
            .populate('restaurant', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: products.length, products });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /products/:id  — Obtener producto
───────────────────────────────────────────────────────────────────────────── */
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description')
            .populate('restaurant', 'name');

        if (!product)
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        return res.status(200).json({ success: true, product });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PUT /products/:id  — Actualizar producto
───────────────────────────────────────────────────────────────────────────── */
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Parseo forzado de ingredientes
        if (updateData.ingredients !== undefined) {
            updateData.ingredients = parseIngredients(updateData.ingredients);
        }

        if (req.file) {
            const existing = await Product.findById(id, 'image');
            if (existing?.image) {
                const publicId = extractPublicId(existing.image);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }
            updateData.image = req.file.path;
        }

        // Usamos findById y save() en lugar de findByIdAndUpdate para disparar middleware y validaciones limpiamente
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        Object.assign(product, updateData);
        await product.save();

        return res.status(200).json({ success: true, product });
    } catch (error) {
        console.error("Error en updateProduct:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /products/:id  — Desactivar producto
───────────────────────────────────────────────────────────────────────────── */
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndUpdate(id, { isActive: false });
        return res.status(200).json({ success: true, message: 'Producto desactivado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /products/stats/:restaurantId
───────────────────────────────────────────────────────────────────────────── */
export const getProductStats = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurante no encontrado.' });

        const products = await Product.find({ restaurant: restaurantId }).populate('category', 'name');

        return res.status(200).json({
            success: true,
            stats: {
                total: products.length,
                active: products.filter(p => p.isActive).length,
                available: products.filter(p => p.isActive && p.isAvailable).length
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
