'use strict';

import Menu    from '../menu/menu-models.js';
import Product from '../product/products-model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const roles = req.userRoles || [];
    const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

    console.log(`[MenuService] getOwnedRestaurantIds - User: ${req.userId}, roles: [${roles.join(', ')}]`);

    if (isSystemAdmin) return null; // Acceso total
    if (!isRestauranteAdmin) {
        console.log(`[MenuService] User is not Admin Restaurante, returning empty owned restaurants`);
        return []; 
    }

    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    const ids = myRestaurants.map(r => r._id);
    console.log(`[MenuService] Found ${ids.length} owned restaurants for user ${req.userId}: [${ids.join(', ')}]`);
    return ids;
};

const addExpirationFlag = (menu) => {
    const now = new Date();
    const plain = menu.toObject ? menu.toObject() : { ...menu };
    if (plain.validFrom && plain.validTo) {
        plain.isExpired = now < new Date(plain.validFrom) || now > new Date(plain.validTo);
    }
    return plain;
};

export const getMenus = async (req, res) => {
    try {
        const { restaurant, menuType, isActive } = req.query;
        const filter = {};

        // SEGURIDAD: Filtrar por propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds) {
            if (restaurant) {
                if (!ownedIds.some(id => id.toString() === restaurant)) {
                    return res.status(403).json({ success: false, message: 'No tienes permiso para ver este restaurante' });
                }
                filter.restaurant = restaurant;
            } else {
                filter.restaurant = { $in: ownedIds };
            }
        } else if (restaurant) {
            filter.restaurant = restaurant;
        }

        if (menuType)   filter.menuType   = menuType;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const menus = await Menu.find(filter)
            .populate('restaurant',    'name')
            .populate('items.product', 'name price type image')
            .sort({ createdAt: -1 });

        const menusWithFlags = menus.map(addExpirationFlag);

        return res.status(200).json({
            success: true,
            count: menusWithFlags.length,
            menus: menusWithFlags
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMenu = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id)
            .populate('restaurant',    'name')
            .populate('items.product', 'name description price type image ingredients');

        if (!menu)
            return res.status(404).json({
                success: false,
                message: `Menú no encontrado con id ${req.params.id}`
            });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === menu.restaurant._id.toString())) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver este menú' });
        }

        return res.status(200).json({
            success: true,
            menu: addExpirationFlag(menu)
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createMenu = async (req, res) => {
    try {
        const data = req.body;
        const { restaurantId } = req.body;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'El campo restaurantId es obligatorio.'
            });
        }

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para crear menús en este restaurante' });
        }

        if (data.items && data.items.length > 0) {
            const ids   = data.items.map(i => i.product);
            const found = await Product.find({
                _id:        { $in: ids },
                restaurant: restaurantId,
                isActive:   true
            }).select('_id');

            if (found.length !== ids.length)
                return res.status(400).json({
                    success: false,
                    message: 'Uno o más productos son inválidos o no pertenecen al restaurante indicado'
                });
        }

        const menu = await Menu.create({
            ...data,
            restaurant: restaurantId
        });

        return res.status(201).json({
            success: true,
            menu
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateMenu = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu)
            return res.status(404).json({
                success: false,
                message: `Menú no encontrado con id ${req.params.id}`
            });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === menu.restaurant.toString())) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para actualizar este menú'
            });
        }

        const updated = await Menu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            menu: updated
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteMenu = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) return res.status(404).json({ success: false, message: 'Menú no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === menu.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este menú' });
        }

        await Menu.findByIdAndUpdate(req.params.id, { isActive: false });
        return res.status(200).json({ success: true, message: 'Menú desactivado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const addMenuItem = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu)
            return res.status(404).json({
                success: false,
                message: `Menú no encontrado con id ${req.params.id}`
            });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === menu.restaurant.toString())) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para modificar este menú'
            });
        }

        const alreadyAdded = menu.items.some(
            i => i.product.toString() === req.body.product
        );

        if (alreadyAdded)
            return res.status(400).json({
                success: false,
                message: 'El producto ya está en este menú'
            });

        menu.items.push(req.body);
        await menu.save();

        return res.status(200).json({
            success: true,
            menu
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const removeMenuItem = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu)
            return res.status(404).json({
                success: false,
                message: `Menú no encontrado con id ${req.params.id}`
            });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === menu.restaurant.toString())) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para modificar este menú'
            });
        }

        menu.items = menu.items.filter(
            i => i.product.toString() !== req.params.productId
        );
        await menu.save();

        return res.status(200).json({
            success: true,
            menu
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
