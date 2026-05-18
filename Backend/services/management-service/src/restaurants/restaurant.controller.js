'use strict';

import Restaurant from './restaurant.model.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* Crear restaurante */
export const createRestaurant = async (req, res) => {
    try {
        // Obtenemos los campos principales
        const { name, category, phone, description, openingTime, closingTime } = req.body;

        // Manejamos la dirección si viene como objeto (JSON) o como campos planos (form-data)
        const street = req.body.street || (req.body.address && req.body.address.street);
        const city = req.body.city || (req.body.address && req.body.address.city);
        const country = req.body.country || (req.body.address && req.body.address.country);

        const restaurant = await Restaurant.create({
            name,
            category,
            phone,
            description,
            openingTime,
            closingTime,
            ownerId: req.userId, // ID de Postgres
            address: {
                street,
                city,
                country
            },
            photos: req.file ? [req.file.path] : []
        });

        return res.status(201).json({ success: true, restaurant });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* Listar restaurantes */
export const getRestaurants = async (req, res) => {
    try {
        const query = { isActive: true };

        const roles = req.userRoles || [];
        const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
        const userId = req.userId;

        console.log(`[ManagementService] getRestaurants - User: ${userId}, Roles: [${roles.join(', ')}], isSystemAdmin: ${isSystemAdmin}`);

        // SEGURIDAD: 
        // 1. Admin Sistema: Ve todos.
        // 2. Admin Restaurante: SOLO ve los suyos (OBLIGATORIO).
        // 3. Cliente / Otros: Ven todos los activos.
        const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

        console.log(`[ManagementService] Roles detected: systemAdmin=${isSystemAdmin}, restauranteAdmin=${isRestauranteAdmin}`);

        if (isRestauranteAdmin && !isSystemAdmin) {
            query.ownerId = userId;
            console.log(`[ManagementService] Applying OWNERSHIP filter for user ${userId}`);
        } else if (isSystemAdmin) {
            console.log(`[ManagementService] System Admin access - no ownership filter`);
        } else {
            console.log(`[ManagementService] Public/Client access - viewing all active`);
        }

        const restaurants = await Restaurant.find(query);
        console.log(`[ManagementService] Found ${restaurants.length} restaurants`);

        return res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* Obtener restaurante */
export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant || !restaurant.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Seguridad: 
        // - Admin Sistema ve todo.
        // - Clientes ven todo (catálogo).
        // - Admin Restaurante SOLO ve el suyo.
        const isRestauranteAdmin = req.userRoles?.includes(ADMIN_RESTAURANTE);
        const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);

        if (isRestauranteAdmin && !isSystemAdmin && restaurant.ownerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para gestionar este restaurante.'
            });
        }

        return res.status(200).json({
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

/* Actualizar restaurante */
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        // Definimos campos permitidos, incluyendo ownerId y horario
        const allowedFields = ['name', 'category', 'ownerId', 'phone', 'description', 'openingTime', 'closingTime'];
        const updateData = {};
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Manejar dirección (address) que puede venir como campos individuales o anidados
        const street = req.body.street || (req.body.address && req.body.address.street);
        const city = req.body.city || (req.body.address && req.body.address.city);
        const country = req.body.country || (req.body.address && req.body.address.country);

        if (street || city || country) {
            updateData.address = {};
            if (street) updateData.address.street = street;
            if (city) updateData.address.city = city;
            if (country) updateData.address.country = country;
        }

        // Validación de cambio de dueño
        if (updateData.ownerId) {
            const currentRestaurant = await Restaurant.findById(id);
            if (!currentRestaurant) return res.status(404).json({ success: false, message: 'Restaurante no encontrado' });

            const isAdminSistema = req.userRoles?.includes(ADMIN_SISTEMA);
            const isCurrentOwner = currentRestaurant.ownerId.toString() === req.userId;

            if (!isAdminSistema && !isCurrentOwner) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Permisos insuficientes para transferir la propiedad del restaurante.' 
                });
            }
        }
        
        if (req.file) {
            updateData.photos = [req.file.path];
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        return res.status(200).json({
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

/* Eliminación lógica */
export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        await Restaurant.findByIdAndUpdate(id, { isActive: false });

        return res.status(200).json({
            success: true,
            message: 'Restaurant disabled'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};