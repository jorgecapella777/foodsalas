import { jsPDF } from 'jspdf';
import { Client, Provider, HistoricalOperation, ClientPayment, ProviderPayment } from '../types';

/**
 * Dibuja un encabezado corporativo elegante y estilizado con la marca "FOOD SALAS".
 */
function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Barra de título principal (Fondo azul oscuro pizarra)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 25, 'F');
  
  // Nombre de la Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Inversiones Food Salas F.P.', 10, 11);
  
  // Subtítulo de la Empresa
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Control Integral de Inventario, Saldos y Cuentas por Cobrar/Pagar', 10, 16);
  
  // Datos de contacto/Ubicación en el encabezado
  doc.setFontSize(7.5);
  doc.text('Fecha: ' + new Date().toLocaleString('es-VE'), 140, 11);
  doc.text('Ubicación: Yaracuy, Venezuela', 140, 16);
  
  // Barra decorativa brillante (Indigo)
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 25, 210, 3, 'F');
  
  // Título del reporte específico
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, 10, 36);
  
  if (subtitle) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(subtitle, 10, 41);
  }
  
  // Línea sutil de separación
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(10, 44, 200, 44);
}

/**
 * Dibuja una tabla de forma artesanal y ultra estética en el PDF con paginado automático.
 */
function drawTable(
  doc: jsPDF, 
  startY: number, 
  headers: string[], 
  rows: any[][], 
  colWidths: number[]
): number {
  let currY = startY;
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  
  // Dibujar encabezados de tabla
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(10, currY, totalWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  let currX = 10;
  headers.forEach((h, idx) => {
    doc.text(h, currX + 1.5, currY + 4.5);
    currX += colWidths[idx];
  });
  
  currY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59); // slate-800
  
  // Dibujar filas
  rows.forEach((row, rIdx) => {
    // Si la fila excede la altura de la página, creamos una nueva página
    if (currY > pageHeight - 15) {
      doc.addPage();
      currY = 15;
      
      // Volver a dibujar encabezado en la nueva página
      doc.setFillColor(79, 70, 229);
      doc.rect(10, currY, totalWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      
      let newX = 10;
      headers.forEach((h, idx) => {
        doc.text(h, newX + 1.5, currY + 4.5);
        newX += colWidths[idx];
      });
      currY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
    }
    
    // Color de fondo alterno (efecto cebra)
    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(10, currY, totalWidth, 6, 'F');
    }
    
    // Dibujar celdas
    let x = 10;
    row.forEach((cell, idx) => {
      const cellStr = cell !== undefined && cell !== null ? String(cell) : '';
      
      // Truncar texto para que quepa en la columna
      let maxChars = Math.floor(colWidths[idx] * 1.5);
      if (maxChars < 5) maxChars = 5;
      let textToDraw = cellStr;
      if (cellStr.length > maxChars) {
        textToDraw = cellStr.substring(0, maxChars - 2) + '..';
      }
      
      doc.text(textToDraw, x + 1.5, currY + 4);
      x += colWidths[idx];
    });
    
    // Línea separadora sutil
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(10, currY + 6, 10 + totalWidth, currY + 6);
    
    currY += 6;
  });
  
  return currY + 3;
}

/**
 * 1. EXPORTAR EXPEDIENTE DE CLIENTE A PDF
 */
export function exportClientExpedientePDF(
  client: Client,
  metrics: {
    debioCount: number;
    adelantadoCount: number;
    alDiaCount: number;
    atrasadoCount: number;
  },
  sales: HistoricalOperation[],
  payments: ClientPayment[]
) {
  const doc = new jsPDF();
  
  // Encabezado
  drawHeader(
    doc, 
    `EXPEDIENTE DEL CLIENTE: ${client.name.toUpperCase()}`, 
    'Análisis de Fidelidad Comercial, Deudas, Rubros Vendidos e Historial de Abonos'
  );
  
  // Ficha de Identificación del Cliente
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(10, 48, 190, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800
  
  doc.text(`CÉDULA / RIF: ${client.cedula || client.rif || 'N/A'}`, 13, 54);
  doc.text(`TELÉFONO: ${client.phone}`, 13, 60);
  doc.text(`DIRECCIÓN: ${client.address || 'No declarada'}`, 13, 65);
  
  // Status de cuenta resaltado
  doc.text(`SALDO ACTUAL DEUDA: $${client.balanceUsd.toFixed(2)} USD`, 110, 54);
  doc.text(`ESTADO COMERCIAL: ${client.status.toUpperCase()}`, 110, 60);
  doc.text(`ÚLTIMO PAGO: ${client.ultimoPago || 'Ninguno'}`, 110, 65);
  
  // 1. Métricas de Fidelidad
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('I. MÉTRICAS DE COMPORTAMIENTO Y FIDELIDAD', 10, 75);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 77, 200, 77);
  
  // Dibujar métricas en caja
  doc.setFillColor(254, 254, 254);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 80, 190, 14);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Veces que debió: ${metrics.debioCount}`, 15, 88);
  doc.text(`Pagos adelantados: ${metrics.adelantadoCount}`, 60, 88);
  doc.text(`Pagos al día: ${metrics.alDiaCount}`, 110, 88);
  doc.text(`Pagos atrasados: ${metrics.atrasadoCount}`, 155, 88);
  
  // 2. Historial de Rubros Vendidos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('II. DETALLE DE VENTAS Y RUBROS DESPACHADOS', 10, 102);
  doc.line(10, 104, 200, 104);
  
  const saleHeaders = ['Fecha', 'Descripción del Despacho', 'Cant. (KG)', 'Monto ($)'];
  const saleRows = sales.map(op => {
    const descText = op.description.split(':').slice(1).join(':').split('(')[0].trim() || op.description;
    return [
      op.dateTime.replace('Hoy, ', '').replace('Ayer, ', ''),
      descText,
      op.kg ? op.kg.toFixed(1) + ' KG' : 'N/A',
      '$' + op.amountUsd?.toFixed(2)
    ];
  });
  
  let nextY = drawTable(doc, 107, saleHeaders, saleRows, [30, 100, 30, 30]);
  
  // 3. Historial de Abonos
  if (nextY > 240) {
    doc.addPage();
    nextY = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('III. HISTORIAL DE RECOBROS Y ABONOS A CRÉDITO', 10, nextY);
  doc.line(10, nextY + 2, 200, nextY + 2);
  
  const paymentHeaders = ['Fecha del Abono', 'Canal / Vía de Pago', 'Comprobante / Ref.', 'Abonado ($)'];
  const paymentRows = payments.map(p => [
    p.dateTime.replace('Hoy, ', '').replace('Ayer, ', ''),
    p.isAdvance ? `ADELANTADO (${p.paymentMethod})` : p.paymentMethod,
    p.reference || 'Efectivo/Directo',
    '+$' + p.amountUsd.toFixed(2)
  ]);
  
  nextY = drawTable(doc, nextY + 5, paymentHeaders, paymentRows, [45, 55, 50, 40]);
  
  // Guardar archivo directamente
  doc.save(`Expediente_Cliente_${client.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * 2. EXPORTAR EXPEDIENTE DE PROVEEDOR A PDF
 */
export function exportProviderExpedientePDF(
  provider: Provider,
  metrics: {
    purchaseCount: number;
    totalOwed: number;
    totalPaid: number;
  },
  purchases: HistoricalOperation[],
  payments: ProviderPayment[]
) {
  const doc = new jsPDF();
  
  // Encabezado
  drawHeader(
    doc, 
    `EXPEDIENTE DEL PROVEEDOR: ${provider.name.toUpperCase()}`, 
    'Seguimiento de Despachos Recibidos, Deudas Consolidadas y Registro de Desembolsos'
  );
  
  // Ficha de Identificación del Proveedor
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(10, 48, 190, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  
  doc.text(`PROVEEDOR: ${provider.name}`, 13, 54);
  doc.text(`CONTACTO DE ENLACE: ${provider.phone}`, 13, 60);
  doc.text(`RUBROS CONTRATADOS: ${provider.productsBought.join(', ') || 'Varios'}`, 13, 65);
  
  doc.text(`SALDO PENDIENTE POR PAGAR: $${provider.totalOwedUsd.toFixed(2)} USD`, 110, 54);
  doc.text(`PLAZO DE VENCIMIENTO: ${provider.paymentDueDate.toUpperCase()}`, 110, 60);
  doc.text(`TOTAL PAGADO HISTÓRICO: $${provider.totalPaidUsd.toFixed(2)} USD`, 110, 65);
  
  // 1. Resumen Operativo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('I. ESTADÍSTICAS OPERATIVAS DE ABASTECIMIENTO', 10, 75);
  doc.line(10, 77, 200, 77);
  
  doc.setFillColor(254, 254, 254);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 80, 190, 14);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Lotes despachados: ${metrics.purchaseCount}`, 20, 88);
  doc.text(`Monto total adeudado acumulado: $${metrics.totalOwed.toFixed(2)} USD`, 70, 88);
  doc.text(`Total cancelado a la fecha: $${metrics.totalPaid.toFixed(2)} USD`, 140, 88);
  
  // 2. Historial de Despachos Recibidos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('II. LOTES DE MERCANCÍA Y DESPACHOS RECIBIDOS', 10, 102);
  doc.line(10, 104, 200, 104);
  
  const purchaseHeaders = ['Fecha Despacho', 'Rubro / Detalle', 'Volumen (KG)', 'Monto ($)'];
  const purchaseRows = purchases.map(op => {
    const descText = op.description.split(':').slice(1).join(':').split('(')[0].trim() || op.description;
    return [
      op.dateTime.replace('Hoy, ', '').replace('Ayer, ', ''),
      descText,
      op.kg ? op.kg.toFixed(1) + ' KG' : 'N/A',
      '$' + op.amountUsd?.toFixed(2)
    ];
  });
  
  let nextY = drawTable(doc, 107, purchaseHeaders, purchaseRows, [35, 95, 30, 30]);
  
  // 3. Pagos realizados
  if (nextY > 240) {
    doc.addPage();
    nextY = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('III. HISTORIAL DE AMORTIZACIONES Y PAGOS DE FACTURA', 10, nextY);
  doc.line(10, nextY + 2, 200, nextY + 2);
  
  const paymentHeaders = ['Fecha de Pago', 'Canal / Vía de Pago', 'Datos del Comprobante / Ref.', 'Pagado ($)'];
  const paymentRows = payments.map(p => [
    p.dateTime.replace('Hoy, ', '').replace('Ayer, ', ''),
    p.paymentMethod || 'Efectivo',
    p.reference || 'Efectivo/Directo',
    '-$' + p.amountUsd.toFixed(2)
  ]);
  
  nextY = drawTable(doc, nextY + 5, paymentHeaders, paymentRows, [45, 55, 50, 40]);
  
  // Guardar PDF
  doc.save(`Expediente_Proveedor_${provider.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * 3. EXPORTAR UNA TRANSACCIÓN INDIVIDUAL EN PDF (RECIBO / FACTURA ESTILO SENIAT)
 */
export function exportTransactionPDF(operation: HistoricalOperation, tasaBcvUsd?: number) {
  // Formato Ticket de 80mm de ancho (ancho estándar de impresora térmica) x 180mm de alto
  const doc = new jsPDF('p', 'mm', [80, 180]); 
  
  // Color de texto negro puro para máxima legibilidad, simulando cinta de tinta monocromática
  doc.setTextColor(0, 0, 0);
  
  // 1. ENCABEZADO DE ESTABLECIMIENTO AVALADO (Estilo SENIAT)
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text('Inversiones Food Salas F.P.', 40, 10, { align: 'center' });
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('RIF: V-17841454-6', 40, 14, { align: 'center' });
  doc.text('DIRECCIÓN: Yaracuy, Venezuela', 40, 18, { align: 'center' });
  doc.text('TELÉFONO: +58 412-1563887', 40, 22, { align: 'center' });
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('========================================', 40, 26, { align: 'center' });
  
  // Document Type & Subtitle (SENIAT Style)
  doc.setFontSize(8);
  doc.text('SOPORTE DE OPERACIÓN DIGITAL', 40, 30, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.text('(CONTROL DE CARTERA - NO FISCAL)', 40, 34, { align: 'center' });
  
  doc.setFont('courier', 'bold');
  doc.text('========================================', 40, 38, { align: 'center' });
  
  // 2. METADATA DE LA TRANSACCIÓN
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  
  let currY = 43;
  const lineSpacing = 4.2;
  
  const drawTicketLine = (label: string, value: string) => {
    doc.setFont('courier', 'bold');
    doc.text(label, 6, currY);
    doc.setFont('courier', 'normal');
    doc.text(value || 'N/A', 32, currY);
    currY += lineSpacing;
  };
  
  const formattedDate = operation.dateTime.replace('Hoy, ', '').replace('Ayer, ', '');
  
  drawTicketLine('REGISTRO NRO:', operation.id);
  drawTicketLine('FECHA Y HORA:', formattedDate);
  
  const typeMap: Record<string, string> = {
    'CLIENT_PAYMENT': 'Abono de Cliente',
    'PROVIDER_PAYMENT': 'Pago a Proveedor',
    'PURCHASE': 'Despacho Recibido',
    'INVENTORY_MANUAL_IN': 'Ajuste Ent. Inv',
    'INVENTORY_MANUAL_OUT': 'Ajuste Sal. Inv',
    'QUICK_OUT': 'Egreso de Caja',
    'MERMA': 'Merma Registrada'
  };
  
  drawTicketLine('OPERACIÓN:   ', typeMap[operation.type] || operation.type);
  drawTicketLine('ASOCIADO:    ', (operation.origin || operation.destination || 'SISTEMA').toUpperCase());
  
  if (operation.reference) {
    drawTicketLine('REF / SOPORTE:', operation.reference);
  }
  
  // Divider
  doc.setFont('courier', 'bold');
  doc.text('----------------------------------------', 40, currY, { align: 'center' });
  currY += 4.5;
  
  // 3. TABLA DE RUBROS (ESTILO IMPRESORA FISCAL)
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONCEPTO', 6, currY);
  doc.text('CANT (KG)', 46, currY, { align: 'right' });
  doc.text('TOTAL ($)', 74, currY, { align: 'right' });
  
  currY += 3;
  doc.setFont('courier', 'normal');
  doc.text('----------------------------------------', 40, currY, { align: 'center' });
  currY += 4.2;
  
  const conceptName = typeMap[operation.type] || 'Servicio/Producto';
  const kgVal = operation.kg !== undefined ? `${operation.kg.toFixed(2)}` : '0.00';
  const priceVal = operation.amountUsd !== undefined ? `$${operation.amountUsd.toFixed(2)}` : '$0.00';
  
  doc.text(conceptName, 6, currY);
  doc.text(kgVal, 46, currY, { align: 'right' });
  doc.text(priceVal, 74, currY, { align: 'right' });
  
  currY += 4.2;
  
  // Divider
  doc.setFont('courier', 'bold');
  doc.text('----------------------------------------', 40, currY, { align: 'center' });
  currY += 4.5;
  
  // 4. TOTALES RESALTADOS (CON TASA BCV)
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('SUBTOTAL:', 6, currY);
  doc.text(priceVal, 74, currY, { align: 'right' });
  currY += lineSpacing;
  
  doc.text('TOTAL USD:', 6, currY);
  doc.text(priceVal, 74, currY, { align: 'right' });
  currY += lineSpacing;
  
  if (operation.amountUsd && tasaBcvUsd) {
    const bcvAmount = operation.amountUsd * tasaBcvUsd;
    doc.text('TASA BCV REF:', 6, currY);
    doc.text(`Bs. ${tasaBcvUsd.toFixed(2)}`, 74, currY, { align: 'right' });
    currY += lineSpacing;
    
    doc.text('TOTAL VES:', 6, currY);
    doc.text('Bs. ' + bcvAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 74, currY, { align: 'right' });
    currY += lineSpacing;
  }
  
  // Divider
  doc.setFont('courier', 'bold');
  doc.text('========================================', 40, currY, { align: 'center' });
  currY += 4.5;
  
  // 5. NOTA EXPLICATIVA DE LA OPERACIÓN (GLOSA FISCAL)
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('COMENTARIO / OBSERVACIÓN:', 6, currY);
  currY += 3.5;
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  const wrappedDesc = doc.splitTextToSize(operation.description, 68);
  wrappedDesc.forEach((line: string) => {
    doc.text(line, 6, currY);
    currY += 3.2;
  });
  
  currY += 2;
  
  // Divider
  doc.setFont('courier', 'bold');
  doc.text('========================================', 40, currY, { align: 'center' });
  currY += 4.5;
  
  // 6. PIE DE COMPROBANTE CON MENSAJE CORPORATIVO
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('SISTEMA INTEGRAL DE CARTERA', 40, currY, { align: 'center' });
  currY += 3.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('*** GRACIAS POR CONFIAR EN NOSOTROS ***', 40, currY, { align: 'center' });
  currY += 3.5;
  doc.setFontSize(6.5);
  doc.text('Inversiones Food Salas F.P. - Yaracuy, Venezuela', 40, currY, { align: 'center' });
  
  doc.save(`Factura_Control_${operation.id}.pdf`);
}

/**
 * 4. EXPORTAR HISTÓRICO DE OPERACIONES AUDITABLES A PDF
 */
export function exportOperationsHistoryPDF(
  operations: HistoricalOperation[],
  dateRangeLabel: string
) {
  const doc = new jsPDF();
  
  // Encabezado
  drawHeader(
    doc, 
    'HISTÓRICO COMPLETO DE OPERACIONES Y AUDITORÍA', 
    `Periodo seleccionado: ${dateRangeLabel.toUpperCase()} - Detalle analítico de todos los registros`
  );
  
  // 1. Datos del Volumen General
  const totalInUsd = operations.reduce((acc, op) => {
    if (['CLIENT_PAYMENT', 'PURCHASE'].includes(op.type) && op.amountUsd) {
      return acc + op.amountUsd;
    }
    return acc;
  }, 0);
  
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 46, 190, 10, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(10, 46, 190, 10, 'D');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL TRANSACCIONES EN FILTRO: ${operations.length} registros`, 15, 52);
  doc.text(`VOLUMEN EN DINERO TRANSACCIONADO: $${totalInUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD`, 105, 52);
  
  // 2. Tabla de Transacciones
  const headers = ['Fecha y Hora', 'Operación', 'Descripción / Detalle', 'Asociado', 'Monto USD'];
  
  const opTypeShort: Record<string, string> = {
    'CLIENT_PAYMENT': 'Abono/Cobro',
    'PROVIDER_PAYMENT': 'Pago Deuda',
    'PURCHASE': 'Despacho',
    'INVENTORY_MANUAL_IN': 'Ajuste Entrada',
    'INVENTORY_MANUAL_OUT': 'Ajuste Salida',
    'QUICK_OUT': 'Egreso Rápido',
    'MERMA': 'Merma'
  };
  
  const rows = operations.map(op => {
    let asociado = op.origin || op.destination || 'Sistema';
    if (asociado === 'Inventario' || asociado === 'Caja') {
      asociado = op.destination !== 'Inventario' && op.destination !== 'Caja' ? op.destination : op.origin;
    }
    
    return [
      op.dateTime.replace('Hoy, ', '').replace('Ayer, ', ''),
      opTypeShort[op.type] || op.type,
      op.description.split(':').slice(1).join(':').trim() || op.description,
      asociado,
      op.amountUsd ? '$' + op.amountUsd.toFixed(2) : 'N/A'
    ];
  });
  
  drawTable(doc, 60, headers, rows, [32, 24, 84, 28, 22]);
  
  doc.save(`Historico_Operaciones_${dateRangeLabel.replace(/\s+/g, '_')}.pdf`);
}

/**
 * 5. EXPORTAR FACTURA DE CLIENTE DETALLADA A PDF (ESTILO RECIBO TALONARIO FOTO)
 */
export function exportClientInvoicePDF(
  client: Client,
  invoiceNumber: string,
  selectedMovements: HistoricalOperation[],
  tasaBcvUsd: number,
  dateFrom: string,
  dateTo: string
) {
  const doc = new jsPDF();
  
  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = String(today.getFullYear());

  // Borde externo de la factura/recibo (estilo talonario físico)
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.rect(15, 15, 180, 245, 'D'); // Caja externa principal

  // Título principal centrado arriba
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('RECIBO DE PAGO', 105, 23, { align: 'center' });

  // Separador de cabecera
  doc.line(15, 28, 195, 28);

  // Bloque izquierdo de la cabecera: Nombre comercial, teléfono y dirección (reemplaza Sello y RIF)
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('INVERSIONES FOOD SALAS F.P.', 18, 34);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Teléfono: +58 412-1563887', 18, 41);
  doc.text('Dirección: Yaracuy, Venezuela', 18, 48);

  // Línea divisora vertical entre datos del negocio y fecha/N°
  doc.line(135, 28, 135, 55);

  // Bloque derecho de la cabecera: Tabla de fecha DIA | MES | AÑO
  doc.line(135, 37, 195, 37); // línea horizontal interna
  doc.line(155, 28, 155, 37); // separador de DIA
  doc.line(175, 28, 175, 37); // separador de MES

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DIA', 145, 33, { align: 'center' });
  doc.text('MES', 165, 33, { align: 'center' });
  doc.text('AÑO', 185, 33, { align: 'center' });

  // Valores de la fecha actual
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(dayStr, 145, 43, { align: 'center' });
  doc.text(monthStr, 165, 43, { align: 'center' });
  doc.text(yearStr, 185, 43, { align: 'center' });

  // Separador horizontal antes del N° de Recibo
  doc.line(135, 47, 195, 47);

  // Número de control correlativo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`N° ${invoiceNumber.padStart(6, '0')}`, 165, 52, { align: 'center' });

  // Separador horizontal antes de los datos del cliente
  doc.line(15, 55, 195, 55);

  // Datos del Cliente
  // "Señor/es:" cambiado por "Nombre/Razon Social:"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Nombre/Razon Social:', 18, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, 55, 61);

  // Separador horizontal entre cliente y dirección
  doc.line(15, 65, 195, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', 18, 71);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const clientAddr = client.address || 'N/A';
  const clientRif = client.rif || 'N/A';
  const clientPhone = client.phone || 'N/A';
  doc.text(clientAddr, 35, 71);

  // Separador horizontal para Cédula y Teléfono en dos cuadros abajo
  doc.line(15, 75, 195, 75);

  // Línea divisora vertical entre Cédula y Teléfono
  doc.line(105, 75, 105, 83);

  // Cuadro 1: Cédula / RIF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Cédula / RIF:', 18, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(clientRif, 40, 80);

  // Cuadro 2: Teléfono
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Teléfono:', 108, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(clientPhone, 126, 80);

  // Separador horizontal antes de la tabla
  doc.line(15, 83, 195, 83);

  // Tabla estilo talonario: CANT. | DESCRIPCION | IMPORTE Bs.
  doc.line(15, 90, 195, 90); // Separador de títulos

  // Columnas de la tabla (Líneas verticales continuas)
  doc.line(35, 83, 35, 190);
  doc.line(155, 83, 155, 190);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CANT.', 25, 88, { align: 'center' });
  doc.text('DESCRIPCION', 95, 88, { align: 'center' });
  doc.text('IMPORTE Bs.', 175, 88, { align: 'center' });

  // Llenar filas de la tabla de abonos/despachos seleccionados
  let rowY = 96;
  let totalKg = 0;
  let totalUsd = 0;

  selectedMovements.forEach((op) => {
    if (rowY >= 188) return; // Límite físico del talonario de una página

    const kg = op.kg || 0;
    const total = op.amountUsd || 0;
    const priceUnit = kg > 0 ? (total / kg) : 0;
    
    totalKg += kg;
    totalUsd += total;

    // Obtener la descripción formateada
    let cleanDesc = op.description;
    if (op.description.includes(':')) {
      cleanDesc = op.description.split(':').slice(1).join(':').trim();
    }
    if (cleanDesc.includes(' a ')) {
      cleanDesc = cleanDesc.split(' a ')[0].trim();
    }

    const fullDesc = `${cleanDesc} ($${priceUnit.toFixed(2)}/KG - Total: $${total.toFixed(2)} USD)`;
    const totalBs = total * tasaBcvUsd;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Escribir fila
    doc.text(`${kg.toFixed(2)} KG`, 25, rowY - 2, { align: 'center' });
    doc.text(fullDesc, 38, rowY - 2);
    doc.text(`${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.`, 175, rowY - 2, { align: 'center' });

    // Dibujar línea sutil de renglón
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(15, rowY, 195, rowY);
    rowY += 7;
  });

  // Dibujar renglones vacíos simulados para estilo de papel preimpreso
  while (rowY < 190) {
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.15);
    doc.line(15, rowY, 195, rowY);
    rowY += 7;
  }

  // Restaurar estilos de línea negra gruesa
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Línea inferior de la tabla
  doc.line(15, 190, 195, 190);

  // Bloque inferior de observaciones (izquierda) y totales (derecha)
  doc.line(115, 190, 115, 235); // Separador vertical central

  // Observaciones
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Observ.', 18, 196);
  
  // Construir texto corrido de observaciones descriptivas sobre las compras
  const obsParts: string[] = [];
  selectedMovements.forEach(op => {
    const isCredito = op.description.toUpperCase().includes('CREDITO') || op.description.toUpperCase().includes('CRÉDITO');
    const cond = isCredito ? 'A CRÉDITO' : 'DE CONTADO';
    
    let cleanDesc = op.description;
    if (op.description.includes(':')) {
      cleanDesc = op.description.split(':').slice(1).join(':').trim();
    }
    if (cleanDesc.includes(' a ')) {
      cleanDesc = cleanDesc.split(' a ')[0].trim();
    }
    
    const kg = op.kg || 0;
    obsParts.push(`El cliente compró ${kg.toFixed(2)} KG de ${cleanDesc} el día ${op.dateTime} cotizado a la tasa de Bs. ${tasaBcvUsd.toFixed(2)} por dólar bajo la condición ${cond}.`);
  });
  const obsText = obsParts.join(' ');
  const splitObs = doc.splitTextToSize(obsText, 93);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text(splitObs, 18, 202);

  // Sección de Totales (Subtotal, Total USD, Tasa BCV REF y Total Bs.D)
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SUBTOTAL:', 118, 198);
  doc.setFont('helvetica', 'normal');
  doc.text(`$ ${totalUsd.toFixed(2)} USD`, 192, 198, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL Bs.D HOY:', 118, 206);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bs. ${(totalUsd * tasaBcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 192, 206, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('TASA BCV REF:', 118, 214);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bs. ${tasaBcvUsd.toFixed(2)}`, 192, 214, { align: 'right' });

  // Recuadro sombreado para el Total Final en Dólares (TOTAL USD)
  doc.setFillColor(245, 245, 245);
  doc.rect(115, 222, 80, 13, 'F');
  doc.rect(115, 222, 80, 13, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL USD:', 118, 230);
  doc.text(`$ ${totalUsd.toFixed(2)} USD`, 192, 230, { align: 'right' });

  // Borde contenedor inferior de firmas
  doc.rect(15, 190, 180, 45, 'D');

  // Área de Firmas formal de recibimiento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Firma Autorizada / Despachador', 50, 252, { align: 'center' });
  doc.line(20, 248, 80, 248);

  doc.text('Recibido Conforme / Cliente', 150, 252, { align: 'center' });
  doc.line(120, 248, 180, 248);

  doc.save(`Recibo_De_Pago_${client.name.replace(/\s+/g, '_')}_Nro_${invoiceNumber}.pdf`);
}
