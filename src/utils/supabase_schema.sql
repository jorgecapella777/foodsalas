-- INVERSIONES FOOD SALAS F.P. - SCRIPT DE BASE DE DATOS DE SUPABASE (POSTGRESQL)
-- Copie y pegue este script en el editor SQL de su proyecto Supabase para crear las tablas necesarias.

-- 1. Tabla de Clientes (clients)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cedula TEXT,
  rif TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  what_bought TEXT,
  amount_bought_usd NUMERIC(12, 2) DEFAULT 0.00,
  balance_usd NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT NOT NULL,
  vencimiento_info TEXT,
  ultimo_pago TEXT,
  metodo_ultimo_pago TEXT,
  referencia_ultimo_pago TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Proveedores (providers)
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  products_bought TEXT[] DEFAULT '{}'::TEXT[],
  total_owed_usd NUMERIC(12, 2) DEFAULT 0.00,
  total_paid_usd NUMERIC(12, 2) DEFAULT 0.00,
  payment_due_date TEXT NOT NULL,
  last_payment_method TEXT,
  last_payment_reference TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Productos (products)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  available_kg NUMERIC(12, 2) DEFAULT 0.00,
  price_usd NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT NOT NULL,
  image_url TEXT,
  cost_kg_usd NUMERIC(12, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Stock de Proveedores (provider_stocks)
CREATE TABLE IF NOT EXISTS provider_stocks (
  id TEXT PRIMARY KEY,
  provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  available_kg NUMERIC(12, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Movimientos de Inventario (inventory_movements)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  date_time TEXT NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity_kg NUMERIC(12, 2) DEFAULT 0.00,
  balance_after_kg NUMERIC(12, 2) DEFAULT 0.00,
  provider_id TEXT,
  provider_name TEXT,
  price_paid_usd NUMERIC(12, 2),
  tasa_applied NUMERIC(12, 2),
  motivo TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Operaciones Históricas (historical_operations)
CREATE TABLE IF NOT EXISTS historical_operations (
  id TEXT PRIMARY KEY,
  date_time TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  amount_usd NUMERIC(12, 2),
  kg NUMERIC(12, 2),
  reference TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla de Mermas (mermas)
CREATE TABLE IF NOT EXISTS mermas (
  id TEXT PRIMARY KEY,
  date_time TEXT NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity_kg NUMERIC(12, 2) DEFAULT 0.00,
  cost_per_kg_usd NUMERIC(12, 2) DEFAULT 0.00,
  sale_price_per_kg_usd NUMERIC(12, 2) DEFAULT 0.00,
  reason TEXT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabla de Pagos de Clientes (client_payments)
CREATE TABLE IF NOT EXISTS client_payments (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  amount_usd NUMERIC(12, 2) DEFAULT 0.00,
  type TEXT NOT NULL,
  schedule TEXT,
  date_time TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  is_advance BOOLEAN DEFAULT false,
  product_bought_name TEXT,
  quantity_kg NUMERIC(12, 2),
  total_paid_now_usd NUMERIC(12, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabla de Pagos a Proveedores (provider_payments)
CREATE TABLE IF NOT EXISTS provider_payments (
  id TEXT PRIMARY KEY,
  provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount_usd NUMERIC(12, 2) DEFAULT 0.00,
  date_time TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT,
  reference TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DESHABILITAR SEGURIDAD DE FILAS (RLS) PARA LOGRAR UNA SINCRO DIRECTA CLIENTE-SERVIDOR INICIAL
-- (Usted puede activar RLS después y configurar políticas si lo prefiere)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE historical_operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE mermas DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_payments DISABLE ROW LEVEL SECURITY;

-- MIGRACIÓN / ACTUALIZACIÓN: Ejecute esto si ya tiene las tablas creadas para agregar los nuevos campos
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_kg_usd NUMERIC(12, 2) DEFAULT 0.00;

-- 10. Tabla de Configuración de la App (para PIN de seguridad, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Insertar PIN de seguridad por defecto si no existe
INSERT INTO app_settings (key, value) 
VALUES ('security_pin', '151224')
ON CONFLICT (key) DO NOTHING;

