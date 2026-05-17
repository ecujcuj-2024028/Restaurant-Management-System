'use strict';

import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db-postgres.js';
import { User } from '../user/user.model.js';

export const RoleUpgradeRequest = sequelize.define('RoleUpgradeRequest', {
    Id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'id'
    },
    UserId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        field: 'user_id'
    },
    RequestedRole: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'requested_role'
    },
    Status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
        field: 'status'
    },
    ReviewedBy: {
        type: DataTypes.STRING(16),
        allowNull: true,
        field: 'reviewed_by'
    },
    CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
    UpdatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
    }
}, {
    tableName: 'role_upgrade_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Relaciones
RoleUpgradeRequest.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(RoleUpgradeRequest, { foreignKey: 'user_id', as: 'RoleUpgradeRequests' });