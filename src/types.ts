export interface Client {
  id: string;
  name: string; // Nombre y Apellido
  cedula?: string; // Cédula (Opcional)
  rif?: string; // RIF
  phone: string; // Teléfono de Contacto
  address?: string; // Dirección (Opcional)
  whatBought?: string; // Qué compró
  amountBoughtUsd?: number; // Monto de lo comprado
  balanceUsd: number; // Deuda positiva, o saldo negativo si es saldo a favor/pagado por adelantado
  status: 'Con Deuda' | 'Atrasado' | 'Al día' | 'A favor';
  vencimientoInfo?: string;
  ultimoPago?: string;
  metodoUltimoPago?: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro';
  referenciaUltimoPago?: string;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  productsBought: string[]; // Qué rubros vende
  totalOwedUsd: number; // Lo que le debemos
  totalPaidUsd: number; // Lo que le hemos pagado
  paymentDueDate: string; // Fecha de vencimiento o "Solvente"
  lastPaymentMethod?: string;
  lastPaymentReference?: string;
}

export interface Product {
  id: string;
  name: string; // Rubro / Producto
  availableKg: number;
  priceUsd: number; // Precio base en USD (Al detal o al mayor)
  status: 'EN STOCK' | 'ESTABLE' | 'BAJO' | 'STOCK CRÍTICO';
  imageUrl: string;
  costKgUsd?: number; // Precio de compra unitario más reciente
}

export interface InventoryMovement {
  id: string;
  dateTime: string;
  productName: string;
  type: 'ENTRADA' | 'SALIDA';
  quantityKg: number;
  balanceAfterKg: number;
  providerId?: string;
  providerName?: string;
  pricePaidUsd?: number;
  tasaApplied?: number;
  motivo?: string; // Motivo de la entrada o salida manual
}

export interface ClientPayment {
  id: string;
  clientId: string;
  clientName: string;
  amountUsd: number;
  type: 'CONTADO' | 'CRÉDITO';
  schedule?: 'Semanal' | 'Quincenal' | 'Completo' | 'N/A';
  dateTime: string;
  paymentMethod: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro';
  reference?: string;
  isAdvance?: boolean; // Pago por adelantado
  productBoughtName?: string; // Rubro
  quantityKg?: number; // Cantidad kilos
  totalPaidNowUsd?: number; // Lo que abona en ese momento
}

export interface ProviderPayment {
  id: string;
  providerId: string;
  providerName: string;
  productName: string;
  amountUsd: number;
  dateTime: string;
  notes?: string;
  paymentMethod?: string;
  reference?: string;
}

export interface SaleInsight {
  periodo: 'Diario' | 'Semanal' | 'Mensual' | 'Trimestral' | 'Anual';
  intervalName: string;
  volumenKg: number;
  ingresosUsd: number;
  gananciaNetaUsd: number;
  gananciaPerdida: 'Ganancia' | 'Pérdida';
}

export interface HistoricalOperation {
  id: string;
  dateTime: string;
  type: 'CLIENT_PAYMENT' | 'PROVIDER_PAYMENT' | 'PURCHASE' | 'INVENTORY_MANUAL_IN' | 'INVENTORY_MANUAL_OUT' | 'QUICK_OUT' | 'MERMA';
  description: string;
  origin: string; // Origen (e.g., "Inventario", "Abastos El Valle", "Caja")
  destination: string; // Destino (e.g., "Cliente", "Proveedor S.A.", "Inventario General")
  amountUsd?: number;
  kg?: number;
  reference?: string;
}

export interface Merma {
  id: string;
  dateTime: string;
  productId: string;
  productName: string;
  quantityKg: number;
  costPerKgUsd: number;
  salePricePerKgUsd: number;
  reason: string; // e.g., "Evaporación" | "Goteo" | "Recortes" | "Daño" | "Inventario no registrado" | "Vencimiento" | "Otros"
  notes?: string;
}

export interface ProviderStock {
  id: string;
  providerId: string;
  providerName: string;
  productId: string;
  productName: string;
  availableKg: number;
}

