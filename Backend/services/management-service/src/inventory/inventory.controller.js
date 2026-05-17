'use strict';

import { Op } from 'sequelize';
import { InventoryItem } from './inventory.model.js';
import { sendLowStockEmail } from '../../helpers/email-service.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = req.userRoles?.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null; // Acceso total
    if (!isRestauranteAdmin) return []; // Otros roles

    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: verificar propiedad del restaurante
───────────────────────────────────────────────────────────────────────────── */
const checkOwnership = async (req, restaurantId) => {
    const isAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    if (isAdmin) return true;
    
    // Si no es admin sistema, validamos que sea dueño
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId: req.userId });
    return !!restaurant;
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: verificar y notificar stock bajo
───────────────────────────────────────────────────────────────────────────── */
const checkAndNotifyLowStock = async (item, restaurantId) => {
    if (parseFloat(item.Quantity) <= parseFloat(item.MinStock)) {
        try {
            const adminEmail = process.env.ROOT_ADMIN_EMAIL;
            const adminName  = 'Administrador';

            if (adminEmail) {
                await sendLowStockEmail({
                    adminEmail,
                    adminName,
                    itemName    : item.Name,
                    currentStock: parseFloat(item.Quantity),
                    minStock    : parseFloat(item.MinStock),
                    unit        : item.Unit,
                    restaurantId,
                });
            }
        } catch (emailErr) {
            console.error('[Inventory] Error enviando alerta de stock bajo:', emailErr.message);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /inventory-pg
   Crea un ítem de inventario en Postgres
───────────────────────────────────────────────────────────────────────────── */
export const createInventoryItemPg = async (req, res) => {
    try {
        const {
            restaurantId,
            mongoProductId,
            name,
            quantity,
            unit,
            costPerUnit,
            minStock,
        } = req.body;

        if (!restaurantId || !name) {
            return res.status(400).json({
                success: false,
                message: 'Los campos restaurantId y name son obligatorios.',
            });
        }

        if (!(await checkOwnership(req, restaurantId))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para gestionar inventario en este restaurante' });
        }

        // Verificar duplicado (nombre único por restaurante)
        const existing = await InventoryItem.findOne({
            where: { RestaurantId: restaurantId, Name: name, IsActive: true },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Ya existe un ítem con el nombre "${name}" en este restaurante.`,
            });
        }

        const item = await InventoryItem.create({
            RestaurantId  : restaurantId,
            MongoProductId: mongoProductId || null,
            Name          : name,
            Quantity      : quantity    ?? 0,
            Unit          : unit        ?? 'unidades',
            CostPerUnit   : costPerUnit ?? 0,
            MinStock      : minStock    ?? 5,
        });

        // Verificar si ya inicia con stock bajo
        await checkAndNotifyLowStock(item, restaurantId);

        return res.status(201).json({
            success: true,
            item,
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un ítem con ese nombre en el restaurante.',
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /inventory-pg/:restaurantId
   Lista ítems de inventario de un restaurante
───────────────────────────────────────────────────────────────────────────── */
export const getInventoryByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { lowStock, basicsOnly } = req.query;

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, restaurantId))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver el inventario de este restaurante' });
        }

        const where = { RestaurantId: restaurantId, IsActive: true };
        
        // FILTRADO SOLICITADO: Solo insumos básicos (carne, tomate, etc)
        if (basicsOnly === 'true') {
            where.MongoProductId = { [Op.is]: null };
        }

        const items = await InventoryItem.findAll({ where, order: [['Name', 'ASC']] });

        // Marcar cuáles están bajo el umbral
        const enriched = items.map(item => {
            const plain      = item.toJSON();
            plain.isLowStock = parseFloat(plain.Quantity) <= parseFloat(plain.MinStock);
            plain.totalCost  = (parseFloat(plain.Quantity) * parseFloat(plain.CostPerUnit)).toFixed(2);
            return plain;
        });

        const filtered = lowStock === 'true'
            ? enriched.filter(i => i.isLowStock)
            : enriched;

        return res.status(200).json({
            success: true,
            count  : filtered.length,
            items  : filtered,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /inventory-pg/:id/quantity
   Actualiza la cantidad de un ítem (descuento o reposición)
───────────────────────────────────────────────────────────────────────────── */
export const updateQuantity = async (req, res) => {
    try {
        const { id }       = req.params;
        const { quantity, operation } = req.body;

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: 'El campo quantity es obligatorio.',
            });
        }

        const item = await InventoryItem.findByPk(id);

        if (!item || !item.IsActive) {
            return res.status(404).json({
                success: false,
                message: 'Ítem de inventario no encontrado.',
            });
        }

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, item.RestaurantId))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para modificar este inventario' });
        }

        let newQty;
        switch (operation) {
            case 'add':
                newQty = parseFloat(item.Quantity) + parseFloat(quantity);
                break;
            case 'subtract':
                newQty = parseFloat(item.Quantity) - parseFloat(quantity);
                if (newQty < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Stock insuficiente. Disponible: ${item.Quantity} ${item.Unit}.`,
                    });
                }
                break;
            default: // 'set'
                newQty = parseFloat(quantity);
        }

        item.Quantity = newQty;
        await item.save();

        await checkAndNotifyLowStock(item, item.RestaurantId);

        return res.status(200).json({
            success: true,
            item,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PUT /inventory-pg/:id
   Actualiza un ítem de inventario completo
───────────────────────────────────────────────────────────────────────────── */
export const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            quantity,
            unit,
            costPerUnit,
            minStock,
            isActive
        } = req.body;

        const item = await InventoryItem.findByPk(id);

        if (!item || !item.IsActive) {
            return res.status(404).json({
                success: false,
                message: 'Ítem de inventario no encontrado.',
            });
        }

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, item.RestaurantId))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para modificar este inventario' });
        }

        // Si se cambia el nombre, validar que no choque con otro en el mismo restaurante
        if (name && name !== item.Name) {
            const existing = await InventoryItem.findOne({
                where: {
                    RestaurantId: item.RestaurantId,
                    Name: name,
                    IsActive: true,
                    Id: { [Op.ne]: id }
                }
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: `Ya existe otro ítem con el nombre "${name}" en este restaurante.`
                });
            }
        }

        // Actualizar campos
        if (name !== undefined) item.Name = name;
        if (quantity !== undefined) item.Quantity = quantity;
        if (unit !== undefined) item.Unit = unit;
        if (costPerUnit !== undefined) item.CostPerUnit = costPerUnit;
        if (minStock !== undefined) item.MinStock = minStock;
        if (isActive !== undefined) item.IsActive = isActive;

        await item.save();

        // Notificar si el nuevo stock es bajo
        await checkAndNotifyLowStock(item, item.RestaurantId);

        return res.status(200).json({
            success: true,
            item,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /inventory-pg/:id
   Desactiva un ítem de inventario
───────────────────────────────────────────────────────────────────────────── */
export const deleteInventoryItemPg = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await InventoryItem.findByPk(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Ítem no encontrado.',
            });
        }

        // SEGURIDAD: Validar propiedad
        if (!(await checkOwnership(req, item.RestaurantId))) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este inventario' });
        }

        item.IsActive = false;
        await item.save();

        return res.status(200).json({
            success: true,
            message: 'Ítem desactivado correctamente.',
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
