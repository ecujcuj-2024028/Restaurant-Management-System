'use strict';

import Product from './products-model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { cloudinary, extractPublicId } from '../../middlewares/restaurant-uploader.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const roles = req.userRoles || [];
    const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

    // Si es Admin de Sistema o CLIENTE, no restringimos por propiedad en las búsquedas (null)
    if (isSystemAdmin || !isRestauranteAdmin) return null;
    
    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

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

    if (!Array.isArray(parsed)) return [];
    
    return parsed.filter(i => i && typeof i === 'object' && i.name);
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /products  — Crear producto
───────────────────────────────────────────────────────────────────────────── */
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, type, category, restaurant, preparationTime } = req.body;

        // SEGURIDAD: Validar propiedad del restaurante
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === restaurant)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para crear productos en este restaurante' });
        }

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

        // SEGURIDAD: Filtrar por propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null) {
            if (restaurant) {
                if (!ownedIds.some(id => id.toString() === restaurant)) {
                    return res.status(403).json({ success: false, message: 'No tienes permiso para ver productos de este restaurante' });
                }
                filter.restaurant = restaurant;
            } else {
                filter.restaurant = { $in: ownedIds };
            }
        } else if (restaurant) {
            filter.restaurant = restaurant;
        }

        if (type) filter.type = type;
        if (category) filter.category = category;
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

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === product.restaurant._id.toString())) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver este producto' });
        }

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
        const { name, description, price, type, category, isAvailable, preparationTime } = req.body;

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(oid => oid.toString() === product.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para modificar este producto' });
        }

        // Si se intenta cambiar el nombre, verificar que no choque con otro producto del mismo restaurante
        if (name && name !== product.name) {
            const duplicate = await Product.findOne({ 
                name, 
                restaurant: product.restaurant, 
                isActive: true,
                _id: { $ne: id } 
            });
            if (duplicate) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Ya existe otro producto llamado "${name}" en este restaurante.` 
                });
            }
            product.name = name;
        }

        // Actualizar campos básicos solo si vienen en el body
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = Number(price);
        if (type !== undefined) product.type = type;
        if (category !== undefined) product.category = category;
        if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
        if (preparationTime !== undefined) product.preparationTime = preparationTime ? Number(preparationTime) : null;

        if (req.body.ingredients !== undefined) {
            product.ingredients = parseIngredients(req.body.ingredients);
        }

        if (req.file) {
            if (product.image) {
                const publicId = extractPublicId(product.image);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }
            product.image = req.file.path;
        }

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
        
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(oid => oid.toString() === product.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este producto' });
        }

        product.isActive = false;
        await product.save();
        
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

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver estadísticas de este restaurante' });
        }

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
