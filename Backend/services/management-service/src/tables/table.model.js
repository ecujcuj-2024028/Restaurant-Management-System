'use strict';

import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db-postgres.js';

const Table = sequelize.define('Table', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    restaurant: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: "El restaurante es requerido" }
        }
    },
    number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: "El número de mesa es requerido" }
        }
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: "La capacidad de la mesa es requerida" }
        }
    },
    location: {
        type: DataTypes.ENUM('interior', 'exterior', 'terraza', 'vip'),
        defaultValue: 'interior',
    },
    availability: {
        type: DataTypes.ENUM('disponible', 'ocupado', 'reservado'),
        defaultValue: 'disponible',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'tables'
});

export default Table;
