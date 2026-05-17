"use strict";

import Event from "./events-model.js";
import Table from "../tables/table.model.js";
import TablePostgres from "../tables/table-postgres.model.js";
import Product from "../product/products-model.js";
import Restaurant from "../restaurants/restaurant.model.js";
import { cloudinary, extractPublicId } from "../../middlewares/restaurant-uploader.js";
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';
import {
  checkAndUpdateEventStatus
} from "../../helpers/event-helpers.js";
import mongoose from "mongoose";

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = req.userRoles?.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null; // Acceso total
    if (!isRestauranteAdmin) return []; // Otros roles no ven nada o solo lo suyo

    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

export const getEvents = async (req, res) => {
  try {
    const { restaurantId, status } = req.query;
    const filter = { isActive: true };

    // SEGURIDAD: Filtrar por propiedad
    const ownedIds = await getOwnedRestaurantIds(req);
    if (ownedIds) {
        if (restaurantId) {
            if (!ownedIds.some(id => id.toString() === restaurantId)) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para ver este restaurante' });
            }
            filter.restaurant = restaurantId;
        } else {
            filter.restaurant = { $in: ownedIds };
        }
    } else if (restaurantId) {
        filter.restaurant = restaurantId;
    }

    if (status) filter.status = status;

    const events = await Event.find(filter)
      .populate("restaurant", "name")
      .populate("featuredProducts", "name price image")
      .sort({ startDate: 1 });

    // Actualizar estados antes de responder
    const updatedEvents = await Promise.all(
      events.map((e) => checkAndUpdateEventStatus(e))
    );

    return res.status(200).json({
      success: true,
      count: updatedEvents.length,
      events: updatedEvents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("restaurant", "name location")
      .populate("tables", "number capacity type")
      .populate("featuredProducts", "name price description image");

    if (!event)
      return res.status(404).json({
        success: false,
        message: `Evento no encontrado con id ${req.params.id}`,
      });

    // SEGURIDAD: Validar propiedad
    const ownedIds = await getOwnedRestaurantIds(req);
    if (ownedIds && !ownedIds.some(id => id.toString() === event.restaurant._id.toString())) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para ver este evento' });
    }

    const eventWithStatus = await checkAndUpdateEventStatus(event);
    const metrics = await calculateEventMetrics(event._id);

    return res.status(200).json({
      success: true,
      event: eventWithStatus,
      metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createEvent = async (req, res) => {
  try {
    const data = req.body;
    const restaurantId = req.body.restaurantId || req.body.restaurant;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "El campo restaurant o restaurantId es obligatorio.",
      });
    }

    // SEGURIDAD: Validar propiedad
    const ownedIds = await getOwnedRestaurantIds(req);
    if (ownedIds && !ownedIds.some(id => id.toString() === restaurantId)) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para crear eventos en este restaurante' });
    }

    // Validar fechas
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de fin debe ser posterior a la de inicio",
      });
    }

    // Determinar estado inicial
    let status = "scheduled";
    const now = new Date();
    if (now >= new Date(data.startDate) && now <= new Date(data.endDate)) {
      status = "active";
    }

    const event = await Event.create({
      ...data,
      restaurant: restaurantId,
      image: req.file ? req.file.path : (data.image || null),
      status,
    });

    return res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({
        success: false,
        message: `Evento no encontrado con id ${req.params.id}`,
      });

    // SEGURIDAD: Validar propiedad
    const ownedIds = await getOwnedRestaurantIds(req);
    if (ownedIds && !ownedIds.some(oid => oid.toString() === event.restaurant.toString())) {
        return res.status(403).json({ success: false, message: 'No autorizado para este evento' });
    }

    if (req.body.featuredProducts && req.body.featuredProducts.length > 0) {
      const productIds = req.body.featuredProducts;
      const products = await Product.find({
        _id: { $in: productIds },
        restaurant: event.restaurant,
        isActive: true,
      });

      if (products.length !== productIds.length) {
        return res.status(404).json({
          success: false,
          message:
            "Uno o más productos no existen o no pertenecen al restaurante",
        });
      }
    }

    if (req.file) {
      if (event.image) {
        const publicId = extractPublicId(event.image);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      event.image = req.file.path;
    }

    // Actualizar campos manualmente para disparar validadores con contexto completo
    const updateData = { ...req.body };
    delete updateData.image; // Evitar sobreescribir si vino como string en body
    Object.assign(event, updateData);

    const updated = await event.save();
    await updated.populate("featuredProducts", "name price image");

    return res.status(200).json({
      success: true,
      event: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(oid => oid.toString() === event.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para este evento' });
        }

        event.status = status;
        await event.save();

        return res.status(200).json({ success: true, event });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(oid => oid.toString() === event.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para este evento' });
        }

        event.isActive = false;
        await event.save();

        return res.status(200).json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const addFeaturedProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { productId } = req.body;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(oid => oid.toString() === event.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para este evento' });
        }

        const product = await Product.findOne({ _id: productId, restaurant: event.restaurant });
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado en este restaurante' });

        if (event.featuredProducts.includes(productId)) {
            return res.status(400).json({ success: false, message: 'El producto ya es destacado' });
        }

        event.featuredProducts.push(productId);
        await event.save();

        return res.status(200).json({ success: true, event });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const removeFeaturedProduct = async (req, res) => {
    try {
        const { id, productId } = req.params;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(oid => oid.toString() === event.restaurant.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para este evento' });
        }

        event.featuredProducts = event.featuredProducts.filter(p => p.toString() !== productId);
        await event.save();

        return res.status(200).json({ success: true, event });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
