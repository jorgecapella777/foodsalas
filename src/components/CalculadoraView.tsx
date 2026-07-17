import React, { useState } from 'react';
import { 
  Calculator, 
  Percent, 
  HelpCircle, 
  Layers, 
  Info,
  DollarSign
} from 'lucide-react';

interface CalculadoraViewProps {
  tasaBcvUsd: number;
}

export default function CalculadoraView({ tasaBcvUsd }: CalculadoraViewProps) {
  // Model input states
  const [costoNeto, setCostoNeto] = useState<number>(1.80); // Costo Base en USD
  const [gananciaMayor, setGananciaMayor] = useState<number>(15); // Margen Mayor en %
  const [gananciaDetal, setGananciaDetal] = useState<number>(30); // Margen Detal en %
  const [cantidadKilos, setCantidadKilos] = useState<number>(1); // Cantidad de de kilos a simular

  // States for Merma Calculator
  const [inicialKg, setInicialKg] = useState<number>(150);
  const [finalKg, setFinalKg] = useState<number>(147);
  const [costoKgUsd, setCostoKgUsd] = useState<number>(2.10);
  const [ventaKgUsd, setVentaKgUsd] = useState<number>(2.45);

  // Calculations for Mayor/Detal
  const precioMayorUsd = costoNeto * (1 + gananciaMayor / 100);
  const precioDetalUsd = costoNeto * (1 + gananciaDetal / 100);

  const totalNetoUsd = costoNeto * cantidadKilos;
  const totalMayorUsd = precioMayorUsd * cantidadKilos;
  const totalDetalUsd = precioDetalUsd * cantidadKilos;

  // Calculations for Merma
  const mermaKg = Math.max(0, inicialKg - finalKg);
  const mermaPorcentaje = inicialKg > 0 ? (mermaKg / inicialKg) * 100 : 0;
  const perdidaCostoUsd = mermaKg * costoKgUsd;
  const perdidaVentaUsd = mermaKg * ventaKgUsd;
  const rendimientoComercial = inicialKg > 0 ? (finalKg / inicialKg) * 100 : 0;

  return (
    <div className="space-y-4 fade-in pb-10" id="calculadora-view-root">
      
      {/* Title block */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
        <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-1.5 justify-center">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Simulador Comercial de Precios
        </h2>
        <p className="text-xs text-slate-500 text-center leading-relaxed max-w-sm mx-auto mt-0.5">
          Calcula de manera instantánea el tarifario al Mayor y Detal determinando el precio neto, márgenes de utilidad y equivalencias en Bolívares.
        </p>
      </div>

      {/* Inputs Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 shadow-sm" id="calc-inputs-body">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
          <Layers className="w-4 h-4 text-slate-600" />
          <h4 className="text-[10.5px] font-black text-slate-700 uppercase tracking-widest">Parámetros de Costo Base</h4>
        </div>

        <div className="space-y-3.5">
          {/* Costo Neto de Adquisición */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Costo Comercial Neto ($ USD / KG)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">$</span>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl py-3 pl-8 pr-3 text-base font-black text-slate-800 focus:outline-hidden font-sans"
                value={costoNeto}
                onChange={(e) => setCostoNeto(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
            <p className="text-[10px] text-indigo-700 font-bold block mt-1 pl-1">
              Bs. {(costoNeto * tasaBcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES por KG (Tasa BCV)
            </p>
          </div>

          {/* Margins */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Ganancia al Mayor (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.5"
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 font-bold text-slate-750 text-slate-700"
                  value={gananciaMayor}
                  onChange={(e) => setGananciaMayor(parseFloat(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Ganancia al Detal (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.5"
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 font-bold text-slate-750 text-slate-700"
                  value={gananciaDetal}
                  onChange={(e) => setGananciaDetal(parseFloat(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Bulk KG simulations */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Kilos a Calcular en Masa (Opcional)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.5"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-extrabold text-xs"
                placeholder="Ej. Cantidad de kilos totales..."
                value={cantidadKilos}
                onChange={(e) => setCantidadKilos(Math.max(1, parseFloat(e.target.value) || 1))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-extrabold">KG</span>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS A: MAYOR */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs" id="results-mayor-card">
        <div className="bg-slate-800 text-white p-3.5 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider">A) PRECIO SUGERIDO AL MAYOR</span>
          <span className="bg-emerald-600 font-black text-[9px] tracking-widest px-2 py-0.5 rounded uppercase">+{gananciaMayor}% GANANCIA</span>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 font-bold">Precio Neto por Kilo:</span>
            <span className="text-xs text-slate-400 font-extrabold font-sans">${costoNeto.toFixed(2)} USD</span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-slate-500 font-bold">Venta Establecida:</span>
            <div className="text-right">
              <strong className="text-xl sm:text-2xl font-black text-slate-800 font-sans block leading-none">
                ${precioMayorUsd.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD/KG</span>
              </strong>
              <span className="text-[11px] text-indigo-750 text-indigo-700 font-black block mt-1.5">
                Bs. {(precioMayorUsd * tasaBcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Ves
              </span>
            </div>
          </div>

          {cantidadKilos > 1 && (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs font-bold mt-2">
              <span className="text-slate-500 font-bold">Total por {cantidadKilos} kg:</span>
              <strong className="text-slate-850 font-sans">
                ${totalMayorUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD / Bs. {(totalMayorUsd * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })} Bs.
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* RESULTS B: DETAL */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs" id="results-detal-card">
        <div className="bg-indigo-900 text-white p-3.5 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider">B) PRECIO SUGERIDO AL DETAL</span>
          <span className="bg-amber-600 font-black text-[9px] tracking-widest px-2 py-0.5 rounded uppercase font-sans">+{gananciaDetal}% GANANCIA</span>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 font-bold">Precio Neto por Kilo:</span>
            <span className="text-xs text-slate-400 font-extrabold font-sans">${costoNeto.toFixed(2)} USD</span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-slate-500 font-bold">Venta Establecida:</span>
            <div className="text-right">
              <strong className="text-xl sm:text-2xl font-black text-indigo-900 font-sans block leading-none">
                ${precioDetalUsd.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD/KG</span>
              </strong>
              <span className="text-[11px] text-indigo-750 text-indigo-700 font-black block mt-1.5">
                Bs. {(precioDetalUsd * tasaBcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Ves
              </span>
            </div>
          </div>

          {cantidadKilos > 1 && (
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex justify-between items-center text-xs font-bold mt-2">
              <span className="text-indigo-900 font-bold">Total por {cantidadKilos} kg:</span>
              <strong className="text-indigo-950 font-sans">
                ${totalDetalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD / Bs. {(totalDetalUsd * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })} Bs.
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* CALCULADORA DE MERMA / RENDIMIENTO (NEW) */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm" id="calculadora-merma-card">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider">C) CALCULADORA DE MERMA E IMPACTO FINANCIERO</span>
          </div>
          <span className="bg-amber-600 font-black text-[9px] tracking-widest px-2 py-0.5 rounded uppercase font-sans">Análisis de Pérdidas</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Inventario Inicial (KG)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 font-bold text-xs"
                value={inicialKg}
                onChange={(e) => setInicialKg(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Inventario Final / Vendido (KG)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 font-bold text-xs"
                value={finalKg}
                onChange={(e) => setFinalKg(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Costo de Adquisición ($/KG)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 font-bold text-xs"
                value={costoKgUsd}
                onChange={(e) => setCostoKgUsd(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Precio de Venta ($/KG)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 font-bold text-xs"
                value={ventaKgUsd}
                onChange={(e) => setVentaKgUsd(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
            <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 pb-1.5">Métricas de Merma Obtenidas</h5>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Merma Total</span>
                <strong className="text-sm font-black text-rose-600 block">{mermaKg.toFixed(2)} KG ({mermaPorcentaje.toFixed(1)}%)</strong>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Rendimiento Comercial</span>
                <strong className="text-sm font-black text-emerald-600 block">{rendimientoComercial.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Pérdida (Costo Real)</span>
                <strong className="text-xs font-black text-rose-650 block">${perdidaCostoUsd.toFixed(2)} USD</strong>
                <span className="text-[8.5px] text-slate-400 block font-medium">Bs. {Math.round(perdidaCostoUsd * tasaBcvUsd).toLocaleString('es-VE')}</span>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Venta Dejada de Percibir</span>
                <strong className="text-xs font-black text-slate-700 block">${perdidaVentaUsd.toFixed(2)} USD</strong>
                <span className="text-[8.5px] text-slate-400 block font-medium">Bs. {Math.round(perdidaVentaUsd * tasaBcvUsd).toLocaleString('es-VE')}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[10px] text-amber-900 leading-normal flex gap-1.5 font-semibold">
            <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <span>Explicación: La merma se calcula sobre el costo de adquisición (pérdida real que afecta directamente al capital) y sobre el precio de venta (monto de ingresos que se deja de percibir por evaporación, recortes o desperdicio).</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-normal flex gap-2 font-medium">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Los márgenes preestablecidos (15% mayor / 30% detal) son recomendados comercialmente por Inversiones Food Salas, pudiendo ser customizados libremente.</span>
      </div>

    </div>
  );
}
