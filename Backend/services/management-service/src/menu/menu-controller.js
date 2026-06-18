'use strict';

import Menu    from '../menu/menu-models.js';
import Product from '../product/products-model.js';
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

    console.log(`[MenuService] getOwnedRestaurantIds - User: ${req.userId}, roles: [${roles.join(', ')}]`);

    if (isSystemAdmin) return null; // Acceso total
    
    if (isRestauranteAdmin) {
        const myRestaurants = await Restaurant.find({ ownerId: req.userId }, '_id');
        const ids = myRestaurants.map(r => r._id);
        console.log(`[MenuService] Found ${ids.length} owned restaurants for admin ${req.userId}`);
        return ids;
    }

    // Para CLIENTE u otros roles no administrativos, devolvemos null para que puedan ver 
    // menús basándose en el parámetro restaurantId de la query o ver todos los públicos.
    console.log(`[MenuService] Public/Client access (null restriction)`);
    return null; 
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

        const roles = req.userRoles || [];
        const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
        const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

        // SEGURIDAD: Filtrar por propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds) {
            // ADMIN_RESTAURANTE: ve sus restaurantes
            if (restaurant) {
                if (!ownedIds.some(id => id.toString() === restaurant)) {
                    return res.status(403).json({ success: false, message: 'No tienes permiso para ver este restaurante' });
                }
                filter.restaurant = restaurant;
            } else {
                filter.restaurant = { $in: ownedIds };
            }
        } else if (restaurant) {
            // CLIENTE o ADMIN_SISTEMA filtrando por restaurante específico
            filter.restaurant = restaurant;
        }

        // Restricción para CLIENTES: solo ven menús activos
        if (!isSystemAdmin && !isRestauranteAdmin) {
            filter.isActive = true;
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

        const roles = req.userRoles || [];
        const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
        const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

        // Si es cliente y el menú está inactivo, no debe verlo
        if (!isSystemAdmin && !isRestauranteAdmin && !menu.isActive) {
            return res.status(404).json({
                success: false,
                message: 'El menú solicitado no está disponible'
            });
        }

        // SEGURIDAD: Validar propiedad para Admin Restaurante
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
        const { restaurantId, price, ...data } = req.body;

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

        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        }

        if (data.items && data.items.length > 0) {
            // Manejar si items viene como string (form-data)
            const itemsList = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
            const ids = itemsList.map(i => i.product);
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
            
            data.items = itemsList;
        }

        const menu = await Menu.create({
            ...data,
            price: price ? Number(price) : null,
            restaurant: restaurantId,
            image: imageUrl
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
        const { id } = req.params;
        const { price, ...updateData } = req.body;

        const menu = await Menu.findById(id);

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

        if (price !== undefined) {
            updateData.price = price ? Number(price) : null;
        }

        if (updateData.items && typeof updateData.items === 'string') {
            updateData.items = JSON.parse(updateData.items);
        }

        if (req.file) {
            // Eliminar imagen anterior si existe
            if (menu.image) {
                const publicId = extractPublicId(menu.image);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }
            updateData.image = req.file.path;
        }

        const updated = await Menu.findByIdAndUpdate(
            req.params.id,
            updateData,
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

export const toggleMenuStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await Menu.findById(id);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: 'Menú no encontrado'
            });
        }

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(ownedId => ownedId.toString() === menu.restaurant.toString())) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para modificar este menú'
            });
        }
menu.isActive = !menu.isActive;
await menu.save();

const updatedMenu = await Menu.findById(id)
    .populate('restaurant',    'name')
    .populate('items.product', 'name price type image');

return res.status(200).json({
    success: true,
    message: `Menú ${menu.isActive ? 'activado' : 'desactivado'} correctamente`,
    isActive: menu.isActive,
    menu: updatedMenu
});
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
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
