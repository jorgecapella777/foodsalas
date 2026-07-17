import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  TrendingUp as GainIcon, 
  ArrowUpRight, 
  AlertCircle,
  HelpCircle,
  DollarSign,
  Database,
  RefreshCw
} from 'lucide-react';
import { Client, Provider, Product, HistoricalOperation } from '../types';

interface InicioViewProps {
  clients: Client[];
  providers: Provider[];
  products: Product[];
  historicalOperations: HistoricalOperation[];
  tasaBcvUsd: number;
  setActiveTab: (tab: any) => void;
  isSyncing: boolean;
  onSync: () => void;
  pendingSyncCount: number;
  isSupabaseConfigured: boolean;
  isOnline: boolean;
}

export default function InicioView({ 
  clients, 
  providers, 
  products, 
  historicalOperations, 
  tasaBcvUsd,
  setActiveTab,
  isSyncing,
  onSync,
  pendingSyncCount,
  isSupabaseConfigured,
  isOnline
}: InicioViewProps) {
  
  // Calculate handy business metrics
  const totalClientsDebt = clients.reduce((acc, c) => c.balanceUsd > 0 ? acc + c.balanceUsd : acc, 0);
  const totalProvidersDebt = providers.reduce((acc, p) => acc + p.totalOwedUsd, 0);
  
  const totalStockKg = products.reduce((acc, p) => acc + p.availableKg, 0);
  const criticalProducts = products.filter(p => p.availableKg <= 20);

  const recentOps = historicalOperations.slice(0, 3);

  return (
    <div className="space-y-6 fade-in" id="inicio-view-root">
      
      {/* Dynamic Cover Section */}
      <div className="bg-linear-to-r from-primary to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden" id="inicio-hero-banner">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
          <Package className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-3">
          <h2 className="font-extrabold text-2xl tracking-tight leading-none">Inversiones Food Salas F.P.</h2>
          <p className="text-blue-105 text-sm max-w-sm font-medium leading-relaxed">
            Plataforma comercial unificada de administración, cobranzas de clientes, compras de proveedores y monitoreo de tasas.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-300 font-extrabold">
            <TrendingUp className="w-4 h-4" />
            <span>Tasa BCV de Referencia: Bs. {tasaBcvUsd.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" id="inicio-metrics-bento">
        
        {/* Cartera de Clientes */}
        <div 
          onClick={() => setActiveTab('clientes')}
          className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="mt-3 overflow-hidden">
            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider block truncate">Por Cobrar Clientes</span>
            <span className="text-sm xs:text-base sm:text-[17px] md:text-lg font-black text-slate-800 leading-tight mt-0.5 block truncate" title={`$${totalClientsDebt.toFixed(2)}`}>
              ${totalClientsDebt.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[8.5px] text-slate-500 font-medium block truncate">
              Bs. {(totalClientsDebt * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Cuentas por Pagar Proveedores */}
        <div 
          onClick={() => setActiveTab('proveedores')}
          className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <GainIcon className="w-4 h-4 sm:w-5 h-5 rotate-180" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="mt-3 overflow-hidden">
            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider block truncate">Por Pagar Proveedores</span>
            <span className="text-sm xs:text-base sm:text-[17px] md:text-lg font-black text-rose-700 leading-tight mt-0.5 block truncate" title={`$${totalProvidersDebt.toFixed(2)}`}>
              ${totalProvidersDebt.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[8.5px] text-slate-500 font-medium block truncate">
              Bs. {(totalProvidersDebt * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Stock Total */}
        <div 
          onClick={() => setActiveTab('inventario')}
          className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="mt-3 overflow-hidden">
            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider block truncate">Stock Total</span>
            <span className="text-sm xs:text-base sm:text-[17px] md:text-lg font-black text-slate-800 leading-tight mt-0.5 block truncate">
              {totalStockKg.toLocaleString('es-VE')} KG
            </span>
            <span className={`text-[8.5px] font-bold block truncate ${criticalProducts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {criticalProducts.length > 0 ? `${criticalProducts.length} rubros críticos` : 'Nivel de stock estable'}
            </span>
          </div>
        </div>

        {/* Detalle de Operaciones */}
        <div 
          onClick={() => setActiveTab('historicos')}
          className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="mt-3 overflow-hidden">
            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider block truncate">Operaciones Realizadas</span>
            <span className="text-sm xs:text-base sm:text-[17px] md:text-lg font-black text-slate-800 leading-tight mt-0.5 block truncate">
              {historicalOperations.length}
            </span>
            <span className="text-[8.5px] text-slate-500 font-medium block truncate">
              Ver histórico completo
            </span>
          </div>
        </div>

      </div>

      {/* Alertas Rápidas y Stock Crítico */}
      {criticalProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex gap-3 text-amber-900" id="inicio-alert-box">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider">¡Alerta de Reposición Urgente!</h4>
            <p className="text-xs leading-relaxed text-amber-800">
              Los siguientes rubros avícolas han traspasado el límite mínimo de 20 Kilos en stock:
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {criticalProducts.map(p => (
                <span key={p.id} className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase">
                  {p.name}: {p.availableKg} KG disponible
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Secciones de Accesos Directos Operacionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-shortcuts-recents">
        
        {/* Accesos Directos */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Gestión de Operaciones Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('pagos')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all active:scale-98"
            >
              <span className="text-xs font-black text-primary block">💳 REGISTRAR COBRO</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">Ventas a clientes de contado o crédito.</span>
            </button>
            <button
              onClick={() => setActiveTab('historicos')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all active:scale-98"
            >
              <span className="text-xs font-black text-slate-700 block">📋 HISTORIAL GENERAL</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">Ver todas las entradas/salidas con detalle.</span>
            </button>
            <button
              onClick={() => setActiveTab('tasas')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all active:scale-98"
            >
              <span className="text-xs font-black text-indigo-700 block">📈 VERIFICAR TASAS</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">Sincronización automática Banco Central.</span>
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all active:scale-98"
            >
              <span className="text-xs font-black text-emerald-700 block">📊 ESTADÍSTICAS</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">Sumas de ganancias y descarga de PDF.</span>
            </button>
          </div>
        </div>

        {/* Últimas Operaciones */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
              Últimas Actividades
            </h3>
            <button 
              onClick={() => setActiveTab('historicos')}
              className="text-[10px] font-extrabold text-primary uppercase tracking-wider"
            >
              Ver Todas
            </button>
          </div>

          <div className="space-y-3">
            {recentOps.map((op) => {
              const opColor = op.type === 'CLIENT_PAYMENT' || op.type === 'INVENTORY_MANUAL_IN'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-rose-50 text-rose-650 border-rose-100';

              return (
                <div key={op.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                  <div className="space-y-0.5 max-w-[210px]">
                    <span className="font-extrabold text-slate-800 block leading-tight">{op.description}</span>
                    <span className="text-[9px] text-slate-450 block font-bold">{op.dateTime}</span>
                  </div>
                  <div className="text-right">
                    {op.amountUsd && (
                      <span className="font-black text-slate-700 block">
                        ${op.amountUsd.toFixed(2)}
                      </span>
                    )}
                    {op.kg && (
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm block mt-0.5">
                        {op.kg} KG
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {recentOps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No hay registros operacionales aún</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
