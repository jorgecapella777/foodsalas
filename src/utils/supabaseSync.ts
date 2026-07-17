import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Client, 
  Provider, 
  Product, 
  ProviderStock, 
  InventoryMovement, 
  HistoricalOperation, 
  Merma, 
  ClientPayment, 
  ProviderPayment 
} from '../types';

// Helper to check network status
export function isOnline(): boolean {
  // En entornos iframe/sandboxed, window.navigator.onLine reporta falsos negativos muy a menudo.
  // Es preferible asumir que estamos online e intentar las peticiones (fail-fast), en vez de bloquear preventivamente.
  return true;
}

// -----------------------------------------------------------------------------
// LOCAL DEVICE STORAGE (INTERNAL DATABASE) HELPERS
// -----------------------------------------------------------------------------
export function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading local storage key "${key}":`, e);
  }
  return defaultValue;
}

export function saveLocalData(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing local storage key "${key}":`, e);
  }
}

// -----------------------------------------------------------------------------
// PENDING OFFLINE QUEUE MANAGEMENT
// -----------------------------------------------------------------------------
interface PendingAction {
  table: string;
  action: 'upsert' | 'delete';
  payload: any;
}

const OFFLINE_QUEUE_KEY = 'supabase_pending_sync_queue';

export function getPendingQueue(): PendingAction[] {
  return getLocalData<PendingAction[]>(OFFLINE_QUEUE_KEY, []);
}

export function savePendingQueue(queue: PendingAction[]): void {
  saveLocalData(OFFLINE_QUEUE_KEY, queue);
}

// Adds an action to the offline queue and immediately triggers sync if online
export async function queueSyncAction(table: string, action: 'upsert' | 'delete', payload: any): Promise<void> {
  const queue = getPendingQueue();
  queue.push({ table, action, payload });
  savePendingQueue(queue);

  if (isOnline() && isSupabaseConfigured) {
    await processPendingSyncQueue();
  }
}

// Clear sync queue
export function clearPendingQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// -----------------------------------------------------------------------------
// SCONVERT CONVERTERS: CLIENT TYPES <=> DATABASE SCHEMAS (SNAKE_CASE)
// -----------------------------------------------------------------------------

export const converters: Record<string, { toDB: (x: any) => any; toClient: (x: any) => any }> = {
  clients: {
    toDB: (c: Client) => ({
      id: c.id,
      name: c.name,
      cedula: c.cedula || null,
      rif: c.rif || null,
      phone: c.phone,
      address: c.address || null,
      what_bought: c.whatBought || null,
      amount_bought_usd: c.amountBoughtUsd || 0,
      balance_usd: c.balanceUsd || 0,
      status: c.status,
      vencimiento_info: c.vencimientoInfo || null,
      ultimo_pago: c.ultimoPago || null,
      metodo_ultimo_pago: c.metodoUltimoPago || null,
      referencia_ultimo_pago: c.referenciaUltimoPago || null
    }),
    toClient: (r: any): Client => ({
      id: r.id,
      name: r.name,
      cedula: r.cedula || undefined,
      rif: r.rif || undefined,
      phone: r.phone,
      address: r.address || undefined,
      whatBought: r.what_bought || undefined,
      amountBoughtUsd: r.amount_bought_usd !== null ? parseFloat(r.amount_bought_usd) : undefined,
      balanceUsd: parseFloat(r.balance_usd || 0),
      status: r.status,
      vencimientoInfo: r.vencimiento_info || undefined,
      ultimoPago: r.ultimo_pago || undefined,
      metodoUltimoPago: r.metodo_ultimo_pago || undefined,
      referenciaUltimoPago: r.referencia_ultimo_pago || undefined
    })
  },
  providers: {
    toDB: (p: Provider) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      products_bought: p.productsBought || [],
      total_owed_usd: p.totalOwedUsd || 0,
      total_paid_usd: p.totalPaidUsd || 0,
      payment_due_date: p.paymentDueDate,
      last_payment_method: p.lastPaymentMethod || null,
      last_payment_reference: p.lastPaymentReference || null
    }),
    toClient: (r: any): Provider => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      productsBought: r.products_bought || [],
      totalOwedUsd: parseFloat(r.total_owed_usd || 0),
      totalPaidUsd: parseFloat(r.total_paid_usd || 0),
      paymentDueDate: r.payment_due_date,
      lastPaymentMethod: r.last_payment_method || undefined,
      lastPaymentReference: r.last_payment_reference || undefined
    })
  },
  products: {
    toDB: (p: Product) => ({
      id: p.id,
      name: p.name,
      available_kg: p.availableKg || 0,
      price_usd: p.priceUsd || 0,
      status: p.status,
      image_url: p.imageUrl || '',
      cost_kg_usd: p.costKgUsd || 0
    }),
    toClient: (r: any): Product => ({
      id: r.id,
      name: r.name,
      availableKg: parseFloat(r.available_kg || 0),
      priceUsd: parseFloat(r.price_usd || 0),
      status: r.status,
      imageUrl: r.image_url || '',
      costKgUsd: r.cost_kg_usd !== null ? parseFloat(r.cost_kg_usd || 0) : undefined
    })
  },
  provider_stocks: {
    toDB: (ps: ProviderStock) => ({
      id: ps.id,
      provider_id: ps.providerId,
      provider_name: ps.providerName,
      product_id: ps.productId,
      product_name: ps.productName,
      available_kg: ps.availableKg || 0
    }),
    toClient: (r: any): ProviderStock => ({
      id: r.id,
      providerId: r.provider_id,
      providerName: r.provider_name,
      productId: r.product_id,
      productName: r.product_name,
      availableKg: parseFloat(r.available_kg || 0)
    })
  },
  inventory_movements: {
    toDB: (m: InventoryMovement) => ({
      id: m.id,
      date_time: m.dateTime,
      product_name: m.productName,
      type: m.type,
      quantity_kg: m.quantityKg || 0,
      balance_after_kg: m.balanceAfterKg || 0,
      provider_id: m.providerId || null,
      provider_name: m.providerName || null,
      price_paid_usd: m.pricePaidUsd || null,
      tasa_applied: m.tasaApplied || null,
      motivo: m.motivo || null
    }),
    toClient: (r: any): InventoryMovement => ({
      id: r.id,
      dateTime: r.date_time,
      productName: r.product_name,
      type: r.type,
      quantityKg: parseFloat(r.quantity_kg || 0),
      balanceAfterKg: parseFloat(r.balance_after_kg || 0),
      providerId: r.provider_id || undefined,
      providerName: r.provider_name || undefined,
      pricePaidUsd: r.price_paid_usd !== null ? parseFloat(r.price_paid_usd) : undefined,
      tasaApplied: r.tasa_applied !== null ? parseFloat(r.tasa_applied) : undefined,
      motivo: r.motivo || undefined
    })
  },
  historical_operations: {
    toDB: (o: HistoricalOperation) => ({
      id: o.id,
      date_time: o.dateTime,
      type: o.type,
      description: o.description,
      origin: o.origin,
      destination: o.destination,
      amount_usd: o.amountUsd || null,
      kg: o.kg || null,
      reference: o.reference || null
    }),
    toClient: (r: any): HistoricalOperation => ({
      id: r.id,
      dateTime: r.date_time,
      type: r.type,
      description: r.description,
      origin: r.origin,
      destination: r.destination,
      amountUsd: r.amount_usd !== null ? parseFloat(r.amount_usd) : undefined,
      kg: r.kg !== null ? parseFloat(r.kg) : undefined,
      reference: r.reference || undefined
    })
  },
  mermas: {
    toDB: (m: Merma) => {
      let prodId = m.productId;
      if (prodId === 'p-1') prodId = 'prod-1';
      if (prodId === 'p-2') prodId = 'prod-4';
      return {
        id: m.id,
        date_time: m.dateTime,
        product_id: prodId,
        product_name: m.productName,
        quantity_kg: m.quantityKg || 0,
        cost_per_kg_usd: m.costPerKgUsd || 0,
        sale_price_per_kg_usd: m.salePricePerKgUsd || 0,
        reason: m.reason,
        notes: m.notes || null
      };
    },
    toClient: (r: any): Merma => ({
      id: r.id,
      dateTime: r.date_time,
      productId: r.product_id,
      productName: r.product_name,
      quantityKg: parseFloat(r.quantity_kg || 0),
      costPerKgUsd: parseFloat(r.cost_per_kg_usd || 0),
      salePricePerKgUsd: parseFloat(r.sale_price_per_kg_usd || 0),
      reason: r.reason,
      notes: r.notes || undefined
    })
  },
  client_payments: {
    toDB: (cp: ClientPayment) => ({
      id: cp.id,
      client_id: cp.clientId,
      client_name: cp.clientName,
      amount_usd: cp.amountUsd || 0,
      type: cp.type,
      schedule: cp.schedule || null,
      date_time: cp.dateTime,
      payment_method: cp.paymentMethod,
      reference: cp.reference || null,
      is_advance: cp.isAdvance || false,
      product_bought_name: cp.productBoughtName || null,
      quantity_kg: cp.quantityKg || null,
      total_paid_now_usd: cp.totalPaidNowUsd || null
    }),
    toClient: (r: any): ClientPayment => ({
      id: r.id,
      clientId: r.client_id,
      clientName: r.client_name,
      amountUsd: parseFloat(r.amount_usd || 0),
      type: r.type,
      schedule: r.schedule || undefined,
      dateTime: r.date_time,
      paymentMethod: r.payment_method,
      reference: r.reference || undefined,
      isAdvance: r.is_advance,
      productBoughtName: r.product_bought_name || undefined,
      quantityKg: r.quantity_kg !== null ? parseFloat(r.quantity_kg) : undefined,
      totalPaidNowUsd: r.total_paid_now_usd !== null ? parseFloat(r.total_paid_now_usd) : undefined
    })
  },
  provider_payments: {
    toDB: (pp: ProviderPayment) => ({
      id: pp.id,
      provider_id: pp.providerId,
      provider_name: pp.providerName,
      product_name: pp.productName,
      amount_usd: pp.amountUsd || 0,
      date_time: pp.dateTime,
      notes: pp.notes || null,
      payment_method: pp.paymentMethod || null,
      reference: pp.reference || null
    }),
    toClient: (r: any): ProviderPayment => ({
      id: r.id,
      providerId: r.provider_id,
      providerName: r.provider_name,
      productName: r.product_name,
      amountUsd: parseFloat(r.amount_usd || 0),
      dateTime: r.date_time,
      notes: r.notes || undefined,
      paymentMethod: r.payment_method || undefined,
      reference: r.reference || undefined
    })
  }
};

// -----------------------------------------------------------------------------
// SYNC ACTIONS PROCESSOR
// -----------------------------------------------------------------------------
export async function processPendingSyncQueue(): Promise<boolean> {
  if (!isOnline() || !isSupabaseConfigured || !supabase) {
    return false;
  }

  const queue = getPendingQueue();
  if (queue.length === 0) return true;

  console.log(`Sincronizando ${queue.length} acciones pendientes con Supabase...`);
  const remaining: PendingAction[] = [];

  for (const item of queue) {
    try {
      if (item.action === 'upsert') {
        const dbRecord = converters[item.table]?.toDB(item.payload) || item.payload;
        const { error } = await supabase.from(item.table).upsert(dbRecord);
        if (error) throw error;
      } else if (item.action === 'delete') {
        const { error } = await supabase.from(item.table).delete().eq('id', item.payload.id);
        if (error) throw error;
      }
    } catch (e) {
      console.error(`Fallo al sincronizar acción en tabla ${item.table}:`, e);
      remaining.push(item); // Se guarda para el siguiente re-intento
    }
  }

  savePendingQueue(remaining);
  return remaining.length === 0;
}

// -----------------------------------------------------------------------------
// DUAL SYNC CONTROLLER (PULL & SEED PUSH)
// -----------------------------------------------------------------------------
interface FullAppState {
  clients: Client[];
  providers: Provider[];
  providerStocks: ProviderStock[];
  products: Product[];
  movements: InventoryMovement[];
  historicalOperations: HistoricalOperation[];
  mermas: Merma[];
  clientPayments: ClientPayment[];
  providerPayments: ProviderPayment[];
}

export async function syncWithSupabase(localState: FullAppState): Promise<FullAppState> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase no está configurado. Operando puramente en modo local (sin conexión).');
    return localState;
  }

  // 1. Procesar cualquier acción que se haya guardado offline antes de hacer el Pull
  if (isOnline()) {
    await processPendingSyncQueue();
  } else {
    console.warn('Dispositivo sin conexión a internet. Retornando base de datos interna local.');
    return localState;
  }

  const tables = [
    { key: 'clients', dbTable: 'clients' },
    { key: 'providers', dbTable: 'providers' },
    { key: 'products', dbTable: 'products' },
    { key: 'providerStocks', dbTable: 'provider_stocks' },
    { key: 'movements', dbTable: 'inventory_movements' },
    { key: 'historicalOperations', dbTable: 'historical_operations' },
    { key: 'mermas', dbTable: 'mermas' },
    { key: 'clientPayments', dbTable: 'client_payments' },
    { key: 'providerPayments', dbTable: 'provider_payments' }
  ];

  const updatedState = { ...localState };

  for (const table of tables) {
    try {
      // Intentar descargar de Supabase
      const { data, error } = await supabase.from(table.dbTable).select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        // Si Supabase contiene datos, cargamos y actualizamos la base de datos local
        const clientRecords = data.map(converters[table.dbTable].toClient);
        (updatedState as any)[table.key] = clientRecords;
        saveLocalData(`db_local_${table.key}`, clientRecords);
      } else {
        // Si Supabase está VACÍO, subimos el estado local actual como "semilla" inicial
        console.log(`Sembrando tabla "${table.dbTable}" en Supabase con datos locales...`);
        const localList = (localState as any)[table.key] || [];
        if (localList.length > 0) {
          const dbRecords = localList.map(converters[table.dbTable].toDB);
          const { error: seedError } = await supabase.from(table.dbTable).upsert(dbRecords);
          if (seedError) {
            console.error(`Error al sembrar datos de ${table.key} en Supabase:`, seedError);
          }
        }
      }
    } catch (e) {
      console.error(`Error de sincronización en la tabla "${table.dbTable}":`, e);
    }
  }

  return updatedState;
}
