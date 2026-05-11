'use strict';
import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../../configs/db-postgres.js';
import Table from '../tables/table.model.js';

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tableId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'table_id', // Forzamos el nombre de la columna en la DB
        validate: {
            notNull: { msg: 'La mesa es requerida' }
        }
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'user_id',
        validate: {
            notNull: { msg: 'El usuario es requerido' }
        }
    },
    restaurantId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'restaurant_id',
        validate: {
            notNull: { msg: 'El restaurante es requerido' }
        }
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: {
                args: /^\d{4}-\d{2}-\d{2}$/,
                msg: 'La fecha debe tener formato YYYY-MM-DD'
            }
        }
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: {
                args: /^([01]\d|2[0-3]):[0-5]\d$/,
                msg: 'La hora debe tener formato HH:MM (24 h)'
            }
        }
    },
    status: {
        type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
        defaultValue: 'pendiente',
    },
    customerName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'customer_name', // Mapeo explícito
    },
    customerPhone: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'customer_phone',
    },
    guestCount: {
        type: DataTypes.INTEGER,
        field: 'guest_count',
        validate: {
            min: {
                args: [1],
                msg: 'Debe haber al menos 1 comensal'
            }
        }
    },
    notes: {
        type: DataTypes.STRING(300),
    }
}, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'reservations',
    indexes: [
        {
            unique: true,
            fields: ['table_id', 'date', 'time'],
            where: {
                status: {
                    [Op.ne]: 'cancelada'
                }
            }
        },
        {
            fields: ['user_id', 'date']
        }
    ]
});

// Relaciones
Table.hasMany(Reservation, { foreignKey: 'table_id', as: 'reservations' });
Reservation.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });

export default Reservation;