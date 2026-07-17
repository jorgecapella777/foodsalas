import React, { useState } from 'react';
import { 
  CreditCard, 
  Package, 
  Calculator as CalcIcon,
  BarChart3, 
  Users, 
  Truck, 
  Coins,
  DollarSign,
  Phone,
  MessageSquare,
  AlertTriangle,
  Plus,
  ShoppingBag,
  Clock,
  Menu,
  X,
  TrendingUp,
  Info,
  BookOpen,
  HelpCircle,
  History,
  Calendar,
  Layers,
  ArrowUpRight,
  Sun,
  CloudSun,
  Moon,
  FileText
} from 'lucide-react';

import { Client, Product, Provider, InventoryMovement, ClientPayment, ProviderPayment, HistoricalOperation, Merma, ProviderStock } from './types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROVIDERS, 
  INITIAL_PRODUCTS, 
  INITIAL_MOVEMENTS,
  INITIAL_HISTORICAL_OPERATIONS,
  INITIAL_PROVIDER_STOCKS
} from './data';

// Importación de las vistas modulares vertical-first
import InicioView from './components/InicioView';
import PagosView from './components/PagosView';
import HistoricosView from './components/HistoricosView';
import InventoryView from './components/InventoryView';
import CalculadoraView from './components/CalculadoraView';
import TasasView from './components/TasasView';
import EstadisticasView from './components/EstadisticasView';
import ClientesView from './components/ClientesView';
import ProveedoresView from './components/ProveedoresView';
import AcercaDeView from './components/AcercaDeView';
import InstruccionesView from './components/InstruccionesView';
import FacturarView from './components/FacturarView';

// Importación de utilidades de sincronización y base de datos local / Supabase
import { 
  getLocalData, 
  saveLocalData, 
  queueSyncAction, 
  syncWithSupabase, 
  isOnline,
  getPendingQueue,
  processPendingSyncQueue
} from './utils/supabaseSync';
import { isSupabaseConfigured } from './utils/supabaseClient';

export default function App() {
  // Helper to format user editable date picker inputs
  const formatUserDate = (dateStr?: string) => {
    if (!dateStr) {
      return 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const day = parts[2];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[monthNum - 1] || '';
    const timeStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day} ${monthName} ${year}, ${timeStr}`;
  };

  // Tasas de cambio iniciales referenciales cargadas de forma persistente
  const [tasaBcvUsd, setTasaBcvUsd] = useState<number>(() => {
    const saved = localStorage.getItem('db_rate_usd');
    return saved ? parseFloat(saved) : 47.25;
  });
  const [tasaBcvEur, setTasaBcvEur] = useState<number>(() => {
    const saved = localStorage.getItem('db_rate_eur');
    return saved ? parseFloat(saved) : 51.10;
  });
  const [tasaUsdt, setTasaUsdt] = useState<number>(() => {
    const saved = localStorage.getItem('db_rate_usdt');
    return saved ? parseFloat(saved) : 48.50;
  });

  // Estados persistentes reactivos cargados desde la base de datos interna local (localStorage)
  const [clients, setClients] = useState<Client[]>(() => getLocalData<Client[]>('db_local_clients', INITIAL_CLIENTS));
  const [providers, setProviders] = useState<Provider[]>(() => getLocalData<Provider[]>('db_local_providers', INITIAL_PROVIDERS));
  const [providerStocks, setProviderStocks] = useState<ProviderStock[]>(() => getLocalData<ProviderStock[]>('db_local_providerStocks', INITIAL_PROVIDER_STOCKS));
  const [products, setProducts] = useState<Product[]>(() => getLocalData<Product[]>('db_local_products', INITIAL_PRODUCTS));
  const [movements, setMovements] = useState<InventoryMovement[]>(() => getLocalData<InventoryMovement[]>('db_local_movements', INITIAL_MOVEMENTS));
  const [historicalOperations, setHistoricalOperations] = useState<HistoricalOperation[]>(() => getLocalData<HistoricalOperation[]>('db_local_historicalOperations', INITIAL_HISTORICAL_OPERATIONS));
  
  // Estado persistente para Mermas físicas (Gemini Shrinkage requirement)
  const [mermas, setMermas] = useState<Merma[]>(() => getLocalData<Merma[]>('db_local_mermas', [
    {
      id: 'merma-init-1',
      productId: 'prod-1', // Pollo Entero
      productName: 'Pollo Entero',
      quantityKg: 4.5,
      reason: 'Evaporación',
      notes: 'Deshidratación normal por almacenamiento prolongado en cámara de refrigeración',
      dateTime: '18 Jun 2026, 11:30 AM',
      costPerKgUsd: 1.45,
      salePricePerKgUsd: 1.85
    },
    {
      id: 'merma-init-2',
      productId: 'prod-4', // Pechuga de Pollo
      productName: 'Pechuga de Pollo',
      quantityKg: 2.1,
      reason: 'Goteo',
      notes: 'Pérdida de agua libre / exudado durante el descongelado de control',
      dateTime: '17 Jun 2026, 03:45 PM',
      costPerKgUsd: 2.20,
      salePricePerKgUsd: 2.80
    }
  ]));
  
  // Históricos de Cobranzas y Pagos
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>(() => getLocalData<ClientPayment[]>('db_local_clientPayments', [
    {
      id: 'cp-init-1',
      clientId: 'client-1',
      clientName: 'Carlos Mendoza',
      amountUsd: 400.00,
      type: 'CRÉDITO',
      dateTime: '18 Jun 2026, 08:30 AM',
      paymentMethod: 'Pago Móvil',
      reference: 'Ref. 382910'
    },
    {
      id: 'cp-init-2',
      clientId: 'client-3',
      clientName: 'José Gregorio Salas',
      amountUsd: 500.00,
      type: 'CONTADO',
      dateTime: '17 Jun 2026, 02:15 PM',
      paymentMethod: 'Transferencia',
      reference: 'Ref. 4810292',
      isAdvance: true
    }
  ]));

  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>(() => getLocalData<ProviderPayment[]>('db_local_providerPayments', [
    {
      id: 'pp-init-1',
      providerId: 'prov-1',
      providerName: 'Avícola Del Centro S.A.',
      productName: 'Pollo Entero',
      amountUsd: 2500.00,
      dateTime: '18 Jun 2026, 09:15 AM',
      notes: 'Abono lote de pollo fresco'
    }
  ]));

  // Selección de Vista / Tab Activo
  const [activeTab, setActiveTab] = useState<'inicio' | 'pagos' | 'facturar' | 'historicos' | 'inventario' | 'calculadora' | 'tasas' | 'estadisticas' | 'clientes' | 'proveedores' | 'instrucciones' | 'acerca'>('inicio');

  // Estados para Modal de Bienvenida Emergente con Tasas del Día y Mensaje Motivacional
  const [showGreetingModal, setShowGreetingModal] = useState<boolean>(false);
  const [greetingTitle, setGreetingTitle] = useState<string>('¡Hola!');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');

  React.useEffect(() => {
    // 1. Cargar tasas en vivo al iniciar con robustez multi-nivel (Servidor -> Resguardo Servidor -> API Directa de Respaldo)
    const fetchFreshRates = async () => {
      let loaded = false;
      
      // Intento 1: API /api/bcv/rates del Servidor
      try {
        const res = await fetch('/api/bcv/rates');
        if (res.ok) {
          const data = await res.json();
          if (data && data.usd) {
            setTasaBcvUsd(parseFloat(String(data.usd)));
            if (data.eur) setTasaBcvEur(parseFloat(String(data.eur)));
            if (data.usdt) setTasaUsdt(parseFloat(String(data.usdt)));
            loaded = true;
            console.log("Tasas cargadas exitosamente al iniciar desde /api/bcv/rates");
          }
        }
      } catch (err) {
        console.warn('Backend /api/bcv/rates failed on startup, trying alias /api/rates:', err);
      }

      // Intento 2: API /api/rates de Resguardo del Servidor
      if (!loaded) {
        try {
          const res = await fetch('/api/rates');
          if (res.ok) {
            const data = await res.json();
            if (data && data.usd) {
              setTasaBcvUsd(parseFloat(String(data.usd)));
              if (data.eur) setTasaBcvEur(parseFloat(String(data.eur)));
              if (data.usdt) setTasaUsdt(parseFloat(String(data.usdt)));
              loaded = true;
              console.log("Tasas cargadas exitosamente al iniciar desde /api/rates");
            }
          }
        } catch (err) {
          console.warn('Backend /api/rates failed on startup too:', err);
        }
      }

      // Intento 3: Consulta Directa desde Frontend a API Pública si el backend no responde o se subió como web estática (p. ej. GitHub Pages)
      if (!loaded) {
        try {
          console.log("Intentando cargar tasas al iniciar directamente desde API pública de respaldo...");
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (res.ok) {
            const data = await res.json();
            if (data && data.rates && data.rates.VES) {
              const usdVal = parseFloat(String(data.rates.VES));
              setTasaBcvUsd(usdVal);
              const eurRatio = data.rates.EUR ? parseFloat(String(data.rates.EUR)) : 0.92;
              setTasaBcvEur(parseFloat((usdVal / eurRatio).toFixed(4)));
              setTasaUsdt(parseFloat((usdVal * 1.03).toFixed(4)));
              loaded = true;
              console.log("Tasas cargadas al iniciar directamente en frontend desde open.er-api.com:", usdVal);
            }
          }
        } catch (err) {
          console.error('Startup public exchange rate API fetch failed:', err);
        }
      }
    };
    fetchFreshRates();

    // 2. Determinar saludo por hora local
    const hr = new Date().getHours();
    let title = '¡Buenos días!';
    if (hr >= 12 && hr < 19) {
      title = '¡Buenas tardes!';
    } else if (hr >= 19 || hr < 5) {
      title = '¡Buenas noches!';
    }
    setGreetingTitle(title);

    // 3. Selección de mensaje motivacional avícola familiar
    const quotes = [
      "¡Que hoy sea un día de excelentes ventas, cobranzas fluidas y clientes felices en Food Salas! Éxito y prosperidad en cada entrega.",
      "¡Con esfuerzo familiar y balances exactos, sigamos ofreciendo el mejor servicio y calidad avícola a toda nuestra distinguida clientela!",
      "¡Trabajando con pasión y control exacto de tasas, aseguramos el crecimiento sostenido de nuestro inventario y la confianza de todos!",
      "¡Mantén tus registros al día y tus finanzas impecables. ¡Cada paso nos consolida como líderes de confianza en el mercado!"
    ];
    const selectedQuote = quotes[hr % quotes.length];
    setWelcomeMessage(selectedQuote);

    // 4. Mostrar solo en la primera carga en este navegador (protegido contra restricciones de sandbox en iframe)
    try {
      const alreadyShown = localStorage.getItem('food_salas_greeting_shown_v1');
      if (!alreadyShown) {
        setShowGreetingModal(true);
        localStorage.setItem('food_salas_greeting_shown_v1', 'true');
      }
    } catch (e) {
      console.warn('LocalStorage access blocked in iframe sandbox, showing modal by default:', e);
      // Fallback: mostrar modal de bienvenida siempre si está bloqueado por el sandbox
      setShowGreetingModal(true);
    }
  }, []);

  // --- SECCIÓN DE SINCRONIZACIÓN Y BASE DE DATOS SUPABASE ---
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingQueue().length);

  // Función principal para sincronizar de manera segura, bidireccional y robusta
  const handleSync = async () => {
    if (!isSupabaseConfigured) {
      alert("La base de datos central en la nube no está configurada aún en este navegador. Operando puramente en modo local (offline).");
      return;
    }
    if (!isOnline()) {
      alert("El dispositivo se encuentra sin conexión a internet (offline). Por favor conéctese para sincronizar con la base de datos en la nube.");
      return;
    }
    
    setIsSyncing(true);
    try {
      // 1. Primero procesar cola local de cambios hechos offline
      await processPendingSyncQueue();
      
      // 2. Ejecutar sincronización bidireccional de datos
      const syncedState = await syncWithSupabase({
        clients,
        providers,
        providerStocks,
        products,
        movements,
        historicalOperations,
        mermas,
        clientPayments,
        providerPayments
      });
      
      if (syncedState) {
        setClients(syncedState.clients);
        setProviders(syncedState.providers);
        setProviderStocks(syncedState.providerStocks);
        setProducts(syncedState.products);
        setMovements(syncedState.movements);
        setHistoricalOperations(syncedState.historicalOperations);
        setMermas(syncedState.mermas);
        setClientPayments(syncedState.clientPayments);
        setProviderPayments(syncedState.providerPayments);
      }
      setPendingSyncCount(getPendingQueue().length);
    } catch (error) {
      console.error("Error durante la sincronización con Supabase:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Guardado automático inmediato en la base de datos interna local (localStorage) al cambiar estados
  React.useEffect(() => {
    saveLocalData('db_local_clients', clients);
    setPendingSyncCount(getPendingQueue().length);
  }, [clients]);

  React.useEffect(() => {
    saveLocalData('db_local_providers', providers);
    setPendingSyncCount(getPendingQueue().length);
  }, [providers]);

  React.useEffect(() => {
    saveLocalData('db_local_providerStocks', providerStocks);
    setPendingSyncCount(getPendingQueue().length);
  }, [providerStocks]);

  React.useEffect(() => {
    saveLocalData('db_local_products', products);
    setPendingSyncCount(getPendingQueue().length);
  }, [products]);

  React.useEffect(() => {
    saveLocalData('db_local_movements', movements);
    setPendingSyncCount(getPendingQueue().length);
  }, [movements]);

  React.useEffect(() => {
    saveLocalData('db_local_historicalOperations', historicalOperations);
    setPendingSyncCount(getPendingQueue().length);
  }, [historicalOperations]);

  React.useEffect(() => {
    saveLocalData('db_local_mermas', mermas);
    setPendingSyncCount(getPendingQueue().length);
  }, [mermas]);

  React.useEffect(() => {
    saveLocalData('db_local_clientPayments', clientPayments);
    setPendingSyncCount(getPendingQueue().length);
  }, [clientPayments]);

  React.useEffect(() => {
    saveLocalData('db_local_providerPayments', providerPayments);
    setPendingSyncCount(getPendingQueue().length);
  }, [providerPayments]);

  React.useEffect(() => {
    localStorage.setItem('db_rate_usd', tasaBcvUsd.toString());
  }, [tasaBcvUsd]);

  React.useEffect(() => {
    localStorage.setItem('db_rate_eur', tasaBcvEur.toString());
  }, [tasaBcvEur]);

  React.useEffect(() => {
    localStorage.setItem('db_rate_usdt', tasaUsdt.toString());
  }, [tasaUsdt]);

  // Efecto para sincronización automática inicial y re-conexión de red
  React.useEffect(() => {
    if (isSupabaseConfigured && isOnline()) {
      handleSync();
    }

    const handleOnlineStatus = () => {
      console.log("Conexión a internet restablecida. Sincronizando cambios...");
      if (isSupabaseConfigured) {
        handleSync();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
    };
  }, []);

  // Control del Cajón / Sidebar Deslizante Izquierdo (Mobile-adapted Drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // 1. Agregar Cliente de Cartera con los 6 campos requeridos
  const handleAddClient = (
    name: string, 
    rif: string, 
    initialBalance: number,
    phone: string,
    address?: string,
    whatBought?: string,
    amountBoughtUsd?: number
  ) => {
    const statusVal = initialBalance > 0 ? 'Con Deuda' : initialBalance < 0 ? 'A favor' : 'Al día';
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name,
      rif,
      phone,
      address,
      whatBought,
      amountBoughtUsd,
      balanceUsd: initialBalance,
      status: statusVal,
      vencimientoInfo: initialBalance > 0 ? 'Crédito activo' : 'Solvente',
      ultimoPago: initialBalance !== 0 ? `Saldo asignado de $${Math.abs(initialBalance).toFixed(2)}` : 'Sin registros'
    };

    setClients(prev => [newClient, ...prev]);

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: 'CLIENT_PAYMENT',
      description: `Registro cliente: ${name}. Cel: ${phone}.` + (whatBought ? ` Compró: ${whatBought}` : ''),
      origin: 'Consola Clientes',
      destination: 'Cartera de Clientes',
      amountUsd: amountBoughtUsd || undefined
    };
    setHistoricalOperations(prev => [newOp, ...prev]);

    // Encolar acciones de sincronización con Supabase / Local
    queueSyncAction('clients', 'upsert', newClient);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 2. Cobros / Abonos recibidos de Clientes (Amortiza deuda de crédito)
  const handleRegisterClientCreditAbono = (
    clientId: string,
    amountUsd: number,
    method: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro',
    reference: string,
    isAdvance: boolean,
    customDate?: string,
    productBoughtName?: string
  ) => {
    let nameOfClient = 'Cliente';
    const finalDateFormatted = formatUserDate(customDate);

    // Actualizar balance de clientes
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        nameOfClient = c.name;
        const newBalance = c.balanceUsd - amountUsd;
        let newStatus: Client['status'] = 'Al día';
        if (newBalance > 0) newStatus = 'Con Deuda';
        else if (newBalance < 0) newStatus = 'A favor';

        const updated = {
          ...c,
          balanceUsd: parseFloat(newBalance.toFixed(2)),
          status: newStatus,
          ultimoPago: `${isAdvance ? 'Pago Adelantado' : 'Abono'} por $${amountUsd.toFixed(2)} USD` + (productBoughtName ? ` para ${productBoughtName}` : ''),
          metodoUltimoPago: method,
          referenciaUltimoPago: reference || undefined,
          vencimientoInfo: newBalance <= 0 ? 'Al día y solvente' : c.vencimientoInfo
        };
        
        // Encolar actualización del cliente
        queueSyncAction('clients', 'upsert', updated);
        return updated;
      }
      return c;
    }));

    // Añadir al histórico de cobranzas
    const targetCli = clients.find(c => c.id === clientId);
    const newPay: ClientPayment = {
      id: `cp-${Date.now()}`,
      clientId,
      clientName: targetCli ? targetCli.name : 'Cliente de Cartera',
      amountUsd,
      type: 'CRÉDITO',
      dateTime: finalDateFormatted,
      paymentMethod: method,
      reference,
      isAdvance,
      productBoughtName: productBoughtName
    };
    setClientPayments(prev => [newPay, ...prev]);
    queueSyncAction('client_payments', 'upsert', newPay);

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: finalDateFormatted,
      type: 'CLIENT_PAYMENT',
      description: `${isAdvance ? 'Pago anticipado' : 'Recibo abono'}: $${amountUsd} de ${nameOfClient}` + (productBoughtName ? ` para rubro ${productBoughtName}` : '') + `. Canal: ${method}`,
      origin: nameOfClient,
      destination: 'Caja Principal / Food Salas',
      amountUsd: amountUsd,
      reference: reference || 'N/A'
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 3. Agregar Proveedor
  const handleAddProvider = (
    name: string, 
    phone: string, 
    productsBought: string[], 
    initialOwed: number, 
    dueDate: string
  ) => {
    const newProv: Provider = {
      id: `prov-${Date.now()}`,
      name,
      phone,
      productsBought,
      totalOwedUsd: initialOwed,
      totalPaidUsd: 0,
      paymentDueDate: dueDate
    };
    setProviders(prev => [...prev, newProv]);
    queueSyncAction('providers', 'upsert', newProv);

    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: 'PURCHASE',
      description: `Registro nuevo distribuidor/proveedor: ${name}`,
      origin: 'Consola Proveedores',
      destination: 'Lista de Proveedores',
      amountUsd: initialOwed || undefined
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 4. Registrar Compra de Mercancía a Proveedor (Impacta stock de inventario, genera deuda o egreso inmediato)
  const handleRegisterPurchase = (
    providerId: string,
    productName: string,
    kg: number,
    totalCostUsd: number,
    applyPaymentNow: boolean,
    paymentMethod?: string,
    reference?: string,
    customDate?: string
  ) => {
    const pricePerKg = kg > 0 ? parseFloat((totalCostUsd / kg).toFixed(2)) : 0;
    let providerName = 'Proveedor';
    const finalDateFormatted = formatUserDate(customDate);

    const targetProduct = products.find(p => p.name.toLowerCase() === productName.toLowerCase().trim());
    const productId = targetProduct ? targetProduct.id : `prod-${Date.now()}`;

    // Actualizar o crear ProviderStock
    let matchedPS: ProviderStock | null = null;
    setProviderStocks(prev => {
      const match = prev.find(ps => ps.providerId === providerId && ps.productName.toLowerCase() === productName.toLowerCase().trim());
      let nextList: ProviderStock[] = [];
      if (match) {
        nextList = prev.map(ps => {
          if (ps.providerId === providerId && ps.productName.toLowerCase() === productName.toLowerCase().trim()) {
            const updated = { ...ps, availableKg: parseFloat((ps.availableKg + kg).toFixed(2)) };
            matchedPS = updated;
            return updated;
          }
          return ps;
        });
      } else {
        const prov = providers.find(p => p.id === providerId);
        const newPS = {
          id: `ps-${Date.now()}`,
          providerId,
          providerName: prov ? prov.name : 'Proveedor',
          productId,
          productName: productName.trim(),
          availableKg: kg
        };
        matchedPS = newPS;
        nextList = [...prev, newPS];
      }
      if (matchedPS) {
        queueSyncAction('provider_stocks', 'upsert', matchedPS);
      }
      return nextList;
    });

    // Actualizar o crear producto en el stock
    if (!targetProduct) {
      const newProduct: Product = {
        id: productId,
        name: productName.trim(),
        availableKg: kg,
        priceUsd: parseFloat((pricePerKg * 1.30).toFixed(2)), // Margen sugerido del 30%
        status: kg <= 20 ? 'STOCK CRÍTICO' : kg < 100 ? 'BAJO' : 'EN STOCK',
        imageUrl: '',
        costKgUsd: pricePerKg
      };
      setProducts(prev => [...prev, newProduct]);
      queueSyncAction('products', 'upsert', newProduct);
    } else {
      setProducts(prev => prev.map(p => {
        if (p.id === targetProduct.id) {
          const nextVolume = p.availableKg + kg;
          let newStatus: Product['status'] = 'EN STOCK';
          if (nextVolume <= 20) newStatus = 'STOCK CRÍTICO';
          else if (nextVolume < 100) newStatus = 'BAJO';
          else if (nextVolume < 300) newStatus = 'ESTABLE';

          const updated = {
            ...p,
            availableKg: parseFloat(nextVolume.toFixed(2)),
            status: newStatus,
            costKgUsd: pricePerKg // Guardar precio de compra más reciente
          };
          queueSyncAction('products', 'upsert', updated);
          return updated;
        }
        return p;
      }));
    }

    // Actualizar historial financiero y deudas del proveedor
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        providerName = p.name;
        const updated = {
          ...p,
          totalOwedUsd: parseFloat((p.totalOwedUsd + (applyPaymentNow ? 0 : totalCostUsd)).toFixed(2)),
          totalPaidUsd: parseFloat((p.totalPaidUsd + totalCostUsd).toFixed(2)),
          paymentDueDate: applyPaymentNow ? 'Solvente' : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] // 7 días plazo
        };
        queueSyncAction('providers', 'upsert', updated);
        return updated;
      }
      return p;
    }));

    // Agregar movimiento de inventario de entrada
    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      dateTime: finalDateFormatted,
      productName: productName,
      type: 'ENTRADA',
      quantityKg: kg,
      balanceAfterKg: parseFloat(((products.find(p => p.name === productName)?.availableKg || 0) + kg).toFixed(2)),
      providerName: providerName,
      pricePaidUsd: pricePerKg,
      tasaApplied: tasaBcvUsd
    };
    setMovements(prev => [newMov, ...prev]);
    queueSyncAction('inventory_movements', 'upsert', newMov);

    // Si se pagó de inmediato, agregar registro a providerPayments
    if (applyPaymentNow) {
      const newPay: ProviderPayment = {
        id: `pp-${Date.now()}`,
        providerId,
        providerName: providerName,
        productName,
        amountUsd: totalCostUsd,
        dateTime: finalDateFormatted,
        notes: `Compra de ${productName} de contado`,
        paymentMethod,
        reference
      };
      setProviderPayments(prev => [newPay, ...prev]);
      queueSyncAction('provider_payments', 'upsert', newPay);
    }

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: finalDateFormatted,
      type: 'PURCHASE',
      description: `Compra despachada: ${kg} Kg de ${productName} de ${providerName}. Tipo: ${applyPaymentNow ? 'Contado' : 'A Crédito'}` + (reference ? ` (Ref. ${reference})` : ''),
      origin: providerName,
      destination: `Inventario (Cámara)`,
      amountUsd: totalCostUsd,
      kg: kg,
      reference: reference || undefined
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 5. Pagar o Abonar Deuda al Proveedor
  const handlePayProvider = (
    providerId: string,
    amount: number,
    method: string = 'Efectivo',
    reference: string = '',
    customDate?: string,
    productName: string = 'Abono Deuda Genérico'
  ) => {
    let providerName = 'Proveedor';
    const finalDateFormatted = formatUserDate(customDate);

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        providerName = p.name;
        const remaining = Math.max(0, p.totalOwedUsd - amount);
        const updated = {
          ...p,
          totalOwedUsd: parseFloat(remaining.toFixed(2)),
          paymentDueDate: remaining === 0 ? 'Solvente' : p.paymentDueDate,
          lastPaymentMethod: method,
          lastPaymentReference: reference || undefined
        };
        queueSyncAction('providers', 'upsert', updated);
        return updated;
      }
      return p;
    }));

    const newPay: ProviderPayment = {
      id: `pp-${Date.now()}`,
      providerId,
      providerName: providerName,
      productName: productName,
      amountUsd: amount,
      dateTime: finalDateFormatted,
      notes: `Abono para rubro ${productName} en ${method}`,
      paymentMethod: method,
      reference: reference || undefined
    };
    setProviderPayments(prev => [newPay, ...prev]);
    queueSyncAction('provider_payments', 'upsert', newPay);

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: finalDateFormatted,
      type: 'PROVIDER_PAYMENT',
      description: `Abono realizado a ${providerName} para rubro ${productName}: $${amount.toFixed(2)} USD. Método: ${method}` + (reference ? ` (Ref. ${reference})` : ''),
      origin: 'Caja Principal / Food Salas',
      destination: providerName,
      amountUsd: amount,
      reference: reference || undefined
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 6. Registrar Venta / Cobro de Cliente (Contado o Crédito con cuotas)
  const handleRegisterClientSale = (
    clientId: string,
    productId: string,
    qtyKg: number,
    priceUsd: number,
    type: 'CONTADO' | 'CRÉDITO',
    paymentMethod: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro',
    reference: string,
    schedule: 'Semanal' | 'Quincenal' | 'Completo' | 'N/A',
    partialAmountPaid: number,
    providerId?: string,
    customDate?: string
  ) => {
    const totalSaleCost = qtyKg * priceUsd;
    const targetProduct = products.find(p => p.id === productId);
    const targetClient = clients.find(c => c.id === clientId);

    if (!targetProduct) return;

    const productName = targetProduct.name;
    const clientName = targetClient ? targetClient.name : 'Cliente';
    const finalDateFormatted = formatUserDate(customDate);

    // Descontar del stock por proveedor específico
    if (providerId) {
      setProviderStocks(prev => {
        return prev.map(ps => {
          if (ps.providerId === providerId && ps.productId === productId) {
            const nextVol = Math.max(0, ps.availableKg - qtyKg);
            const updated = { ...ps, availableKg: parseFloat(nextVol.toFixed(2)) };
            queueSyncAction('provider_stocks', 'upsert', updated);
            return updated;
          }
          return ps;
        });
      });
    }

    // Descontar automáticamente del stock del inventario
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextVolume = Math.max(0, p.availableKg - qtyKg);
        const updated = {
          ...p,
          availableKg: parseFloat(nextVolume.toFixed(2)),
          status: nextVolume <= 20 ? 'STOCK CRÍTICO' : nextVolume < 100 ? 'BAJO' : 'EN STOCK'
        };
        queueSyncAction('products', 'upsert', updated);
        return updated;
      }
      return p;
    }));

    // Añadir movimiento de inventario de tipo SALIDA
    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      dateTime: finalDateFormatted,
      productName: productName,
      type: 'SALIDA',
      quantityKg: qtyKg,
      balanceAfterKg: parseFloat((Math.max(0, targetProduct.availableKg - qtyKg)).toFixed(2))
    };
    setMovements(prev => [newMov, ...prev]);
    queueSyncAction('inventory_movements', 'upsert', newMov);

    // Actualizar deudas y balances de clientes
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        let addedDebt = 0;
        if (type === 'CRÉDITO') {
          addedDebt = totalSaleCost - partialAmountPaid;
        }

        const finalBalance = c.balanceUsd + addedDebt;
        let statusVal: Client['status'] = 'Al día';
        if (finalBalance > 0) statusVal = 'Con Deuda';
        else if (finalBalance < 0) statusVal = 'A favor';

        // Actualizar la lista de rubros comprados por el cliente
        const existingBought = c.whatBought 
          ? c.whatBought.split(/[,;]/).map(s => s.trim()).filter(Boolean) 
          : [];
        if (productName && !existingBought.includes(productName)) {
          existingBought.push(productName);
        }
        const updatedBought = existingBought.join(', ');

        const updated = {
          ...c,
          balanceUsd: parseFloat(finalBalance.toFixed(2)),
          status: statusVal,
          whatBought: updatedBought || c.whatBought,
          ultimoPago: type === 'CONTADO' 
            ? `Venta De Contado - $${totalSaleCost.toFixed(2)} USD`
            : `Fórmula Crédito - $${totalSaleCost.toFixed(2)} USD (Abono inicial $${partialAmountPaid.toFixed(2)})`,
          vencimientoInfo: type === 'CRÉDITO' ? `Cuota pautada: ${schedule}` : 'Solvente',
          metodoUltimoPago: paymentMethod,
          referenciaUltimoPago: reference || undefined
        };
        queueSyncAction('clients', 'upsert', updated);
        return updated;
      }
      return c;
    }));

    // Registrar el cobro/pago recibido
    const finalReceivedNow = type === 'CONTADO' ? totalSaleCost : partialAmountPaid;
    if (finalReceivedNow > 0) {
      const newPay: ClientPayment = {
        id: `cp-${Date.now()}`,
        clientId,
        clientName: clientName,
        amountUsd: finalReceivedNow,
        type,
        schedule: schedule,
        dateTime: finalDateFormatted,
        paymentMethod,
        reference
      };
      setClientPayments(prev => [newPay, ...prev]);
      queueSyncAction('client_payments', 'upsert', newPay);
    }

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: finalDateFormatted,
      type: 'CLIENT_PAYMENT',
      description: `Venta (${type}): ${qtyKg} Kg de ${productName} a ${clientName}. Costo total: $${totalSaleCost.toFixed(2)} USD` + (partialAmountPaid > 0 ? ` (Abonado inicial: $${partialAmountPaid})` : ''),
      origin: `Inventario (Cámara)`,
      destination: clientName,
      amountUsd: totalSaleCost,
      kg: qtyKg,
      reference: reference || undefined
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 7. Cobro / Abono indirecto registrado en PagosView para proveedores
  const handleRegisterProviderPayment = (
    providerId: string,
    paymentMethod: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro',
    reference: string,
    amountUsd: number,
    date: string,
    productName: string
  ) => {
    let providerName = 'Proveedor';

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        providerName = p.name;
        // Se amortiza la deuda existente del proveedor
        const remaining = Math.max(0, p.totalOwedUsd - amountUsd);
        const updated = {
          ...p,
          totalOwedUsd: parseFloat(remaining.toFixed(2)),
          totalPaidUsd: parseFloat((p.totalPaidUsd + amountUsd).toFixed(2)),
          paymentDueDate: remaining === 0 ? 'Solvente' : p.paymentDueDate,
          lastPaymentMethod: paymentMethod,
          lastPaymentReference: reference || undefined
        };
        queueSyncAction('providers', 'upsert', updated);
        return updated;
      }
      return p;
    }));

    const newPay: ProviderPayment = {
      id: `pp-${Date.now()}`,
      providerId,
      providerName: providerName,
      productName: productName || 'Abono Factura',
      amountUsd: amountUsd,
      dateTime: date || 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      notes: `Abono de deuda en ${paymentMethod} para rubro ${productName}`,
      paymentMethod,
      reference
    };
    setProviderPayments(prev => [newPay, ...prev]);
    queueSyncAction('provider_payments', 'upsert', newPay);

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: date || 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: 'PROVIDER_PAYMENT',
      description: `Abono realizado a ${providerName} para el rubro ${productName}: $${amountUsd.toFixed(2)} USD. Método: ${paymentMethod}`,
      origin: 'Caja Principal / Food Salas',
      destination: providerName,
      amountUsd: amountUsd,
      reference: reference || undefined
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 8. Recibir mercancía lote directo al inventario (Crea despacho con deuda a proveedor)
  const handleAddIncomingInventory = (
    prodName: string, 
    qtyKg: number, 
    providerId: string, 
    pricePaidUsd: number, 
    tasaApplied: number,
    customDate?: string
  ) => {
    handleRegisterPurchase(providerId, prodName, qtyKg, pricePaidUsd, false, undefined, undefined, customDate);
  };

  // 9. AJUSTE ENTRADA/SALIDA MANUAL CON MOTIVO (REQUISITO EXPLICITO)
  const handleManualInventoryAdjustment = (
    productId: string,
    qtyKg: number,
    type: 'ENTRADA' | 'SALIDA',
    motivo: string,
    providerId?: string,
    customDate?: string
  ) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const finalDateFormatted = formatUserDate(customDate);

    // Actualizar stock de proveedor
    if (providerId) {
      setProviderStocks(prev => {
        const match = prev.find(ps => ps.providerId === providerId && ps.productId === productId);
        let nextList: ProviderStock[] = [];
        if (match) {
          nextList = prev.map(ps => {
            if (ps.providerId === providerId && ps.productId === productId) {
              const nextVal = type === 'ENTRADA' 
                ? ps.availableKg + qtyKg 
                : Math.max(0, ps.availableKg - qtyKg);
              const updated = { ...ps, availableKg: parseFloat(nextVal.toFixed(2)) };
              queueSyncAction('provider_stocks', 'upsert', updated);
              return updated;
            }
            return ps;
          });
        } else if (type === 'ENTRADA') {
          const prov = providers.find(p => p.id === providerId);
          const newPS = {
            id: `ps-${Date.now()}`,
            providerId,
            providerName: prov ? prov.name : 'Proveedor',
            productId,
            productName: targetProduct.name,
            availableKg: qtyKg
          };
          nextList = [...prev, newPS];
          queueSyncAction('provider_stocks', 'upsert', newPS);
        } else {
          nextList = prev;
        }
        return nextList;
      });
    }

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextValue = type === 'ENTRADA' 
          ? p.availableKg + qtyKg 
          : Math.max(0, p.availableKg - qtyKg);
        
        const updated = {
          ...p,
          availableKg: parseFloat(nextValue.toFixed(2)),
          status: nextValue <= 20 ? 'STOCK CRÍTICO' : nextValue < 100 ? 'BAJO' : 'EN STOCK'
        };
        queueSyncAction('products', 'upsert', updated);
        return updated;
      }
      return p;
    }));

    // Añadir movimiento rápido para logs del inventario
    const calculatedAfter = type === 'ENTRADA' 
      ? targetProduct.availableKg + qtyKg 
      : Math.max(0, targetProduct.availableKg - qtyKg);

    const provName = providers.find(p => p.id === providerId)?.name;

    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      dateTime: finalDateFormatted,
      productName: targetProduct.name,
      type: type,
      quantityKg: qtyKg,
      balanceAfterKg: parseFloat(calculatedAfter.toFixed(2)),
      motivo: motivo + (provName ? ` (Proveedor: ${provName})` : '')
    };
    setMovements(prev => [newMov, ...prev]);
    queueSyncAction('inventory_movements', 'upsert', newMov);

    // Registrar en los históricos de operaciones auditable
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: finalDateFormatted,
      type: type === 'ENTRADA' ? 'INVENTORY_MANUAL_IN' : 'INVENTORY_MANUAL_OUT',
      description: `Ajuste manual (${type}): ${qtyKg} Kg de ${targetProduct.name}. Motivo: ${motivo}` + (provName ? ` [Proveedor: ${provName}]` : ''),
      origin: type === 'ENTRADA' ? 'Ajuste Especial' : 'Inventario General',
      destination: type === 'ENTRADA' ? 'Inventario General' : 'Merma / Desecho',
      kg: qtyKg
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  // 10. Actualizar precio neto base que se le vende al cliente (REQUISITO EXPLICITO)
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updated = {
          ...p,
          basePriceUsd: parseFloat(newPrice.toFixed(2))
        };
        queueSyncAction('products', 'upsert', updated);
        return updated;
      }
      return p;
    }));
  };

  // 11. Registrar Merma física y descontar de inventario con motivos (REQUISITO EXPLICITO)
  const handleRegisterMerma = (
    productId: string, 
    qtyKg: number, 
    reason: string, 
    notes?: string,
    providerId?: string,
    customDate?: string
  ) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const finalDateFormatted = formatUserDate(customDate);
    const provName = providers.find(p => p.id === providerId)?.name;

    // Cost of the lost inventory:
    const productCostPerKg = targetProduct.costPriceUsd || 1.5;
    const valueUsd = qtyKg * productCostPerKg;

    // Descontar de stock de proveedor
    if (providerId) {
      setProviderStocks(prev => {
        return prev.map(ps => {
          if (ps.providerId === providerId && ps.productId === productId) {
            const nextVol = Math.max(0, ps.availableKg - qtyKg);
            const updated = { ...ps, availableKg: parseFloat(nextVol.toFixed(2)) };
            queueSyncAction('provider_stocks', 'upsert', updated);
            return updated;
          }
          return ps;
        });
      });
    }

    // 1. Descontar del inventario físico
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextVolume = Math.max(0, p.availableKg - qtyKg);
        const updated = {
          ...p,
          availableKg: parseFloat(nextVolume.toFixed(2)),
          status: nextVolume <= 20 ? 'STOCK CRÍTICO' : nextVolume < 100 ? 'BAJO' : 'EN STOCK'
        };
        queueSyncAction('products', 'upsert', updated);
        return updated;
      }
      return p;
    }));

    // 2. Registrar en la cartera de mermas
    const newMerma: Merma = {
      id: `merma-${Date.now()}`,
      productId,
      productName: targetProduct.name,
      quantityKg: qtyKg,
      reason,
      notes: (notes || 'Sin notas adicionales') + (provName ? ` (Proveedor: ${provName})` : ''),
      dateTime: finalDateFormatted,
      costPerKgUsd: productCostPerKg,
      salePricePerKgUsd: targetProduct.priceUsd
    };
    setMermas(prev => [newMerma, ...prev]);
    queueSyncAction('mermas', 'upsert', newMerma);

    // 3. Añadir a los movimientos rápidos de almacén
    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      dateTime: finalDateFormatted,
      productName: targetProduct.name,
      type: 'SALIDA',
      quantityKg: qtyKg,
      balanceAfterKg: parseFloat(Math.max(0, targetProduct.availableKg - qtyKg).toFixed(2)),
      motivo: `MERMA: ${reason}` + (notes ? ` (${notes})` : '') + (provName ? ` [Proveedor: ${provName}]` : '')
    };
    setMovements(prev => [newMov, ...prev]);
    queueSyncAction('inventory_movements', 'upsert', newMov);

    // 4. Agregar a operaciones históricas generales
    const newOp: HistoricalOperation = {
      id: Date.now().toString(),
      dateTime: finalDateFormatted,
      type: 'MERMA',
      description: `Merma registrada (${reason}): ${qtyKg} Kg de ${targetProduct.name}.` + (notes ? ` Notas: ${notes}` : '') + (provName ? ` (Proveedor: ${provName})` : ''),
      origin: 'Inventario General',
      destination: 'Merma / Pérdidas',
      amountUsd: valueUsd,
      kg: qtyKg
    };
    setHistoricalOperations(prev => [newOp, ...prev]);
    queueSyncAction('historical_operations', 'upsert', newOp);
  };

  const handleImportDatabase = (importedData: any) => {
    if (!importedData) return;
    try {
      if (Array.isArray(importedData.clients)) setClients(importedData.clients);
      if (Array.isArray(importedData.providers)) setProviders(importedData.providers);
      if (Array.isArray(importedData.providerStocks)) setProviderStocks(importedData.providerStocks);
      if (Array.isArray(importedData.products)) setProducts(importedData.products);
      if (Array.isArray(importedData.movements)) setMovements(importedData.movements);
      if (Array.isArray(importedData.historicalOperations)) setHistoricalOperations(importedData.historicalOperations);
      if (Array.isArray(importedData.mermas)) setMermas(importedData.mermas);
      if (Array.isArray(importedData.clientPayments)) setClientPayments(importedData.clientPayments);
      if (Array.isArray(importedData.providerPayments)) setProviderPayments(importedData.providerPayments);
      
      // Sincronizar de inmediato con la nube si está configurado
      if (isSupabaseConfigured) {
        if (Array.isArray(importedData.clients)) importedData.clients.forEach((x: any) => queueSyncAction('clients', 'upsert', x));
        if (Array.isArray(importedData.providers)) importedData.providers.forEach((x: any) => queueSyncAction('providers', 'upsert', x));
        if (Array.isArray(importedData.providerStocks)) importedData.providerStocks.forEach((x: any) => queueSyncAction('provider_stocks', 'upsert', x));
        if (Array.isArray(importedData.products)) importedData.products.forEach((x: any) => queueSyncAction('products', 'upsert', x));
        if (Array.isArray(importedData.movements)) importedData.movements.forEach((x: any) => queueSyncAction('inventory_movements', 'upsert', x));
        if (Array.isArray(importedData.historicalOperations)) importedData.historicalOperations.forEach((x: any) => queueSyncAction('historical_operations', 'upsert', x));
        if (Array.isArray(importedData.mermas)) importedData.mermas.forEach((x: any) => queueSyncAction('mermas', 'upsert', x));
        if (Array.isArray(importedData.clientPayments)) importedData.clientPayments.forEach((x: any) => queueSyncAction('client_payments', 'upsert', x));
        if (Array.isArray(importedData.providerPayments)) importedData.providerPayments.forEach((x: any) => queueSyncAction('provider_payments', 'upsert', x));
      }
    } catch (e) {
      console.error("Fallo al importar base de datos:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-150 flex flex-col font-sans select-none animate-fade-in" id="app-canvas">
      
      {/* Centered fluid layout container */}
      <div className="w-full max-w-xl mx-auto bg-slate-100 min-h-screen flex flex-col relative shadow-xl border-x border-slate-200">

        {/* Cabecera Corporativa con botón de Hamburguesa para Sidebar Izquierdo */}
        <header className="bg-indigo-950 text-white px-4 py-3.5 shadow-md flex justify-between items-center relative z-20 shrink-0" id="main-corporate-header">
          <div className="flex items-center gap-3">
            {/* Hamburger button trigger */}
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="bg-white/10 hover:bg-white/15 p-2 rounded-xl transition-all text-white shrink-0 cursor-pointer active:scale-95"
              title="Abrir Menú de Opciones"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-4.5 h-4.5 text-blue-300" />
                <h1 className="font-extrabold text-[13px] md:text-[13.5px] leading-none tracking-tight">Inversiones Food Salas F.P.</h1>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 px-2.5 py-1.5 rounded-xl text-center border border-white/10 shrink-0 select-none">
            <span className="text-[8px] text-indigo-250 font-black uppercase tracking-wider block">USD BCV</span>
            <span className="font-black text-[11px] font-sans">Bs.{tasaBcvUsd.toFixed(2)}</span>
          </div>
        </header>

        {/* CARTERA SIDEBAR DE OPCIONES DESLIZANTE IZQUIERDO (REQUISITO EXPLICITO) */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-50 flex" id="sidebar-drawer-overlay">
            {/* Backdrop black overlay */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-3xs"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar content container */}
            <div className="absolute left-0 top-0 bottom-0 w-[270px] bg-slate-900 text-white flex flex-col justify-between py-6 px-4 shadow-2xl animate-slide-right animate-duration-200">
              
              <div className="space-y-6">
                {/* Sidebar Header Title */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h2 className="font-extrabold text-xs uppercase tracking-wider leading-none">Menú Comercial</h2>
                      <span className="text-[8px] text-slate-400 font-bold block mt-0.5 uppercase">Inversiones Food Salas</span>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Vertical Scroll Option Links */}
                <div className="space-y-1.5 max-h-[550px] overflow-y-auto no-scrollbar" id="sidebar-vertical-modules-list">
                  {[
                    { id: 'inicio', label: 'HOME', icon: Layers },
                    { id: 'pagos', label: '💳 Cobros / Pagos', icon: CreditCard },
                    { id: 'facturar', label: '📄 Facturar', icon: FileText },
                    { id: 'historicos', label: '📋 Históricos Operaciones', icon: History },
                    { id: 'inventario', label: '📦 Inventario Mercancía', icon: Package },
                    { id: 'calculadora', label: '🧮 Calculadora Mayor/Detal', icon: CalcIcon },
                    { id: 'tasas', label: '📈 Verificación Tasas', icon: Coins },
                    { id: 'estadisticas', label: '📊 ANÁLISIS FINANCIERO', icon: BarChart3 },
                    { id: 'clientes', label: '👥 Cartera de Clientes', icon: Users },
                    { id: 'proveedores', label: '🚚 LISTA DE PROVEEDORES', icon: Truck },
                    { id: 'instrucciones', label: '📖 INSTRUCCIONES', icon: BookOpen },
                    { id: 'acerca', label: 'ℹ️ SOBRE NOSOTROS', icon: Info },
                  ].map((item) => {
                    const isSelected = activeTab === item.id;
                    const IconComp = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left text-xs font-black uppercase tracking-wide transition-all ${
                          isSelected 
                            ? 'bg-indigo-650 text-white shadow-sm' 
                            : 'hover:bg-slate-800 text-slate-350 hover:text-white'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-450'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Powered by widget at the bottom */}
              <div className="pt-4 border-t border-slate-800 text-center font-sans">
                <span className="text-[7.5px] text-slate-500 uppercase tracking-widest block font-medium">POWERED BY</span>
                <span className="text-[8px] font-black text-indigo-400 block mt-1 uppercase">CAPELLA TEC</span>
              </div>

            </div>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL VIEWS CON SCROLL VERTICAL */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50" id="mobile-canvas-scrollable">
          
          {activeTab === 'inicio' && (
            <InicioView 
              clients={clients}
              providers={providers}
              products={products}
              historicalOperations={historicalOperations}
              tasaBcvUsd={tasaBcvUsd}
              setActiveTab={setActiveTab}
              isSyncing={isSyncing}
              onSync={handleSync}
              pendingSyncCount={pendingSyncCount}
              isSupabaseConfigured={isSupabaseConfigured}
              isOnline={isOnline()}
            />
          )}

          {activeTab === 'pagos' && (
            <PagosView 
              clients={clients}
              providers={providers}
              products={products}
              providerStocks={providerStocks}
              clientPayments={clientPayments}
              providerPayments={providerPayments}
              tasaBcvUsd={tasaBcvUsd}
              onRegisterClientSale={handleRegisterClientSale}
              onRegisterProviderPayment={handleRegisterProviderPayment}
            />
          )}

          {activeTab === 'facturar' && (
            <FacturarView 
              clients={clients}
              historicalOperations={historicalOperations}
              tasaBcvUsd={tasaBcvUsd}
            />
          )}

          {activeTab === 'historicos' && (
            <HistoricosView 
              operations={historicalOperations}
              tasaBcvUsd={tasaBcvUsd}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryView 
              products={products}
              providerStocks={providerStocks}
              movements={movements}
              providers={providers}
              tasaBcvUsd={tasaBcvUsd}
              onAddIncomingInventory={handleAddIncomingInventory}
              onManualInventoryAdjustment={handleManualInventoryAdjustment}
              onUpdateProductPrice={handleUpdateProductPrice}
              onRegisterMerma={handleRegisterMerma}
            />
          )}

          {activeTab === 'calculadora' && (
            <CalculadoraView 
              tasaBcvUsd={tasaBcvUsd}
            />
          )}

          {activeTab === 'tasas' && (
            <TasasView 
              tasaBcvUsd={tasaBcvUsd}
              setTasaBcvUsd={setTasaBcvUsd}
              tasaBcvEur={tasaBcvEur}
              setTasaBcvEur={setTasaBcvEur}
              tasaUsdt={tasaUsdt}
              setTasaUsdt={setTasaUsdt}
            />
          )}

          {activeTab === 'estadisticas' && (
            <EstadisticasView 
              tasaBcvUsd={tasaBcvUsd}
              mermas={mermas}
              products={products}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientesView 
              clients={clients}
              tasaBcvUsd={tasaBcvUsd}
              onAddClient={handleAddClient}
              onRegisterClientCreditAbono={handleRegisterClientCreditAbono}
              historicalOperations={historicalOperations}
              clientPayments={clientPayments}
              products={products}
            />
          )}

          {activeTab === 'proveedores' && (
            <ProveedoresView 
              providers={providers}
              products={products}
              tasaBcvUsd={tasaBcvUsd}
              onAddProvider={handleAddProvider}
              onRegisterPurchase={handleRegisterPurchase}
              onPayProvider={handlePayProvider}
              historicalOperations={historicalOperations}
              providerPayments={providerPayments}
            />
          )}

          {activeTab === 'instrucciones' && (
            <InstruccionesView />
          )}

          {activeTab === 'acerca' && (
            <AcercaDeView 
              clients={clients}
              providers={providers}
              providerStocks={providerStocks}
              products={products}
              movements={movements}
              historicalOperations={historicalOperations}
              mermas={mermas}
              clientPayments={clientPayments}
              providerPayments={providerPayments}
              isSyncing={isSyncing}
              onSync={handleSync}
              pendingSyncCount={pendingSyncCount}
              isSupabaseConfigured={isSupabaseConfigured}
              isOnline={isOnline()}
              onImportDatabase={handleImportDatabase}
            />
          )}

        </div>

        {/* MODAL EMERGENTE DE BIENVENIDA CON MENSAJE MOTIVACIONAL Y TASAS EN TIEMPO REAL */}
        {showGreetingModal && (
          <div className="absolute inset-0 bg-indigo-950/85 backdrop-blur-xs z-100 flex items-center justify-center p-5 select-none" id="welcome-greeting-overlay">
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/80 p-6 space-y-5 flex flex-col justify-between" id="welcome-greeting-dialog">
              
              {/* Header Icon and Title based on Time of Day */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-bounce animate-duration-1000">
                  {greetingTitle.includes('Buenos') ? (
                    <div className="p-4 bg-amber-50 text-amber-500 rounded-full border border-amber-200">
                      <Sun className="w-8 h-8 stroke-[2.5]" />
                    </div>
                  ) : greetingTitle.includes('Buenas tardes') ? (
                    <div className="p-4 bg-orange-50 text-orange-500 rounded-full border border-orange-200">
                      <CloudSun className="w-8 h-8 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full border border-indigo-200">
                      <Moon className="w-8 h-8 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-1.5">
                  <h3 className="text-xl font-extrabold text-slate-800 leading-none">{greetingTitle}</h3>
                  <span className="text-[10px] text-indigo-650 uppercase font-bold tracking-widest">Bienvenido a Food Salas</span>
                </div>
              </div>

              {/* Motivational message card */}
              <div className="bg-linear-to-b from-indigo-50/50 to-slate-50/50 border border-slate-100 p-4 rounded-2xl text-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Pensamiento del Día</span>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                  "{welcomeMessage}"
                </p>
              </div>

              {/* Real-time rates of the day */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1.5">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Tasas Oficiales del Día</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase">Sincronizado</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-700 bg-slate-200 w-6 h-6 flex items-center justify-center rounded-lg">$</span>
                      <span className="text-xs font-black text-slate-600">Dólar Oficial (BCV)</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">Bs. {tasaBcvUsd.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-700 bg-slate-200 w-6 h-6 flex items-center justify-center rounded-lg">€</span>
                      <span className="text-xs font-black text-slate-600">Euro Oficial (BCV)</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">Bs. {tasaBcvEur.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 w-6 h-6 flex items-center justify-center rounded-lg uppercase">T</span>
                      <span className="text-xs font-black text-slate-600">USDT Referencial</span>
                    </div>
                    <span className="text-sm font-black text-emerald-700">Bs. {tasaUsdt.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowGreetingModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer text-center"
              >
                Entrar a la Consola
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
