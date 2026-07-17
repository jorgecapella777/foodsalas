import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  Package, 
  Truck, 
  UserCheck, 
  SlidersHorizontal,
  Calendar,
  Layers,
  FileText,
  X
} from 'lucide-react';
import { HistoricalOperation } from '../types';
import { exportTransactionPDF, exportOperationsHistoryPDF } from '../utils/pdfGenerator';

interface HistoricosViewProps {
  operations: HistoricalOperation[];
  tasaBcvUsd: number;
}

type FilterType = 'TODOS' | 'CLIENTES' | 'PROVEEDORES' | 'INVENTARIO_ENTRADAS' | 'INVENTARIO_SALIDAS';

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
  
  return now;
}

// Filtrar operaciones por rango
function filterByRange(ops: HistoricalOperation[], range: string, customStart: string, customEnd: string): HistoricalOperation[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return ops.filter(op => {
    const opDate = parseOpDate(op.dateTime);
    const opTime = opDate.getTime();
    
    if (range === 'Hoy') {
      return opTime === todayStart.getTime();
    }
    if (range === 'Ayer') {
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      return opTime === yesterday.getTime();
    }
    if (range === 'Esta Semana') {
      const oneWeekAgo = new Date(todayStart);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return opTime >= oneWeekAgo.getTime() && opTime <= todayStart.getTime();
    }
    if (range === 'Semana Pasada') {
      const twoWeeksAgo = new Date(todayStart);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date(todayStart);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return opTime >= twoWeeksAgo.getTime() && opTime < oneWeekAgo.getTime();
    }
    if (range === 'Este Mes') {
      return opDate.getMonth() === now.getMonth() && opDate.getFullYear() === now.getFullYear();
    }
    if (range === 'Este Año') {
      return opDate.getFullYear() === now.getFullYear();
    }
    if (range === 'Personalizado') {
      if (!customStart || !customEnd) return true;
      const start = new Date(customStart + 'T00:00:00');
      const end = new Date(customEnd + 'T23:59:59');
      return opTime >= start.getTime() && opTime <= end.getTime();
    }
    return true;
  });
}

export default function HistoricosView({ operations, tasaBcvUsd }: HistoricosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('TODOS');
  
  // Estados para detalles de transacción y exportación en PDF
  const [selectedOp, setSelectedOp] = useState<HistoricalOperation | null>(null);
  const [showExportRangeModal, setShowExportRangeModal] = useState(false);
  const [exportRange, setExportRange] = useState<string>('Hoy');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Filter logic
  const filteredOperations = operations.filter(op => {
    // Category filter
    let categoryMatch = true;
    if (activeFilter === 'CLIENTES') {
      categoryMatch = op.type === 'CLIENT_PAYMENT';
    } else if (activeFilter === 'PROVEEDORES') {
      categoryMatch = op.type === 'PROVIDER_PAYMENT' || op.type === 'PURCHASE';
    } else if (activeFilter === 'INVENTARIO_ENTRADAS') {
      categoryMatch = op.type === 'INVENTORY_MANUAL_IN' || op.type === 'PURCHASE';
    } else if (activeFilter === 'INVENTARIO_SALIDAS') {
      categoryMatch = op.type === 'INVENTORY_MANUAL_OUT' || op.type === 'QUICK_OUT' || (op.type === 'CLIENT_PAYMENT' && op.kg !== undefined);
    }

    // Text search filter
    const textMatch = 
      op.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.reference && op.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    return categoryMatch && textMatch;
  });

  return (
    <div className="space-y-4 fade-in" id="historicos-view-root">
      
      {/* Header Info */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Históricos de Operaciones
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consulta de auditoría sobre cada entrada, salida, abono y movimiento realizado.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowExportRangeModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-transform active:scale-97"
            title="Guardar histórico en PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
          
          <div className="bg-slate-50 border border-slate-205 py-1 px-3 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Logs</span>
            <strong className="text-sm font-black text-slate-700">{filteredOperations.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-4 space-y-3 shadow-xs">
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descripción, cliente, referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-primary/50"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth" id="historicos-category-filters">
          {([
            { id: 'TODOS', label: 'Ver Todo' },
            { id: 'CLIENTES', label: 'Cobros Clientes' },
            { id: 'PROVEEDORES', label: 'Pago Prov' },
            { id: 'INVENTARIO_ENTRADAS', label: 'Entradas Stock' },
            { id: 'INVENTARIO_SALIDAS', label: 'Salidas Stock' }
          ] as const).map((filt) => {
            const isActive = activeFilter === filt.id;
            return (
              <button
                key={filt.id}
                type="button"
                onClick={() => setActiveFilter(filt.id)}
                className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase whitespace-nowrap transition-all border shrink-0 ${
                  isActive 
                    ? 'bg-slate-800 border-slate-800 text-white' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {filt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Cronología General</span>
          <span className="text-[9.5px] bg-slate-200 text-slate-700 font-black tracking-wide px-2 py-0.5 rounded uppercase">Auditoría Habilitada</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
          {filteredOperations.map((op) => {
            // Determine icon representation and colors
            let iconMarkup = <History className="w-4 h-4" />;
            let iconBg = 'bg-slate-50 text-slate-500';

            switch (op.type) {
              case 'CLIENT_PAYMENT':
                iconMarkup = <ArrowDownLeft className="w-4 h-4" />;
                iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                break;
              case 'PROVIDER_PAYMENT':
                iconMarkup = <ArrowUpRight className="w-4 h-4" />;
                iconBg = 'bg-rose-50 text-rose-600 border border-rose-100';
                break;
              case 'PURCHASE':
                iconMarkup = <Truck className="w-4 h-4" />;
                iconBg = 'bg-blue-50 text-blue-600 border border-blue-100';
                break;
              case 'INVENTORY_MANUAL_IN':
                iconMarkup = <Package className="w-4 h-4 text-emerald-500" />;
                iconBg = 'bg-slate-50 text-emerald-600 border border-slate-200';
                break;
              case 'INVENTORY_MANUAL_OUT':
              case 'QUICK_OUT':
                iconMarkup = <Package className="w-4 h-4 text-rose-500" />;
                iconBg = 'bg-slate-50 text-rose-600 border border-slate-200';
                break;
            }

            return (
              <div 
                key={op.id} 
                onClick={() => setSelectedOp(op)}
                className="p-4 hover:bg-indigo-50/35 hover:border-indigo-100 transition-all space-y-2 cursor-pointer relative group border-b border-transparent"
                title="Haga clic para ver el detalle de la transacción"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
                      {iconMarkup}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-800 block leading-tight group-hover:text-indigo-650">
                        {op.description}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-extrabold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {op.dateTime}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {op.amountUsd !== undefined && (
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-705 block font-sans">
                          ${op.amountUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-bold block">
                          Bs. {(op.amountUsd * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    )}
                    {op.kg !== undefined && (
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg block mt-1 uppercase">
                        {op.kg} KG
                      </span>
                    )}
                  </div>
                </div>

                {/* Logistics details: where and destination */}
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2 justify-between text-[10.5px]">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-slate-400 font-bold">Desde:</span>
                    <span className="text-slate-700 font-extrabold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                      {op.origin}
                    </span>
                  </div>
                  
                  <div className="w-4 h-[1px] bg-slate-200"></div>

                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-slate-400 font-bold">Hacia:</span>
                    <span className="text-slate-700 font-extrabold whitespace-nowrap overflow-hidden text-ellipsis max-w-[125px]">
                      {op.destination}
                    </span>
                  </div>
                </div>

                {op.reference && (
                  <div className="text-[9px] text-slate-500 font-black tracking-wider uppercase bg-slate-100/70 inline-block px-2 py-0.5 rounded mt-1 border border-slate-200">
                    Soporte: {op.reference}
                  </div>
                )}
                <div className="text-[8px] text-indigo-600 font-black absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                  Ver detalle 🔍
                </div>
              </div>
            );
          })}

          {filteredOperations.length === 0 && (
            <div className="p-10 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-extrabold uppercase">Ninguna operación coincide con la búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: DETALLE DE TRANSACCIÓN EMERGENTE COMPACTO Y RESPONSIVO */}
      {selectedOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-[95%] max-w-md rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setSelectedOp(null)}
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="pb-3 border-b border-slate-100 mb-4 shrink-0 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-xs text-indigo-950 uppercase font-sans">
                  Detalle de Transacción
                </h3>
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Registro de Operación Auditable</span>
              </div>
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-bold">ID Transacción</span>
                  <span className="font-mono text-slate-700 font-bold">{selectedOp.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-bold">Fecha / Hora</span>
                  <span className="text-slate-700 font-black">{selectedOp.dateTime}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-bold">Tipo</span>
                  <span className="text-slate-700 font-black bg-slate-150 px-1.5 py-0.2 rounded text-[10px]">
                    {selectedOp.type}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-bold">Origen</span>
                  <span className="text-slate-700 font-black">{selectedOp.origin || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Destino</span>
                  <span className="text-slate-700 font-black">{selectedOp.destination || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-1">
                <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider block">Monto Transaccionado</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-black text-slate-800 font-sans">
                    {selectedOp.amountUsd ? `$${selectedOp.amountUsd.toFixed(2)} USD` : 'N/A'}
                  </span>
                  {selectedOp.amountUsd && (
                    <span className="text-xs font-bold text-slate-500">
                      Bs. {(selectedOp.amountUsd * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
                {selectedOp.kg && (
                  <div className="text-[10px] text-indigo-950 font-bold mt-1 bg-indigo-50/50 p-1.5 rounded border border-indigo-150">
                    Volumen Despachado: <strong className="text-indigo-800 font-sans">{selectedOp.kg} KG</strong>
                  </div>
                )}
                {selectedOp.reference && (
                  <div className="text-[10px] text-slate-500 font-bold mt-1">
                    Comprobante / Soporte: <strong className="text-slate-700">{selectedOp.reference}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1 pl-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nota de Operación</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-slate-700 leading-relaxed font-semibold">
                  {selectedOp.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex gap-2">
              <button 
                type="button" 
                onClick={() => exportTransactionPDF(selectedOp, tasaBcvUsd)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-97"
              >
                <FileText className="w-4 h-4" />
                <span>Guardar PDF</span>
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedOp(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SELECCIÓN DE RANGO DE HISTÓRICO PARA EXPORTAR EN PDF */}
      {showExportRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-[95%] max-w-md rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowExportRangeModal(false)}
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="pb-3 border-b border-slate-100 mb-4 shrink-0 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-xs text-indigo-950 uppercase font-sans">
                  Exportar Histórico
                </h3>
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Seleccione Rango de Fecha para el PDF</span>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Periodo de Transacciones</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Hoy', 'Ayer', 'Esta Semana', 'Semana Pasada', 'Este Mes', 'Este Año', 'Personalizado'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setExportRange(opt)}
                      className={`p-2.5 rounded-xl text-left font-black transition-all border ${
                        exportRange === opt
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs text-[10.5px]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-205 text-[10.5px]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {exportRange === 'Personalizado' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-205 rounded-xl animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Fecha Desde</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Fecha Hasta</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex gap-2">
              <button 
                type="button" 
                onClick={() => {
                  const filtered = filterByRange(operations, exportRange, customStartDate, customEndDate);
                  if (filtered.length === 0) {
                    alert('No se encontraron transacciones en el rango de fechas seleccionado.');
                    return;
                  }
                  
                  let label = exportRange;
                  if (exportRange === 'Personalizado') {
                    label = `Desde ${customStartDate || 'Inicio'} hasta ${customEndDate || 'Hoy'}`;
                  }
                  
                  exportOperationsHistoryPDF(filtered, label);
                  setShowExportRangeModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-97"
              >
                <FileText className="w-4 h-4" />
                <span>Generar PDF</span>
              </button>
              <button 
                type="button" 
                onClick={() => setShowExportRangeModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
