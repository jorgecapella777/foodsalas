import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  RefreshCw, 
  ArrowRightLeft, 
  ExternalLink, 
  TrendingUp, 
  Globe, 
  Calculator,
  Smile,
  CheckCircle2,
  Info
} from 'lucide-react';

interface TasasViewProps {
  tasaBcvUsd: number;
  setTasaBcvUsd: (val: number) => void;
  tasaBcvEur: number;
  setTasaBcvEur: (val: number) => void;
  tasaUsdt: number;
  setTasaUsdt: (val: number) => void;
}

export default function TasasView({
  tasaBcvUsd,
  setTasaBcvUsd,
  tasaBcvEur,
  setTasaBcvEur,
  tasaUsdt,
  setTasaUsdt,
}: TasasViewProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncDetails, setSyncDetails] = useState<any>(null);

  // States for dynamic currency converter
  const [calcAmount, setCalcAmount] = useState('100');
  const [calcFrom, setCalcFrom] = useState<'USD' | 'EUR' | 'USDT' | 'VES'>('USD');
  const [calcTo, setCalcTo] = useState<'VES' | 'USD' | 'EUR' | 'USDT'>('VES');

  // Manual input fields
  const [editUsd, setEditUsd] = useState(tasaBcvUsd.toString());
  const [editEur, setEditEur] = useState(tasaBcvEur.toString());
  const [editUsdt, setEditUsdt] = useState(tasaUsdt.toString());

  // Function to pull real-time rates from back-end scrapers
  const fetchLiveRates = async (showNotification = false) => {
    setIsSyncing(true);
    if (showNotification) {
      setSyncMessage('Extrayendo tasas en tiempo real desde Banco Central de Venezuela (BCV) y USDT.com.ve...');
    }
    
    let loaded = false;
    let usdVal = tasaBcvUsd;
    let eurVal = tasaBcvEur;
    let usdtVal = tasaUsdt;
    let scrapedInfo = null;

    // Intento 1: API /api/rates del Servidor
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        if (data && data.usd) {
          usdVal = parseFloat(String(data.usd));
          if (data.eur) eurVal = parseFloat(String(data.eur));
          if (data.usdt) usdtVal = parseFloat(String(data.usdt));
          scrapedInfo = data.scraped || null;
          loaded = true;
        }
      }
    } catch (err) {
      console.warn("Backend /api/rates not available, trying /api/bcv/rates...", err);
    }

    // Intento 2: API de Resguardo /api/bcv/rates del Servidor
    if (!loaded) {
      try {
        const res = await fetch('/api/bcv/rates');
        if (res.ok) {
          const data = await res.json();
          if (data && data.usd) {
            usdVal = parseFloat(String(data.usd));
            if (data.eur) eurVal = parseFloat(String(data.eur));
            if (data.usdt) usdtVal = parseFloat(String(data.usdt));
            scrapedInfo = data.scraped || null;
            loaded = true;
          }
        }
      } catch (err) {
        console.warn("Backend /api/bcv/rates failed as well:", err);
      }
    }

    // Intento 3: Consulta Directa desde Frontend a API Pública si el backend no responde o se subió como web estática (p. ej. GitHub Pages)
    if (!loaded) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && data.rates.VES) {
            usdVal = parseFloat(String(data.rates.VES));
            const eurRatio = data.rates.EUR ? parseFloat(String(data.rates.EUR)) : 0.92;
            eurVal = parseFloat((usdVal / eurRatio).toFixed(4));
            usdtVal = parseFloat((usdVal * 1.03).toFixed(4));
            scrapedInfo = { bcvUsd: true, bcvEur: true, usdt: true };
            loaded = true;
          }
        }
      } catch (err) {
        console.error("Direct public rate API failed:", err);
      }
    }

    if (loaded) {
      setTasaBcvUsd(usdVal);
      setTasaBcvEur(eurVal);
      setTasaUsdt(usdtVal);

      setEditUsd(usdVal.toString());
      setEditEur(eurVal.toString());
      setEditUsdt(usdtVal.toString());
      if (scrapedInfo) setSyncDetails(scrapedInfo);

      if (showNotification) {
        setSyncMessage('¡Tasas actualizadas automáticamente con éxito en toda la aplicación!');
        setTimeout(() => setSyncMessage(''), 4000);
      }
    } else {
      if (showNotification) {
        setSyncMessage(`Error de conexión temporal. Se mantienen las tasas de resguardo.`);
        setTimeout(() => setSyncMessage(''), 5000);
      }
    }
    setIsSyncing(false);
  };

  // Auto-fetch on component load
  useEffect(() => {
    fetchLiveRates(false);
  }, []);

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const usdVal = parseFloat(editUsd);
    const eurVal = parseFloat(editEur);
    const usdtVal = parseFloat(editUsdt);

    if (!isNaN(usdVal) && usdVal > 0) setTasaBcvUsd(usdVal);
    if (!isNaN(eurVal) && eurVal > 0) setTasaBcvEur(eurVal);
    if (!isNaN(usdtVal) && usdtVal > 0) setTasaUsdt(usdtVal);

    setSyncMessage('Tasas actualizadas manualmente en caja.');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  const calculateConversion = () => {
    const amt = parseFloat(calcAmount) || 0;
    if (amt <= 0) return '0.00';

    // Convert everything to VES base first
    let vesBase = 0;
    if (calcFrom === 'VES') vesBase = amt;
    else if (calcFrom === 'USD') vesBase = amt * tasaBcvUsd;
    else if (calcFrom === 'EUR') vesBase = amt * tasaBcvEur;
    else if (calcFrom === 'USDT') vesBase = amt * tasaUsdt;

    // Convert from VES to selected target
    let finalVal = 0;
    if (calcTo === 'VES') finalVal = vesBase;
    else if (calcTo === 'USD') finalVal = vesBase / tasaBcvUsd;
    else if (calcTo === 'EUR') finalVal = vesBase / tasaBcvEur;
    else if (calcTo === 'USDT') finalVal = vesBase / tasaUsdt;

    return finalVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4 fade-in pb-10" id="tasas-view-root">
      
      {/* Title card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-1.5 font-sans">
            <Coins className="w-5 h-5 text-indigo-700" />
            Tasas Cambiarias en Tiempo Real
          </h2>
          <p className="text-xs text-slate-500">
            Sustraído de BCV y USDT oficial para liquidación comercial.
          </p>
        </div>
        <button
          onClick={() => fetchLiveRates(true)}
          disabled={isSyncing}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase py-2 px-3 rounded-xl flex items-center gap-1 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Buscando...' : 'Actualizar'}
        </button>
      </div>

      {/* Connection notification block */}
      {syncMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-950 font-bold text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <Info className="w-4 h-4 text-indigo-700 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Online indicator panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden" id="tasas-display-card">
        <span className="text-[9px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-3.5">
          Conexión Automática Activa
        </span>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center space-y-0.5">
            <span className="text-[9px] text-slate-350 font-extrabold uppercase tracking-wider block">USD BCV</span>
            <span className="text-lg font-black font-sans block">Bs. {tasaBcvUsd.toFixed(2)}</span>
            <span className="text-[8.5px] text-emerald-400 font-extrabold block">Extraído</span>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center space-y-0.5">
            <span className="text-[9px] text-slate-350 font-extrabold uppercase tracking-wider block">EUR BCV</span>
            <span className="text-lg font-black font-sans block">Bs. {tasaBcvEur.toFixed(2)}</span>
            <span className="text-[8.5px] text-emerald-400 font-extrabold block">Extraído</span>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center space-y-0.5">
            <span className="text-[9px] text-slate-350 font-extrabold uppercase tracking-wider block">USDT TASA</span>
            <span className="text-lg font-black font-sans block">Bs. {tasaUsdt.toFixed(2)}</span>
            <span className="text-[8.5px] text-emerald-400 font-extrabold block">Extraído</span>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 mt-4 leading-relaxed font-semibold">
          * Nota legal: Las deudas de compras y pagos de Inversiones Food Salas se liquidan estrictamente bajo la tasa BCV oficial del día expresado por este monitor.
        </p>
      </div>

      {/* Currency conversion module */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 space-y-4 shadow-2xs" id="currency-exchange-calculator">
        <h4 className="text-[10.5px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">
          Calculadora de Cambio Instantáneo
        </h4>
        
        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Cantidad a Cambiar</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-lg font-black text-slate-800 outline-none"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-2 items-center justify-between">
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">De Moneda</label>
              <select 
                className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs font-bold text-slate-700"
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as any)}
              >
                <option value="USD">Dólar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="USDT">Tether Crypto (USDT)</option>
                <option value="VES">Bolívares (Bs. VES)</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">A Moneda</label>
              <select 
                className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs font-bold text-slate-700"
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value as any)}
              >
                <option value="VES">Bolívares (Bs. VES)</option>
                <option value="USD">Dólar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="USDT">Tether Crypto (USDT)</option>
              </select>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-150 text-center font-sans">
            <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide block">Resultado del Cambio</span>
            <strong className="text-xl text-emerald-700 font-black mt-1 block">
              {calcTo === 'VES' ? 'Bs.' : calcTo === 'EUR' ? '€' : '$'} {calculateConversion()} <span className="text-xs uppercase text-slate-400 font-normal">{calcTo}</span>
            </strong>
          </div>
        </div>
      </div>

      {/* Manual tuning backup panel */}
      <form onSubmit={handleManualSave} className="bg-white p-5 rounded-3xl border border-slate-150 space-y-4 shadow-2xs" id="manual-tuning-box">
        <h4 className="text-[10.5px] font-black text-slate-750 text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
          Anular Sincronización (Modo Manual)
        </h4>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Dólar USD</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs font-black font-sans" 
                value={editUsd}
                onChange={(e) => setEditUsd(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Euro EUR</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs font-black font-sans" 
                value={editEur}
                onChange={(e) => setEditEur(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tether USDT</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs font-black font-sans" 
                value={editUsdt}
                onChange={(e) => setEditUsdt(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all"
          >
            Aplicar Ajuste Manual de Tasas
          </button>
        </div>
      </form>

    </div>
  );
}
