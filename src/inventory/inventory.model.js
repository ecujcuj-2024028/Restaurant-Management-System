'use strict';

import mongoose from "mongoose";

const inventorySchema = mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: [true, "El restaurante es requerido"]
        },

        name: {
            type: String,
            required: [true, "El nombre del insumo es requerido"],
            trim: true
        },

        quantity: {
            type: Number,
            required: [true, "La cantidad es requerida"],
            default: 0
        },

        unit: {
            type: String,
            enum: ["kg", "g", "l", "ml", "unidades"],
            default: "unidades"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Inventory', inventorySchema);
