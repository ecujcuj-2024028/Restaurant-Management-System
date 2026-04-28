'use strict';

import { Router } from 'express';
import { exportPDF, exportExcel, getChartData } from './reports.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole }     from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { validateReportOwnership } from '../../middlewares/validate-report-ownership.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Generación de informes administrativos en diversos formatos (PDF, Excel, JSON)
 */

/**
 * @swagger
 * /reports/pdf:
 *   get:
 *     summary: Generar reporte en formato PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Archivo PDF generado exitosamente }
 */
router.get('/pdf',   validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),validateReportOwnership, exportPDF);

/**
 * @swagger
 * /reports/excel:
 *   get:
 *     summary: Generar reporte en formato Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Archivo Excel generado exitosamente }
 */
router.get('/excel', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),validateReportOwnership, exportExcel);

/**
 * @swagger
 * /reports/data:
 *   get:
 *     summary: Obtener datos estructurados para gráficos del frontend
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Datos en formato JSON para visualización }
 */
router.get('/data',  validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),validateReportOwnership, getChartData);

export default router;