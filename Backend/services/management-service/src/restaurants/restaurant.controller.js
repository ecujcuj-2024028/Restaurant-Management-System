'use strict';

import Restaurant from './restaurant.model.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* Crear restaurante */
export const createRestaurant = async (req, res) => {
    try {
        // Obtenemos los campos principales
        const { name, category, phone, description } = req.body;

        // Manejamos la dirección si viene como objeto (JSON) o como campos planos (form-data)
        const street = req.body.street || (req.body.address && req.body.address.street);
        const city = req.body.city || (req.body.address && req.body.address.city);
        const country = req.body.country || (req.body.address && req.body.address.country);

        const restaurant = await Restaurant.create({
            name,
            category,
            phone,
            description,
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
        const restaurants = await Restaurant.find({ isActive: true });

        return res.status(200).json({
            success: true,
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

/* Actualizar restaurante */
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        const allowedFields = ['name', 'category', 'ownerId', 'phone', 'description'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (req.body.street || req.body.city || req.body.country || req.body.address) {
            updateData.address = {
                street: req.body.street || (req.body.address && req.body.address.street),
                city: req.body.city || (req.body.address && req.body.address.city),
                country: req.body.country || (req.body.address && req.body.address.country)
            };
        }
        console.log('ROLES:', req.userRoles);
        console.log('BODY:', updateData);

        if (updateData.ownerId) {

            const currentRestaurant = await Restaurant.findById(id);

            if (!currentRestaurant) {
                return res.status(404).json({
                    success: false,
                    message: 'Restaurant not found'
                });
            }

            const isAdminSistema = req.userRoles?.includes(ADMIN_SISTEMA);
            const isOwner = currentRestaurant.ownerId.toString() === req.userId;

            if (!isAdminSistema && !isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Only ADMIN_SISTEMA or the owner can change ownerId'
                });
            }

            // NOTA: En una arquitectura de microservicios real, aquí se debería 
            // realizar una petición HTTP al identity-service para verificar que 
            // el nuevo ownerId existe y es válido.
        }
        
        if (req.file) {
            updateData.photos = [req.file.path];
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
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