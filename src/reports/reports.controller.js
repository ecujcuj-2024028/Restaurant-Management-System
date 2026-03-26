'use strict';

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Order from '../orders/order.model.js';
import { Review } from '../analytics/review.model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import mongoose from 'mongoose';

/* ─────────────────────────────────────────────────────────
   Helper: obtener datos de reporte
───────────────────────────────────────────────────────── */
const getReportData = async (restaurantId, startDate, endDate) => {
    const matchStage = { status: { $ne: 'cancelado' } };

    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
        matchStage.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Ventas por día
    const ventasPorDia = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                totalVentas: { $sum: '$total' },
                totalPedidos: { $sum: 1 },
                ticketPromedio: { $avg: '$total' },
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Top productos
    const topProductos = await Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                nombre: { $first: '$items.name' },
                cantidadVendida: { $sum: '$items.quantity' },
                ingresos: { $sum: '$items.subtotal' },
            }
        },
        { $sort: { cantidadVendida: -1 } },
        { $limit: 10 }
    ]);

    // Resumen general
    const resumen = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalIngresos: { $sum: '$total' },
                totalPedidos: { $sum: 1 },
                ticketPromedio: { $avg: '$total' },
            }
        }
    ]);

    // Distribución de estados
    const estadosPedidos = await Order.aggregate([
        {
            $match: restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)
                ? { restaurantId: new mongoose.Types.ObjectId(restaurantId) }
                : {}
        },
        { $group: { _id: '$status', total: { $sum: 1 } } }
    ]);

    // Inventario bajo stock
    const inventarioBajo = restaurantId
        ? await InventoryItem.findAll({
            where: { RestaurantId: restaurantId, IsActive: true },
            raw: true
        }).then(items => items.filter(i => parseFloat(i.Quantity) <= parseFloat(i.MinStock)))
        : [];

    // Rating promedio por plato
    const reviewStats = await Review.aggregate([
        ...(restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)
            ? [{ $match: { restauranteId: new mongoose.Types.ObjectId(restaurantId) } }]
            : []),
        {
            $group: {
                _id: '$platoId',
                promedio: { $avg: '$rating' },
                total: { $sum: 1 }
            }
        },
        { $sort: { promedio: -1 } },
        { $limit: 5 }
    ]);

    return {
        resumen: resumen[0] || { totalIngresos: 0, totalPedidos: 0, ticketPromedio: 0 },
        ventasPorDia,
        topProductos,
        estadosPedidos,
        inventarioBajo,
        reviewStats,
        generadoEn: new Date().toLocaleString('es-GT'),
        restaurantId: restaurantId || 'Todos',
        periodo: {
            desde: startDate || 'Inicio',
            hasta: endDate || 'Hoy',
        }
    };
};

/* ─────────────────────────────────────────────────────────
   GET /reports/pdf
───────────────────────────────────────────────────────── */
export const exportPDF = async (req, res) => {
    try {
        const { restaurantId, startDate, endDate } = req.query;
        const data = await getReportData(restaurantId, startDate, endDate);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="reporte-gastroManager-${Date.now()}.pdf"`);
        doc.pipe(res);

        // ── PORTADA ──────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 120).fill('#1F3864');
        doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold')
            .text('GastroManager', 50, 35);
        doc.fontSize(14).font('Helvetica')
            .text('Reporte de Análisis y Ventas', 50, 68);
        doc.fontSize(10)
            .text(`Generado: ${data.generadoEn}  |  Período: ${data.periodo.desde} → ${data.periodo.hasta}`, 50, 92);

        doc.fillColor('#333333').moveDown(4);

        // ── RESUMEN GENERAL ──────────────────────────────────
        doc.fillColor('#1F3864').fontSize(14).font('Helvetica-Bold')
            .text('Resumen General', 50, 140);
        doc.moveTo(50, 158).lineTo(545, 158).strokeColor('#1F3864').lineWidth(2).stroke();

        const resumenY = 168;
        const boxes = [
            { label: 'Ingresos Totales', value: `Q ${Number(data.resumen.totalIngresos).toFixed(2)}` },
            { label: 'Total Pedidos', value: data.resumen.totalPedidos },
            { label: 'Ticket Promedio', value: `Q ${Number(data.resumen.ticketPromedio).toFixed(2)}` },
        ];

        boxes.forEach((box, i) => {
            const x = 50 + i * 168;
            doc.rect(x, resumenY, 155, 60).fillAndStroke('#D6E4F0', '#1F3864');
            doc.fillColor('#1F3864').fontSize(10).font('Helvetica-Bold')
                .text(box.label, x + 10, resumenY + 10, { width: 135, align: 'center' });
            doc.fillColor('#1A6B2A').fontSize(16).font('Helvetica-Bold')
                .text(String(box.value), x + 10, resumenY + 30, { width: 135, align: 'center' });
        });

        doc.fillColor('#333333').moveDown(2);

        // ── TOP PRODUCTOS ────────────────────────────────────
        doc.y = resumenY + 80;
        doc.fillColor('#1F3864').fontSize(14).font('Helvetica-Bold')
            .text('Top 10 Productos Más Vendidos', 50);
        doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#1F3864').lineWidth(2).stroke();
        doc.moveDown(0.5);

        // Cabecera tabla
        const tableTop = doc.y + 5;
        const colWidths = [30, 220, 100, 120];
        const colX = [50, 80, 300, 400];

        doc.rect(50, tableTop, 495, 22).fill('#1F3864');
        ['#', 'Producto', 'Cant. Vendida', 'Ingresos (Q)'].forEach((h, i) => {
            doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
                .text(h, colX[i], tableTop + 6, { width: colWidths[i] });
        });

        data.topProductos.forEach((p, idx) => {
            const rowY = tableTop + 22 + idx * 20;
            if (idx % 2 === 0) doc.rect(50, rowY, 495, 20).fill('#F0F4FA');
            doc.fillColor('#333333').fontSize(9).font('Helvetica')
                .text(String(idx + 1), colX[0], rowY + 5, { width: colWidths[0] })
                .text(p.nombre || '-', colX[1], rowY + 5, { width: colWidths[1] })
                .text(String(p.cantidadVendida), colX[2], rowY + 5, { width: colWidths[2] })
                .text(`Q ${Number(p.ingresos).toFixed(2)}`, colX[3], rowY + 5, { width: colWidths[3] });
        });

        // ── VENTAS POR DÍA ───────────────────────────────────
        const ventasY = tableTop + 22 + data.topProductos.length * 20 + 30;
        doc.y = ventasY;
        doc.fillColor('#1F3864').fontSize(14).font('Helvetica-Bold')
            .text('Ventas por Día');
        doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#1F3864').lineWidth(2).stroke();
        doc.moveDown(0.5);

        const vtTop = doc.y + 5;
        doc.rect(50, vtTop, 495, 22).fill('#2E4057');
        ['Fecha', 'Pedidos', 'Total (Q)', 'Ticket Promedio (Q)'].forEach((h, i) => {
            const cx = [50, 170, 290, 390];
            const cw = [120, 120, 100, 150];
            doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
                .text(h, cx[i], vtTop + 6, { width: cw[i] });
        });

        data.ventasPorDia.forEach((v, idx) => {
            const rowY = vtTop + 22 + idx * 18;
            if (idx % 2 === 0) doc.rect(50, rowY, 495, 18).fill('#F5F5F5');
            const cx = [50, 170, 290, 390];
            const cw = [120, 120, 100, 150];
            doc.fillColor('#333333').fontSize(9).font('Helvetica')
                .text(v._id, cx[0], rowY + 4, { width: cw[0] })
                .text(String(v.totalPedidos), cx[1], rowY + 4, { width: cw[1] })
                .text(`Q ${Number(v.totalVentas).toFixed(2)}`, cx[2], rowY + 4, { width: cw[2] })
                .text(`Q ${Number(v.ticketPromedio).toFixed(2)}`, cx[3], rowY + 4, { width: cw[3] });
        });

        // ── INVENTARIO BAJO STOCK ────────────────────────────
        if (data.inventarioBajo.length > 0) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 50).fill('#C0392B');
            doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold')
                .text('Alertas de Inventario Bajo', 50, 17);

            doc.y = 70;
            const invTop = doc.y;
            doc.rect(50, invTop, 495, 22).fill('#C0392B');
            ['Insumo', 'Stock Actual', 'Stock Mínimo', 'Unidad'].forEach((h, i) => {
                const cx = [50, 220, 340, 450];
                doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
                    .text(h, cx[i], invTop + 6);
            });

            data.inventarioBajo.forEach((item, idx) => {
                const rowY = invTop + 22 + idx * 20;
                doc.rect(50, rowY, 495, 20).fill('#FADBD8');
                doc.fillColor('#C0392B').fontSize(9).font('Helvetica')
                    .text(item.Name, 50, rowY + 5)
                    .text(String(item.Quantity), 220, rowY + 5)
                    .text(String(item.MinStock), 340, rowY + 5)
                    .text(item.Unit, 450, rowY + 5);
            });
        }

        // ── FOOTER ───────────────────────────────────────────
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fillColor('#999999').fontSize(8)
                .text(`GastroManager © ${new Date().getFullYear()} — Página ${i + 1} de ${pages.count}`,
                    50, doc.page.height - 30, { align: 'center', width: 495 });
        }

        doc.end();

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────
   GET /reports/excel
───────────────────────────────────────────────────────── */
export const exportExcel = async (req, res) => {
    try {
        const { restaurantId, startDate, endDate } = req.query;
        const data = await getReportData(restaurantId, startDate, endDate);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GastroManager';
        workbook.created = new Date();

        // Estilos reutilizables
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
        const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        const subHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
        const subHeaderFont = { bold: true, color: { argb: 'FF1F3864' }, size: 10 };
        const alertFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFADBD8' } };
        const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
        const borderThin = { style: 'thin', color: { argb: 'FFCCCCCC' } };
        const allBorders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

        const setHeaderRow = (ws, row, values) => {
            const r = ws.addRow(values);
            r.eachCell(cell => {
                cell.fill = headerFill;
                cell.font = headerFont;
                cell.border = allBorders;
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
            r.height = 22;
            return r;
        };

        // ── HOJA 1: RESUMEN ──────────────────────────────────
        const wsResumen = workbook.addWorksheet('Resumen General');
        wsResumen.mergeCells('A1:C1');
        const titleCell = wsResumen.getCell('A1');
        titleCell.value = 'REPORTE GASTROMANAGER — RESUMEN GENERAL';
        titleCell.fill = headerFill;
        titleCell.font = { ...headerFont, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        wsResumen.getRow(1).height = 30;

        wsResumen.addRow([]);
        wsResumen.addRow(['Generado:', data.generadoEn, '']);
        wsResumen.addRow(['Período:', `${data.periodo.desde} → ${data.periodo.hasta}`, '']);
        wsResumen.addRow(['Restaurante:', data.restaurantId, '']);
        wsResumen.addRow([]);

        setHeaderRow(wsResumen, 7, ['Métrica', 'Valor', '']);
        const metricas = [
            ['Ingresos Totales', `Q ${Number(data.resumen.totalIngresos).toFixed(2)}`],
            ['Total de Pedidos', data.resumen.totalPedidos],
            ['Ticket Promedio', `Q ${Number(data.resumen.ticketPromedio).toFixed(2)}`],
        ];
        metricas.forEach(([k, v], i) => {
            const r = wsResumen.addRow([k, v, '']);
            r.getCell(1).font = subHeaderFont;
            r.getCell(2).fill = i % 2 === 0 ? greenFill : subHeaderFill;
            r.eachCell(c => { c.border = allBorders; c.alignment = { horizontal: 'center' }; });
        });

        wsResumen.addRow([]);
        setHeaderRow(wsResumen, wsResumen.lastRow.number + 1, ['Estado', 'Cantidad']);
        data.estadosPedidos.forEach(e => {
            const r = wsResumen.addRow([e._id, e.total]);
            r.eachCell(c => { c.border = allBorders; c.alignment = { horizontal: 'center' }; });
        });

        wsResumen.getColumn(1).width = 30;
        wsResumen.getColumn(2).width = 25;

        // ── HOJA 2: TOP PRODUCTOS ────────────────────────────
        const wsProductos = workbook.addWorksheet('Top Productos');
        wsProductos.mergeCells('A1:D1');
        const tp = wsProductos.getCell('A1');
        tp.value = 'TOP 10 PRODUCTOS MÁS VENDIDOS';
        tp.fill = headerFill; tp.font = { ...headerFont, size: 13 };
        tp.alignment = { horizontal: 'center', vertical: 'middle' };
        wsProductos.getRow(1).height = 28;
        wsProductos.addRow([]);

        setHeaderRow(wsProductos, 3, ['#', 'Producto', 'Cant. Vendida', 'Ingresos (Q)']);
        data.topProductos.forEach((p, i) => {
            const r = wsProductos.addRow([
                i + 1,
                p.nombre || '-',
                p.cantidadVendida,
                Number(p.ingresos).toFixed(2),
            ]);
            if (i % 2 === 0) r.getCell(1).fill = subHeaderFill;
            r.eachCell(c => { c.border = allBorders; c.alignment = { horizontal: 'center' }; });
        });

        wsProductos.getColumn(1).width = 6;
        wsProductos.getColumn(2).width = 35;
        wsProductos.getColumn(3).width = 18;
        wsProductos.getColumn(4).width = 18;

        // ── HOJA 3: VENTAS POR DÍA ──────────────────────────
        const wsVentas = workbook.addWorksheet('Ventas por Día');
        wsVentas.mergeCells('A1:D1');
        const vt = wsVentas.getCell('A1');
        vt.value = 'VENTAS POR DÍA';
        vt.fill = headerFill; vt.font = { ...headerFont, size: 13 };
        vt.alignment = { horizontal: 'center', vertical: 'middle' };
        wsVentas.getRow(1).height = 28;
        wsVentas.addRow([]);

        setHeaderRow(wsVentas, 3, ['Fecha', 'Pedidos', 'Total (Q)', 'Ticket Promedio (Q)']);
        data.ventasPorDia.forEach((v, i) => {
            const r = wsVentas.addRow([
                v._id,
                v.totalPedidos,
                Number(v.totalVentas).toFixed(2),
                Number(v.ticketPromedio).toFixed(2),
            ]);
            if (i % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            r.eachCell(c => { c.border = allBorders; c.alignment = { horizontal: 'center' }; });
        });

        ['A', 'B', 'C', 'D'].forEach((col, i) => {
            wsVentas.getColumn(col).width = [18, 12, 16, 22][i];
        });

        // ── HOJA 4: INVENTARIO BAJO STOCK ───────────────────
        if (data.inventarioBajo.length > 0) {
            const wsInv = workbook.addWorksheet('Inventario Bajo');
            wsInv.mergeCells('A1:E1');
            const iv = wsInv.getCell('A1');
            iv.value = 'ALERTAS DE INVENTARIO — STOCK BAJO';
            iv.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } };
            iv.font = { ...headerFont, size: 13 };
            iv.alignment = { horizontal: 'center', vertical: 'middle' };
            wsInv.getRow(1).height = 28;
            wsInv.addRow([]);

            setHeaderRow(wsInv, 3, ['Insumo', 'Stock Actual', 'Stock Mínimo', 'Unidad', 'Restaurante']);
            data.inventarioBajo.forEach(item => {
                const r = wsInv.addRow([
                    item.Name,
                    item.Quantity,
                    item.MinStock,
                    item.Unit,
                    item.RestaurantId,
                ]);
                r.eachCell(c => {
                    c.fill = alertFill;
                    c.border = allBorders;
                    c.alignment = { horizontal: 'center' };
                });
            });

            ['A', 'B', 'C', 'D', 'E'].forEach((col, i) => {
                wsInv.getColumn(col).width = [30, 16, 16, 14, 28][i];
            });
        }

        // ── ENVIAR ───────────────────────────────────────────
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="reporte-gastroManager-${Date.now()}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────
   GET /reports/data
───────────────────────────────────────────────────────── */
export const getChartData = async (req, res) => {
    try {
        const { restaurantId, startDate, endDate } = req.query;
        const data = await getReportData(restaurantId, startDate, endDate);

        return res.status(200).json({
            success: true,
            charts: {
                ventasPorDia: data.ventasPorDia.map(v => ({
                    fecha: v._id,
                    ventas: Number(v.totalVentas).toFixed(2),
                    pedidos: v.totalPedidos,
                    ticketPromedio: Number(v.ticketPromedio).toFixed(2),
                })),
                topProductos: data.topProductos.map(p => ({
                    nombre: p.nombre,
                    cantidadVendida: p.cantidadVendida,
                    ingresos: Number(p.ingresos).toFixed(2),
                })),
                estadosPedidos: data.estadosPedidos.map(e => ({
                    estado: e._id,
                    total: e.total,
                })),
                resumen: {
                    totalIngresos: Number(data.resumen.totalIngresos).toFixed(2),
                    totalPedidos: data.resumen.totalPedidos,
                    ticketPromedio: Number(data.resumen.ticketPromedio).toFixed(2),
                },
                inventarioBajo: data.inventarioBajo.length,
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};