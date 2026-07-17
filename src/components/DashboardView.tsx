import React, { useState } from 'react';
import { 
  Coins, 
  RotateCw, 
  TrendingUp, 
  CreditCard, 
  Package, 
  Users, 
  Truck, 
  AlertTriangle 
} from 'lucide-react';
import { Client, Product } from '../types';

interface DashboardViewProps {
  tasaBcv: number;
  setTasaBcv: (tasa: number) => void;
  clients: Client[];
  products: Product[];
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'clients' | 'analysis') => void;
  openPaymentModal: (clientName: string) => void;
  openQuickOpModal: () => void;
}

export default function DashboardView({
  tasaBcv,
  setTasaBcv,
  clients,
  products,
  setActiveTab,
  openPaymentModal,
  openQuickOpModal,
}: DashboardViewProps) {
  const [isEditingTasa, setIsEditingTasa] = useState(false);
  const [tempTasa, setTempTasa] = useState(tasaBcv.toString());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ day: string; val: number; target: number } | null>(null);

  // Calcs
  const clientCount = clients.length;
  const activeClients = clients.filter(c => c.balanceUsd > 0).length;
  
  // Total pending (outstanding) sum in USD
  const totalCobrarUsd = clients.reduce((sum, c) => sum + c.balanceUsd, 0);
  const totalCobrarVes = totalCobrarUsd * tasaBcv;

  // Products state count
  const criticalProductsCount = products.filter(p => p.status === 'STOCK CRÍTICO' || p.availableKg <= 15).length;

  const handleSaveTasa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempTasa);
    if (!isNaN(val) && val > 0) {
      setTasaBcv(val);
      setIsEditingTasa(false);
    }
  };

  const chartData = [
    { day: 'LUN', val: 3200, target: 5000 },
    { day: 'MAR', val: 4500, target: 5000 },
    { day: 'MIE', val: 3900, target: 5000 },
    { day: 'JUE', val: 6200, target: 5000 },
    { day: 'VIE', val: 4800, target: 5000 },
    { day: 'SAB', val: 2500, target: 5000 },
  ];

  return (
    <div className="space-y-6 fade-in" id="dashboard-view-wrapper">
      {/* BCV Tasa Prominente */}
      <section className="bg-primary text-white p-5 rounded-xl shadow-sm transition-all relative overflow-hidden" id="bcv-widget">
        <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-blue-900/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-secondary-container text-on-secondary-container p-3 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-on-secondary-container" />
            </div>
            <div>
              <h2 className="text-blue-200 text-xs font-bold uppercase tracking-wider">Tasa Oficial BCV</h2>
              <div className="flex items-baseline gap-2">
                {isEditingTasa ? (
                  <form onSubmit={handleSaveTasa} className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      step="0.01"
                      className="bg-primary/50 text-white font-bold text-3xl max-w-[120px] rounded border border-blue-400 px-2 py-0.5 outline-none focus:ring-2 focus:ring-secondary"
                      value={tempTasa}
                      onChange={(e) => setTempTasa(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="bg-secondary text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-secondary/90 transition-colors uppercase">
                      Ok
                    </button>
                    <button type="button" onClick={() => setIsEditingTasa(false)} className="text-xs text-slate-300 hover:underline px-1">
                      X
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-white font-extrabold text-3xl tracking-tight">
                      {tasaBcv.toFixed(2)}
                    </span>
                    <span className="text-blue-200 text-sm font-semibold">VES / USD</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!isEditingTasa && (
            <button 
              onClick={() => {
                setTempTasa(tasaBcv.toString());
                setIsEditingTasa(true);
              }}
              className="flex items-center gap-2 bg-white text-primary hover:bg-slate-100 transition-colors px-5 py-2.5 rounded-full text-xs font-bold shadow-sm"
              id="update-tasa-btn"
            >
              <RotateCw className="w-3.5 h-3.5" />
              ACTUALIZAR TASA
            </button>
          )}
        </div>
      </section>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-items-bento">
        
        {/* Ganancia Semanal (Col-span 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-outline-variant" id="weekly-earnings-bento">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-outline text-xs font-bold uppercase tracking-wider block mb-1">Carga de Cobranza Actual</span>
              <h3 className="font-bold text-xl text-primary font-sans">Saldos de Cartera</h3>
            </div>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% vs Sem. Anterior
            </span>
          </div>

          <p className="text-xs text-on-surface-variant mb-4">
            Total neto por conciliar procedente de ventas a crédito registradas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container-low rounded-lg border border-slate-100">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wide mb-1">TOTAL PENDIENTE USD</p>
              <p className="font-extrabold text-2xl text-primary">
                ${totalCobrarUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg border border-slate-100 border-l-4 border-secondary">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wide mb-1">TOTAL EQUIVALENTE VES</p>
              <p className="font-extrabold text-2xl text-secondary">
                Bs. {totalCobrarVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos (Col-span 5) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4" id="quick-actions-bento">
          <button 
            onClick={() => setActiveTab('clients')}
            className="flex flex-col items-center justify-center p-5 bg-primary text-white hover:bg-primary/95 transition-all rounded-xl shadow-sm text-center group"
            id="qa-new-payment"
          >
            <div className="p-3 bg-white/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xs tracking-wider uppercase">NUEVO PAGO / COBRO</span>
          </button>

          <button 
            onClick={() => setActiveTab('inventory')}
            className="flex flex-col items-center justify-center p-5 bg-white text-primary hover:bg-slate-50 transition-all rounded-xl border border-outline-variant text-center group"
            id="qa-inventory"
          >
            <div className="p-3 bg-primary-fixed text-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs tracking-wider uppercase">INVENTARIO</span>
          </button>
        </div>

        {/* Gráfico de Tendencia (Col-span 8) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-outline-variant" id="sales-trend-bento">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h3 className="font-bold text-lg text-primary">Tendencia de Ventas (Diario)</h3>
              <p className="text-xs text-on-surface-variant">Ventas mayoristas semanales frente a la meta (kg)</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-primary rounded-full inline-block"></span>
                Despachos (kg)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-secondary rounded-full inline-block"></span>
                Meta Diaria (5.000 kg)
              </span>
            </div>
          </div>

          <div className="relative h-60 w-full flex items-end justify-between gap-1 sm:gap-2 px-2 pt-6 border-b border-slate-100" id="bcv-chart-stage">
            {chartData.map((d) => {
              const heightPct = `${(d.val / 7000) * 100}%`;
              const isThresholdMet = d.val >= d.target;
              
              return (
                <div 
                  key={d.day} 
                  className="flex flex-col items-center gap-2 flex-1 group cursor-pointer"
                  onClick={() => setSelectedDayInfo(d)}
                >
                  <div className="w-full relative flex flex-col justify-end h-48">
                    {/* Hover indicator tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[105%] bg-primary text-white text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {d.val.toLocaleString('es-VE')} kg
                    </div>

                    {/* Colored bar */}
                    <div 
                      style={{ height: heightPct }} 
                      className={`w-full rounded-t-xs transition-all duration-300 ${
                        isThresholdMet ? 'bg-primary' : 'bg-primary/50'
                      } group-hover:bg-primary-container`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant mt-1 group-hover:text-primary">
                    {d.day}
                  </span>
                </div>
              );
            })}

            {/* Target guideline overlay */}
            <div 
              style={{ bottom: `${(5000 / 7000) * 100}%` }}
              className="absolute left-0 w-full h-[1px] border-t border-dashed border-secondary/60 z-10 pointer-events-none"
            >
              <span className="absolute right-2 -bottom-4 text-[9px] font-bold text-secondary text-right bg-white px-1">
                Meta
              </span>
            </div>
          </div>

          {selectedDayInfo && (
            <div className="mt-4 p-3 bg-blue-50/50 rounded-lg text-xs flex justify-between items-center transition-all">
              <p className="text-on-surface">
                Detalles del día <strong className="text-primary">{selectedDayInfo.day}</strong>: despachos de{' '}
                <strong>{selectedDayInfo.val.toLocaleString('es-VE')} kg</strong> ({Math.round((selectedDayInfo.val / selectedDayInfo.target) * 100)}% de la meta).
              </p>
              <button onClick={() => setSelectedDayInfo(null)} className="text-primary font-bold hover:underline">
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Estadísticas Rápidas (Col-span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4" id="stats-rapid-bento">
          
          <div className="bg-white p-4 rounded-xl border border-outline-variant flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-container text-on-secondary-container flex items-center justify-center rounded-full">
              <Users className="w-5 h-5 text-on-secondary-container" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Clientes con saldo pendiente</p>
              <p className="text-xl font-extrabold text-on-surface">{activeClients} de {clientCount} activos</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-outline-variant flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-fixed text-primary flex items-center justify-center rounded-full">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Despachos programados para hoy</p>
              <p className="text-xl font-extrabold text-on-surface">12 despachos</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
            criticalProductsCount > 0 
              ? 'bg-error-container/20 border-error/30' 
              : 'bg-white border-outline-variant'
          }`}>
            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
              criticalProductsCount > 0 
                ? 'bg-error-container text-error' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Alertas de Stock</p>
              <p className={`text-xl font-extrabold ${criticalProductsCount > 0 ? 'text-error font-semibold' : 'text-on-surface'}`}>
                {criticalProductsCount} productos críticos
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
