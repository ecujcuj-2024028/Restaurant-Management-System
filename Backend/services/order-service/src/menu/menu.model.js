'use strict';

import mongoose from "mongoose";

const menuItemSchema = mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "El producto es requerido"]
        },
        displayOrder: { type: Number, default: 0 },
        isHighlighted: { type: Boolean, default: false },
        specialPrice: { type: Number, default: null }
    },
    { _id: false }
);

const menuSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        menuType: { type: String, default: "all_day" },
        price: { type: Number, default: null },
        items: { type: [menuItemSchema], default: [] },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export default mongoose.model('Menu', menuSchema);