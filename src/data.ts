import { Client, Product, Provider, InventoryMovement, SaleInsight, HistoricalOperation, ProviderStock } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Carlos Mendoza',
    cedula: 'V-15.123.456',
    rif: 'V-15123456-0',
    phone: '+58 412-111-2233',
    address: 'Av. Bolívar, Local 12, Maracay',
    whatBought: 'Pollo Entero',
    amountBoughtUsd: 294.00,
    balanceUsd: 1240.50,
    status: 'Con Deuda',
    vencimientoInfo: 'En 3 días',
    ultimoPago: 'Abono de $400 USD',
    metodoUltimoPago: 'Pago Móvil',
    referenciaUltimoPago: 'Ref. 382910'
  },
  {
    id: 'client-2',
    name: 'María Alejandra Rodríguez',
    cedula: 'V-18.999.000',
    rif: 'V-18999000-1',
    phone: '+58 424-333-4455',
    address: 'Calle Páez, Sector El Centro, Cagua',
    whatBought: 'Muslo',
    amountBoughtUsd: 195.00,
    balanceUsd: 3500.00,
    status: 'Atrasado',
    vencimientoInfo: 'Vencido hace 15 días',
    ultimoPago: 'Pago parcial de $150 USD',
    metodoUltimoPago: 'Divisas'
  },
  {
    id: 'client-3',
    name: 'José Gregorio Salas',
    cedula: 'V-12.333.111',
    rif: 'V-12333111-2',
    phone: '+58 414-555-6677',
    address: 'Urb. La Soledad, Calle 4, San Jacinto',
    whatBought: 'Pechuga',
    amountBoughtUsd: 570.00,
    balanceUsd: -320.00, // Saldo a favor (pago adelantado)
    status: 'A favor',
    vencimientoInfo: 'Saldo anticipado para la semana que viene',
    ultimoPago: 'Anticipado de $500 USD',
    metodoUltimoPago: 'Transferencia',
    referenciaUltimoPago: 'Ref. 4810292'
  },
  {
    id: 'client-4',
    name: 'Robert de Jesús El Valle',
    cedula: 'V-22.100.200',
    phone: '+58 412-999-8877',
    address: 'Mercado Libre de Maracay, Pasillo 3',
    whatBought: 'Alas',
    amountBoughtUsd: 120.00,
    balanceUsd: 0.00,
    status: 'Al día',
    vencimientoInfo: 'Solvente',
    ultimoPago: 'Pago completo de $120.00 USD',
    metodoUltimoPago: 'Transferencia'
  }
];

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'prov-1',
    name: 'Avícola Del Centro S.A.',
    phone: '+58 412-445-5667',
    productsBought: ['Pollo Entero', 'Pechuga'],
    totalOwedUsd: 4800.00,
    totalPaidUsd: 9500.00,
    paymentDueDate: '2026-06-25'
  },
  {
    id: 'prov-2',
    name: 'Distribuidora Pollos del Llano',
    phone: '+58 424-123-4567',
    productsBought: ['Muslo', 'Patas'],
    totalOwedUsd: 0.00,
    totalPaidUsd: 6500.00,
    paymentDueDate: 'Solvente'
  },
  {
    id: 'prov-3',
    name: 'Granja Hermanos Salas',
    phone: '+58 414-987-6543',
    productsBought: ['Pollo Entero', 'Alas'],
    totalOwedUsd: 12000.00,
    totalPaidUsd: 22000.00,
    paymentDueDate: '2026-06-30'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Pollo Entero',
    availableKg: 450.50,
    priceUsd: 2.45,
    status: 'EN STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'prod-2',
    name: 'Muslo',
    availableKg: 210.25,
    priceUsd: 1.95,
    status: 'ESTABLE',
    imageUrl: 'https://images.unsplash.com/photo-1587593817642-5b9db51aed4b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'prod-3',
    name: 'Patas',
    availableKg: 85.00,
    priceUsd: 1.10,
    status: 'BAJO',
    imageUrl: 'https://images.unsplash.com/photo-1606728035253-49e190477c84?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'prod-4',
    name: 'Pechuga',
    availableKg: 15.00,
    priceUsd: 3.80,
    status: 'STOCK CRÍTICO',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80',
  },
];

export const INITIAL_PROVIDER_STOCKS: ProviderStock[] = [
  { id: 'ps-1', providerId: 'prov-1', providerName: 'Avícola Del Centro S.A.', productId: 'prod-1', productName: 'Pollo Entero', availableKg: 150.00 },
  { id: 'ps-2', providerId: 'prov-1', providerName: 'Avícola Del Centro S.A.', productId: 'prod-4', productName: 'Pechuga', availableKg: 15.00 },
  { id: 'ps-3', providerId: 'prov-3', providerName: 'Granja Hermanos Salas', productId: 'prod-1', productName: 'Pollo Entero', availableKg: 300.50 },
  { id: 'ps-4', providerId: 'prov-2', providerName: 'Distribuidora Pollos del Llano', productId: 'prod-2', productName: 'Muslo', availableKg: 210.25 },
  { id: 'ps-5', providerId: 'prov-2', providerName: 'Distribuidora Pollos del Llano', productId: 'prod-3', productName: 'Patas', availableKg: 85.00 }
];

export const INITIAL_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-1',
    dateTime: '18 Jun 2026, 09:15 AM',
    productName: 'Pollo Entero',
    type: 'ENTRADA',
    quantityKg: 120.00,
    balanceAfterKg: 450.50,
    providerName: 'Avícola Del Centro S.A.',
    pricePaidUsd: 2.10,
    tasaApplied: 36.50
  },
  {
    id: 'mov-2',
    dateTime: '18 Jun 2026, 08:30 AM',
    productName: 'Pechuga',
    type: 'SALIDA',
    quantityKg: 45.00,
    balanceAfterKg: 15.00,
  },
  {
    id: 'mov-3',
    dateTime: '17 Jun 2026, 04:45 PM',
    productName: 'Muslo',
    type: 'SALIDA',
    quantityKg: 12.50,
    balanceAfterKg: 210.25,
  },
];

export const PERIODIC_INSIGHTS: SaleInsight[] = [
  // Diario
  { periodo: 'Diario', intervalName: 'Hoy (18 Jun)', volumenKg: 1240, ingresosUsd: 6820.00, gananciaNetaUsd: 1023.00, gananciaPerdida: 'Ganancia' },
  { periodo: 'Diario', intervalName: 'Ayer (17 Jun)', volumenKg: 1150, ingresosUsd: 6325.00, gananciaNetaUsd: 948.75, gananciaPerdida: 'Ganancia' },
  { periodo: 'Diario', intervalName: '16 Jun', volumenKg: 980, ingresosUsd: 5390.00, gananciaNetaUsd: 808.50, gananciaPerdida: 'Ganancia' },
  // Semanal
  { periodo: 'Semanal', intervalName: 'Esta Semana (S25)', volumenKg: 7850, ingresosUsd: 43175.00, gananciaNetaUsd: 6476.25, gananciaPerdida: 'Ganancia' },
  { periodo: 'Semanal', intervalName: 'Semana Anterior (S24)', volumenKg: 8120, ingresosUsd: 44660.00, gananciaNetaUsd: 6699.00, gananciaPerdida: 'Ganancia' },
  // Mensual
  { periodo: 'Mensual', intervalName: 'Junio 2026', volumenKg: 28500, ingresosUsd: 156750.00, gananciaNetaUsd: 23512.50, gananciaPerdida: 'Ganancia' },
  { periodo: 'Mensual', intervalName: 'Mayo 2026', volumenKg: 26000, ingresosUsd: 143000.00, gananciaNetaUsd: 21450.00, gananciaPerdida: 'Ganancia' },
  // Trimestral
  { periodo: 'Trimestral', intervalName: 'Q2 2026 (Abr-Jun)', volumenKg: 82000, ingresosUsd: 451000.00, gananciaNetaUsd: 67650.00, gananciaPerdida: 'Ganancia' },
  { periodo: 'Trimestral', intervalName: 'Q1 2026 (Ene-Mar)', volumenKg: 79000, ingresosUsd: 434500.00, gananciaNetaUsd: 65175.00, gananciaPerdida: 'Ganancia' },
  // Anual
  { periodo: 'Anual', intervalName: 'Año 2026 (Proyectado)', volumenKg: 330000, ingresosUsd: 1815000.00, gananciaNetaUsd: 272250.00, gananciaPerdida: 'Ganancia' },
  { periodo: 'Anual', intervalName: 'Año 2025 (Cerrado)', volumenKg: 310000, ingresosUsd: 1705000.00, gananciaNetaUsd: 255750.00, gananciaPerdida: 'Ganancia' }
];

export const INITIAL_HISTORICAL_OPERATIONS: HistoricalOperation[] = [
  {
    id: '10001',
    dateTime: '19 Jun 2026, 09:30 AM',
    type: 'CLIENT_PAYMENT',
    description: 'Venta de contado de 120 Kg de Pollo Entero a Carlos Mendoza',
    origin: 'Inventario (Pollo Entero)',
    destination: 'Carlos Mendoza',
    amountUsd: 294.00,
    kg: 120,
    reference: 'Pago Móvil Ref. 993821'
  },
  {
    id: '10002',
    dateTime: '18 Jun 2026, 02:45 PM',
    type: 'PROVIDER_PAYMENT',
    description: 'Abono de deuda de $2500.00 USD a Avícola Del Centro S.A.',
    origin: 'Caja Principal',
    destination: 'Avícola Del Centro S.A.',
    amountUsd: 2500.00,
    reference: 'Transferencia Ref. 8847291'
  },
  {
    id: '10003',
    dateTime: '18 Jun 2026, 01:00 PM',
    type: 'INVENTORY_MANUAL_IN',
    description: 'Ajuste de inventario: Entrada de 50 Kg de Pechuga por lote especial',
    origin: 'Ajuste Manual',
    destination: 'Inventario (Pechuga)',
    kg: 50
  },
  {
    id: '10004',
    dateTime: '17 Jun 2026, 11:15 AM',
    type: 'PURCHASE',
    description: 'Registro de compra a Granja Hermanos Salas: 300 Kg de Pollo Entero',
    origin: 'Granja Hermanos Salas',
    destination: 'Inventario (Pollo Entero)',
    amountUsd: 630.00,
    kg: 300
  }
];
