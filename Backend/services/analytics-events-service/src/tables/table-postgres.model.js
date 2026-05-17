'use strict';

import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db-postgres.js';

const TablePostgres = sequelize.define('Table', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    restaurant: {
        type: DataTypes.STRING,
        allowNull: false
    },
    number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'tables',
    timestamps: true,
    underscored: true,
    freezeTableName: true
});

export default TablePostgres;
