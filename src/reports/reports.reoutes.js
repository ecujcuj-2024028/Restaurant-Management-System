'use strict';

import { Router } from 'express';
import { exportPDF, exportExcel, getChartData } from './reports.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { hasRole }     from '../../middlewares/hasRole.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { validateReportOwnership } from '../../middlewares/validate-report-ownership.js';

const router = Router();

/**
 * GET /reports/pdf?restaurantId=&startDate=&endDate=
 * Descarga un PDF con resumen, top productos, ventas por día e inventario bajo
 */
router.get('/pdf',   validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),validateReportOwnership, exportPDF);

/**
 * GET /reports/excel?restaurantId=&startDate=&endDate=
 * Descarga un Excel con 4 hojas: resumen, top productos, ventas por día, inventario
 */
router.get('/excel', validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),validateReportOwnership, exportExcel);

/**
 * GET /reports/data?restaurantId=&startDate=&endDate=
 * Devuelve JSON listo para renderizar gráficos en el frontend
 */
router.get('/data',  validateJWT, hasRole(ADMIN_RESTAURANTE, ADMIN_SISTEMA),validateReportOwnership, getChartData);

export default router;