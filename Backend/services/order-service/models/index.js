'use strict';

// Importar todos los modelos para registrarlos en Sequelize
// Este archivo se debe importar ANTES de llamar a sequelize.sync()

import Order from '../src/orders/order.model.js';
import OrderItem from '../src/orders/orderDetail.model.js';
import Reservation from '../src/reservations/reservation.model.js';
import Table from '../src/tables/table.model.js';
import ExternalOrder from '../src/external-orders/external-order.model.js';

export {
    Order,
    OrderItem,
    Reservation,
    Table,
    ExternalOrder
};
