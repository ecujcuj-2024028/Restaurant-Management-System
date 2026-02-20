'use strict';

import Menu    from '../menu/menu-models.js';
import Product from '../product/products-model.js';

export const getMenus = async (req, res) => {
    try {
        const { restaurant, menuType, isActive } = req.query;
        const filter = {};

        if (restaurant) filter.restaurant = restaurant;
        if (menuType)   filter.menuType   = menuType;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const menus = await Menu.find(filter)
            .populate('restaurant',    'name')
            .populate('items.product', 'name price type image')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: menus.length,
            menus
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

export const createMenu = async (req, res) => {
    try {
        const data = req.body;

        if (data.items && data.items.length > 0) {
            const ids   = data.items.map(i => i.product);
            const found = await Product.find({
                _id:        { $in: ids },
                restaurant: req.user.restaurant,
                isActive:   true
            }).select('_id');

            if (found.length !== ids.length)
                return res.status(400).json({
                    success: false,
                    message: 'Uno o más productos son inválidos o no pertenecen a tu restaurante'
                });
        }

        const menu = await Menu.create({
            ...data,
            restaurant: req.user.restaurant
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

        if (req.user.role !== 'admin' &&
            menu.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para actualizar este menú'
            });

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

export const addMenuItem = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu)
            return res.status(404).json({
                success: false,
                message: `Menú no encontrado con id ${req.params.id}`
            });

        if (req.user.role !== 'admin' &&
            menu.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para modificar este menú'
            });

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

        if (req.user.role !== 'admin' &&
            menu.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para modificar este menú'
            });

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

export const deleteMenu = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);

        if (!menu)
            return res.status(404).json({
                success: false,
                message: `Menú no encontrado con id ${req.params.id}`
            });

        if (req.user.role !== 'admin' &&
            menu.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para eliminar este menú'
            });

        await Menu.findByIdAndUpdate(req.params.id, { isActive: false });

        return res.status(200).json({
            success: true,
            message: 'Menú desactivado correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};