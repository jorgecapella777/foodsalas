import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  Printer, 
  TrendingUp, 
  Check, 
  DollarSign, 
  ShoppingBag,
  Briefcase,
  Layers,
  Search,
  Scale
} from 'lucide-react';
import { Client, HistoricalOperation } from '../types';
import { exportClientInvoicePDF } from '../utils/pdfGenerator';

interface FacturarViewProps {
  clients: Client[];
  historicalOperations: HistoricalOperation[];
  tasaBcvUsd: number;
}

// Parsear un string de fecha del sistema de forma robusta
function parseOpDate(dateTimeStr: string): Date {
  const now = new Date();
  if (dateTimeStr.includes('Hoy')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (dateTimeStr.includes('Ayer')) {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  }
  
  // Buscar formato DD/MM/YYYY
  const dmYMatch = dateTimeStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmYMatch) {
    const day = parseInt(dmYMatch[1], 10);
    const month = parseInt(dmYMatch[2], 10);
    const year = parseInt(dmYMatch[3], 10);
    return new Date(year, month - 1, day);
  }
  
  // Buscar formato YYYY-MM-DD
  const ymdMatch = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month - 1, day);
  }
  
  // Buscar formato DD Mes YYYY (e.g., 17 Jul 2026)
  const textDateMatch = dateTimeStr.match(/(\d{1,2})\s+([a-zA-ZáéíóúÁÉÍÓÚ]{3})\s+(\d{4})/);
  if (textDateMatch) {
    const day = parseInt(textDateMatch[1], 10);
    const monthStr = textDateMatch[2].toLowerCase();
    const year = parseInt(textDateMatch[3], 10);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthIdx = months.findIndex(m => monthStr.startsWith(m));
    if (monthIdx !== -1) {
      return new Date(year, monthIdx, day);
    }
  }

  return now;
}

export default function FacturarView({
  clients,
  historicalOperations,
  tasaBcvUsd
}: FacturarViewProps) {
  
  // States
  const [clientId, setClientId] = useState('');

  // Calcular deudas en kilos
  const getClientOwedKg = (client: any) => {
    if (client.balanceUsd <= 0) return 0;
    const clientSales = (historicalOperations || []).filter(op => {
      const nameMatch = op.destination?.toLowerCase() === client.name.toLowerCase() || 
                        op.origin?.toLowerCase() === client.name.toLowerCase() || 
                        op.description.toLowerCase().includes(client.name.toLowerCase());
      const isSale = op.description.toLowerCase().includes('venta') && op.kg !== undefined && op.kg > 0;
      return nameMatch && isSale;
    });

    if (clientSales.length === 0) {
      return client.balanceUsd / 6.0; // Precio referencial por kg
    }

    const totalSalesUsd = clientSales.reduce((sum, op) => sum + (op.amountUsd || 0), 0);
    const totalSalesKg = clientSales.reduce((sum, op) => sum + (op.kg || 0), 0);

    if (totalSalesUsd > 0 && totalSalesKg > 0) {
      return client.balanceUsd / (totalSalesUsd / totalSalesKg);
    }
    return 0;
  };
  const [dateFrom, setDateFrom] = useState(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [invoiceNum, setInvoiceNum] = useState('');
  const [selectedOpIds, setSelectedOpIds] = useState<Record<string, boolean>>({});

  // PDF settings
  const [showRif, setShowRif] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [pagoAnticipado, setPagoAnticipado] = useState(0);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === clientId) || null;
  }, [clients, clientId]);

  // Auto-set default prepayment if selected client has credit/balance in favor (balanceUsd < 0)
  useEffect(() => {
    if (selectedClient) {
      const defaultAnticipado = selectedClient.balanceUsd < 0 ? Math.abs(selectedClient.balanceUsd) : 0;
      setPagoAnticipado(defaultAnticipado);
    } else {
      setPagoAnticipado(0);
    }
  }, [selectedClient]);

  // Auto-generate pure numeric invoice number when client is changed
  useEffect(() => {
    if (clientId) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setInvoiceNum(randomNum.toString());
    }
  }, [clientId]);

  // Filter movements for selected client and date range
  const clientMovements = useMemo(() => {
    if (!selectedClient) return [];
    
    const clientNameLower = selectedClient.name.toLowerCase();
    const start = new Date(dateFrom + 'T00:00:00').getTime();
    const end = new Date(dateTo + 'T23:59:59').getTime();
    
    return historicalOperations.filter(op => {
      // Must be related to the client and be a sale / client payment type representing a sale
      const isClientRelated = op.destination?.toLowerCase() === clientNameLower || 
                              op.origin?.toLowerCase() === clientNameLower || 
                              op.description.toLowerCase().includes(clientNameLower);
                              
      const isSale = op.description.toLowerCase().includes('venta') || 
                     op.type === 'CLIENT_PAYMENT' && op.kg !== undefined;

      if (!isClientRelated || !isSale) return false;
      
      const opTime = parseOpDate(op.dateTime).getTime();
      return opTime >= start && opTime <= end;
    });
  }, [selectedClient, historicalOperations, dateFrom, dateTo]);

  // Pre-select all matching operations when the filter list changes
  useEffect(() => {
    const newSelected: Record<string, boolean> = {};
    clientMovements.forEach(op => {
      newSelected[op.id] = true;
    });
    setSelectedOpIds(newSelected);
  }, [clientMovements]);

  // Calculate totals of selected operations
  const totals = useMemo(() => {
    let kg = 0;
    let usd = 0;
    let count = 0;
    
    clientMovements.forEach(op => {
      if (selectedOpIds[op.id]) {
        kg += op.kg || 0;
        usd += op.amountUsd || 0;
        count++;
      }
    });
    
    return {
      totalKg: parseFloat(kg.toFixed(2)),
      totalUsd: parseFloat(usd.toFixed(2)),
      totalBs: parseFloat((usd * tasaBcvUsd).toFixed(2)),
      count
    };
  }, [clientMovements, selectedOpIds, tasaBcvUsd]);

  // Handlers
  const handleToggleOp = (id: string) => {
    setSelectedOpIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleAll = () => {
    const allSelected = clientMovements.every(op => selectedOpIds[op.id]);
    const nextSelected: Record<string, boolean> = {};
    clientMovements.forEach(op => {
      nextSelected[op.id] = !allSelected;
    });
    setSelectedOpIds(nextSelected);
  };

  const handleExportPDF = () => {
    if (!selectedClient) {
      alert('Por favor seleccione un cliente de la cartera.');
      return;
    }
    if (!invoiceNum.trim()) {
      alert('Por favor asigne un número de factura (solo números).');
      return;
    }
    
    // Check if invoiceNum is numeric
    if (!/^\d+$/.test(invoiceNum)) {
      alert('El número de factura debe contener exclusivamente dígitos numéricos.');
      return;
    }

    const movementsToBill = clientMovements.filter(op => selectedOpIds[op.id]);
    if (movementsToBill.length === 0) {
      alert('Por favor seleccione al menos un movimiento para facturar.');
      return;
    }

    exportClientInvoicePDF(
      selectedClient,
      invoiceNum,
      movementsToBill,
      tasaBcvUsd,
      dateFrom,
      dateTo,
      {
        showRif,
        showPhone,
        showAddress,
        markAsPaid,
        pagoAnticipado
      }
    );
    
    alert('Factura PDF generada y descargada de manera exitosa.');
  };

  // Helper to parse clean concept
  const getCleanConcept = (desc: string) => {
    let clean = desc;
    if (desc.includes(':')) {
      clean = desc.split(':').slice(1).join(':').trim();
    }
    if (clean.includes(' a ')) {
      clean = clean.split(' a ')[0].trim();
    }
    return clean;
  };

  return (
    <div className="space-y-6 fade-in pb-10" id="facturar-view-root">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-xs" id="facturar-header-card">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-1.5 tracking-wider">
              <FileText className="w-5 h-5 text-indigo-600" />
              Módulo de Facturación
            </h2>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">
              Generar documento de cobro formal automatizado
            </p>
          </div>
          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-2.5 py-1 rounded uppercase tracking-wide">
            Automático
          </span>
        </div>

        {/* Form Controls */}
        <div className="mt-4 space-y-4">
          {/* Client Select */}
          <div className="space-y-1">
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase">
              Cliente Comercial (Cartera)
            </label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Seleccione un cliente para facturar...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.rif ? `[RIF ${c.rif}]` : ''} {c.balanceUsd > 0 ? `(Debe: $${c.balanceUsd.toFixed(2)} - ${getClientOwedKg(c).toFixed(1)} Kg aprox.)` : '(Solvente)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Select */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10.5px] font-bold text-slate-500 uppercase">
                Fecha Desde (Movimiento)
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-black text-slate-750"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10.5px] font-bold text-slate-500 uppercase">
                Fecha Hasta (Movimiento)
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-black text-slate-750"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Opciones de Impresión / Talonario */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Opciones de Talonario (Mostrar en PDF)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showRif}
                  onChange={(e) => setShowRif(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span>Mostrar Cédula/RIF</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span>Mostrar Teléfono</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showAddress}
                  onChange={(e) => setShowAddress(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span>Mostrar Dirección</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-emerald-700">
                <input
                  type="checkbox"
                  checked={markAsPaid}
                  onChange={(e) => setMarkAsPaid(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1">Sello "PAGADO"</span>
              </label>
            </div>

            {/* Custom Prepayment/Anticipado Input */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 max-w-sm space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wide">
                Monto de Pago Anticipado ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full bg-white border border-slate-205 pl-7 pr-3 py-1.5 rounded-xl text-xs font-black text-slate-750 focus:outline-hidden"
                  placeholder="0.00"
                  value={pagoAnticipado || ''}
                  onChange={(e) => setPagoAnticipado(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium">
                {selectedClient?.balanceUsd && selectedClient.balanceUsd < 0 ? (
                  <span className="text-emerald-600 font-bold">
                    * El cliente posee un saldo a favor de ${Math.abs(selectedClient.balanceUsd).toFixed(2)} USD (Cargado automáticamente).
                  </span>
                ) : (
                  "Especifique un anticipo si el cliente realizó un abono previo."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Display */}
      {selectedClient ? (
        <div className="space-y-6">
          
          {/* Movements Picker Card */}
          <div className="bg-white border border-slate-150 p-4 rounded-3xl shadow-2xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                Movimientos de {selectedClient.name}
              </span>
              {clientMovements.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-[9.5px] text-indigo-650 hover:text-indigo-700 font-black uppercase tracking-wider"
                >
                  {clientMovements.every(op => selectedOpIds[op.id]) ? 'Desmarcar Todos' : 'Marcar Todos'}
                </button>
              )}
            </div>

            <div className="max-h-[180px] overflow-y-auto no-scrollbar space-y-2">
              {clientMovements.map(op => {
                const isChecked = !!selectedOpIds[op.id];
                const cleanConcept = getCleanConcept(op.description);
                const unitPrice = op.kg ? (op.amountUsd || 0) / op.kg : 0;
                
                return (
                  <div
                    key={op.id}
                    onClick={() => handleToggleOp(op.id)}
                    className={`p-3 border rounded-xl flex justify-between items-center gap-3 transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-indigo-50/40 border-indigo-200' 
                        : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox circle indicator */}
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isChecked 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>
                      
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-black text-slate-850 block leading-tight truncate">
                          {cleanConcept}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-450 font-bold uppercase">
                          <span>{op.dateTime.split(',')[0]}</span>
                          <span>•</span>
                          <span>{op.kg?.toFixed(1)} KG</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-800 font-sans block leading-none">
                        ${op.amountUsd?.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                        ${unitPrice.toFixed(2)}/kg
                      </span>
                    </div>
                  </div>
                );
              })}

              {clientMovements.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  No se encontraron despachos o ventas registradas en el periodo seleccionado.
                </div>
              )}
            </div>
          </div>

          {/* Factura Editable Preview Form */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4 relative overflow-hidden" id="factura-document-form">
            
            {/* Header watermark-like ribbon */}
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-8 py-1 rotate-45 translate-x-6 translate-y-3">
              Vista Previa
            </div>

            <div className="border-b-2 border-dashed border-slate-150 pb-3 flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-400 font-bold block uppercase tracking-wide">Facturación de Control</span>
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">NRO:</span>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    className="bg-transparent text-slate-800 text-xs font-black w-24 outline-hidden border-b border-transparent focus:border-indigo-600 font-sans"
                    placeholder="Escriba el número..."
                    value={invoiceNum}
                    onChange={(e) => setInvoiceNum(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-black block uppercase">Inversiones Food Salas</span>
                <span className="text-[10.5px] font-sans font-black text-slate-800 block mt-0.5">Yaracuy, VE</span>
              </div>
            </div>

            {/* Client Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 text-[11px] space-y-1.5 text-slate-705">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">CLIENTE:</span>
                <strong className="text-slate-800">{selectedClient.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">RIF / C.I.:</span>
                <span className="text-slate-700 font-bold">{selectedClient.rif || selectedClient.cedula || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">FECHA EMISIÓN:</span>
                <span className="text-slate-700 font-black">{new Date().toLocaleDateString('es-VE')}</span>
              </div>
            </div>

            {/* Bill Lines List */}
            <div className="space-y-2">
              <span className="text-[9.5px] text-slate-400 font-black uppercase tracking-wider block">Ítems Detallados</span>
              
              <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {clientMovements.filter(op => selectedOpIds[op.id]).map(op => {
                  const cleanConcept = getCleanConcept(op.description);
                  const uPrice = op.kg ? (op.amountUsd || 0) / op.kg : 0;
                  
                  return (
                    <div key={op.id} className="p-3 bg-white flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 block">{cleanConcept}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block">{op.kg?.toFixed(2)} KG • ${uPrice.toFixed(2)}/KG</span>
                      </div>
                      <strong className="text-slate-750 font-sans">${op.amountUsd?.toFixed(2)} USD</strong>
                    </div>
                  );
                })}

                {totals.count === 0 && (
                  <div className="p-6 text-center text-slate-400 italic bg-white text-xs">
                    Ningún despacho seleccionado. Marque elementos de la lista superior para incluirlos.
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Automated Totals Box */}
            <div className="p-4 bg-indigo-950 text-white rounded-2xl space-y-2.5 shadow-xs">
              <div className="flex justify-between text-xs font-semibold text-indigo-250 border-b border-white/10 pb-2">
                <span>Resumen de Cobro ({totals.count} operaciones)</span>
                <span>Tasa BCV: Bs. {tasaBcvUsd.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-200">Volumen Total Kilos:</span>
                <span className="font-sans font-black">{totals.totalKg.toLocaleString('es-VE')} KG</span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-200">Subtotal en Divisas:</span>
                <span className="font-sans font-black">${totals.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase text-indigo-300">Total en Bolívares:</span>
                <div className="text-right">
                  <span className="text-lg font-black font-sans block leading-none text-emerald-350">
                    Bs. {totals.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-indigo-200 uppercase font-black tracking-wider block mt-1">Conforme a Ley BCV</span>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={totals.count === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Generar y Descargar Factura PDF</span>
            </button>

          </div>

        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-150 shadow-2xs space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-400 font-extrabold uppercase leading-relaxed max-w-xs mx-auto">
            Seleccione un cliente para consultar de manera automática todos sus despachos y generar la factura comercial consolidada.
          </p>
        </div>
      )}

    </div>
  );
}
