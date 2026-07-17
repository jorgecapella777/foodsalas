import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Settings, 
  X, 
  HelpCircle,
  FolderOpen,
  Info
} from 'lucide-react';
import { Product, InventoryMovement, Provider, ProviderStock } from '../types';

interface InventoryViewProps {
  products: Product[];
  providerStocks: ProviderStock[];
  movements: InventoryMovement[];
  providers: Provider[];
  tasaBcvUsd: number;
  onAddIncomingInventory: (
    prodName: string, 
    qtyKg: number, 
    providerId: string, 
    pricePaidUsd: number, 
    tasaApplied: number,
    customDate?: string
  ) => void;
  onManualInventoryAdjustment: (
    productId: string,
    qtyKg: number,
    type: 'ENTRADA' | 'SALIDA',
    motivo: string,
    providerId?: string,
    customDate?: string
  ) => void;
  onUpdateProductPrice: (productId: string, newPriceUsd: number) => void;
  onRegisterMerma: (
    productId: string, 
    quantityKg: number, 
    reason: string, 
    notes: string,
    providerId?: string,
    customDate?: string
  ) => void;
}

export default function InventoryView({
  products,
  providerStocks,
  movements,
  providers,
  tasaBcvUsd,
  onAddIncomingInventory,
  onManualInventoryAdjustment,
  onUpdateProductPrice,
  onRegisterMerma
}: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic controls
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showMermaModal, setShowMermaModal] = useState(false);

  // States for purchase incoming batch modal
  const [incomingProduct, setIncomingProduct] = useState('');
  const [incomingQty, setIncomingQty] = useState('');
  const [incomingProvider, setIncomingProvider] = useState('');
  const [incomingPrice, setIncomingPrice] = useState('');
  const [incomingTasa, setIncomingTasa] = useState(tasaBcvUsd.toString());
  const [incomingDate, setIncomingDate] = useState(new Date().toISOString().split('T')[0]);

  // States for manual adjustment modal (quantity and reason)
  const [adjustmentProductId, setAdjustmentProductId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentProviderId, setAdjustmentProviderId] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);

  // States for Merma registration modal
  const [mermaProductId, setMermaProductId] = useState('');
  const [mermaQty, setMermaQty] = useState('');
  const [mermaReason, setMermaReason] = useState('Evaporación');
  const [mermaNotes, setMermaNotes] = useState('');
  const [mermaProviderId, setMermaProviderId] = useState('');
  const [mermaDate, setMermaDate] = useState(new Date().toISOString().split('T')[0]);

  // Editing state for price
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  // Total stock aggregators
  const totalStockKg = products.reduce((acc, p) => acc + p.availableKg, 0);
  const criticalProducts = products.filter(p => p.availableKg <= 20.00);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit dynamic incoming inventory purchase form
  const handleExecuteIncoming = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(incomingQty) || 0;
    const price = parseFloat(incomingPrice) || 0;
    const tasa = parseFloat(incomingTasa) || tasaBcvUsd;
    
    if (!incomingProduct) return alert('Por favor escoja el rubro.');
    if (!incomingProvider) return alert('Por favor asigne un proveedor.');
    if (qty <= 0 || price <= 0) return alert('Cantidad y precio deben ser mayores a cero.');

    onAddIncomingInventory(incomingProduct, qty, incomingProvider, price, tasa, incomingDate);

    // Reset fields
    setIncomingProduct('');
    setIncomingQty('');
    setIncomingProvider('');
    setIncomingPrice('');
    setIncomingTasa(tasaBcvUsd.toString());
    setIncomingDate(new Date().toISOString().split('T')[0]);
    setShowIncomingModal(false);

    alert('Lote recibido y stock cargado con éxito.');
  };

  // Submit manual entry/exit adjustment with reason (motivo) and quantity
  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentProductId) return alert('Por favor seleccione el rubro a ajustar.');
    
    const qty = parseFloat(adjustmentQty) || 0;
    if (qty <= 0) return alert('La cantidad de kilos debe ser mayor a cero.');
    if (!adjustmentReason.trim()) return alert('Debe indicar el motivo o justificación de este ajuste manual.');

    const targetProduct = products.find(p => p.id === adjustmentProductId);
    if (!targetProduct) return alert('Producto no encontrado.');

    if (adjustmentType === 'SALIDA' && qty > targetProduct.availableKg) {
      return alert(`No es posible retirar ${qty} kg. El stock disponible actual de ${targetProduct.name} es de ${targetProduct.availableKg} kg.`);
    }

    onManualInventoryAdjustment(
      adjustmentProductId,
      qty,
      adjustmentType,
      adjustmentReason.trim(),
      adjustmentProviderId || undefined,
      adjustmentDate
    );

    // Reset states
    setAdjustmentProductId('');
    setAdjustmentQty('');
    setAdjustmentType('ENTRADA');
    setAdjustmentReason('');
    setAdjustmentProviderId('');
    setAdjustmentDate(new Date().toISOString().split('T')[0]);
    setShowAdjustmentModal(false);

    alert('Ajuste de inventario aplicado exitosamente.');
  };

  const handleExecuteMerma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mermaProductId) return alert('Por favor seleccione el rubro a reportar.');
    
    const qty = parseFloat(mermaQty) || 0;
    if (qty <= 0) return alert('La cantidad de kilos a mermar debe ser mayor a cero.');

    const targetProduct = products.find(p => p.id === mermaProductId);
    if (!targetProduct) return alert('Producto no encontrado.');

    if (qty > targetProduct.availableKg) {
      return alert(`No es posible mermar ${qty} kg. El stock disponible actual de ${targetProduct.name} es de ${targetProduct.availableKg} kg.`);
    }

    onRegisterMerma(
      mermaProductId,
      qty,
      mermaReason,
      mermaNotes.trim(),
      mermaProviderId || undefined,
      mermaDate
    );

    // Reset states
    setMermaProductId('');
    setMermaQty('');
    setMermaReason('Evaporación');
    setMermaNotes('');
    setMermaProviderId('');
    setMermaDate(new Date().toISOString().split('T')[0]);
    setShowMermaModal(false);

    alert('Merma registrada y stock restado de forma inmediata.');
  };

  return (
    <div className="space-y-4 fade-in pb-10" id="inventario-view-root">
      
      {/* Stock critical alarm box */}
      {criticalProducts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-950 shadow-xs" id="critical-inventory-alerts">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0 animate-pulse" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-900">Alerta de Existencia Crítica</h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Los siguientes rubros tienen existencias de pollo por debajo del límite sugerido (20 Kg):
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {criticalProducts.map(p => (
                <span key={p.id} className="bg-rose-100 text-rose-900 border border-rose-300 text-[9.5px] font-black px-2 py-0.5 rounded-lg shrink-0 uppercase">
                  {p.name}: {p.availableKg.toFixed(1)} KG restante
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Inventory summary card with actions */}
      <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-4 shadow-sm" id="inventario-totals-dashboard">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Inventario Físico en Cámara</span>
            <span className="text-3xl font-black text-slate-800 font-sans block leading-none">
              {totalStockKg.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} <span className="text-base font-normal text-slate-505 text-slate-500">KG</span>
            </span>
          </div>
          <Package className="w-8 h-8 text-indigo-600 opacity-20" />
        </div>

        {/* Operational buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100" id="inventario-quick-action-triggers">
          <button
            onClick={() => setShowIncomingModal(true)}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-colors active:scale-98 cursor-pointer flex flex-col justify-center items-center gap-1 shadow-xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recibir Lote</span>
          </button>
          
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-colors active:scale-98 cursor-pointer flex flex-col justify-center items-center gap-1 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>Ajustar Stock</span>
          </button>

          <button
            onClick={() => setShowMermaModal(true)}
            className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-colors active:scale-98 cursor-pointer flex flex-col justify-center items-center gap-1 shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
            <span>Registrar Merma</span>
          </button>
        </div>
      </div>

      {/* Interactive Products Detail List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Desglose Detallado por Rubro</h4>
          <span className="text-[8.5px] text-slate-400 font-black uppercase">Filtro de Cámara</span>
        </div>

        {/* Search tool */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Escriba rubro de pollo..."
            className="w-full bg-white border border-slate-205 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary font-bold text-slate-750"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Products layout grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="inventario-rubros-grid">
          {filteredProducts.map((p) => {
            const isCrit = p.availableKg <= 20.00;
            return (
              <div key={p.id} className={`bg-white border p-4 rounded-2xl flex flex-col gap-3 shadow-xs ${
                isCrit ? 'border-rose-250 bg-rose-50/10' : 'border-slate-150'
              }`}>
                <div className="flex gap-3.5 items-center justify-between">
                  {/* Graphics */}
                  <img 
                    src={p.imageUrl} 
                    alt={p.name} 
                    className="w-12 h-12 object-cover rounded-xl border border-slate-100 shrink-0" 
                    referrerPolicy="no-referrer"
                  />

                  {/* Info block */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none inline-block mb-1 ${
                      isCrit ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isCrit ? 'Límite Crítico' : 'Seguro'}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-800 truncate leading-tight font-sans">{p.name}</h4>
                  </div>

                  {/* Values stack */}
                  <div className="text-right shrink-0">
                    <span className="text-[8px] text-slate-400 uppercase font-black block">Existencia</span>
                    <span className="font-black text-sm text-slate-850 font-sans block mt-0.5">{p.availableKg.toFixed(1)} KG</span>
                  </div>
                </div>

                {/* BREAKDOWN BY PROVIDER (REQUISITO EXPLICITO) */}
                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Desglose por Proveedor</span>
                  <div className="flex flex-wrap gap-1.5">
                    {providerStocks.filter(ps => ps.productName === p.name && ps.availableKg > 0).length > 0 ? (
                      providerStocks
                        .filter(ps => ps.productName === p.name && ps.availableKg > 0)
                        .map(ps => (
                          <span key={ps.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-lg text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            {ps.providerName}: <strong className="text-slate-950 font-black">{ps.availableKg.toFixed(1)} KG</strong>
                          </span>
                        ))
                    ) : (
                      <span className="text-[8.5px] text-slate-450 font-semibold italic">Sin stock específico por proveedor.</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="p-10 text-center bg-white border border-slate-150 rounded-2xl col-span-full">
              <FolderOpen className="w-8 h-8 text-slate-350 mx-auto opacity-40 mb-2" />
              <p className="text-xs text-slate-400 font-extrabold uppercase">Ningún rubro coincide con el término de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Historial rápido de movimientos de inventario en curso */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden mt-2" id="inventario-flow-history">
        <div className="p-3 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
          <span className="text-[9px] text-slate-450 font-black tracking-wider uppercase">Movimientos de flujo recientes</span>
          <span className="text-[8.5px] bg-slate-205 text-slate-600 font-black px-1.5 py-0.3 rounded uppercase">Cámara</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto no-scrollbar">
          {movements.map((move) => {
            const isEn = move.type === 'ENTRADA';
            return (
              <div key={move.id} className="p-3 flex items-center justify-between text-xs font-semibold gap-3 hover:bg-slate-50/50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`p-1 rounded-lg ${isEn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isEn ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-805 text-slate-800 text-[11.5px] leading-tight block">{move.productName}</span>
                    <span className="text-[9px] text-slate-400 font-medium block uppercase tracking-wide">
                      {move.motivo ? `Ajuste: ${move.motivo}` : (isEn ? `Recibido de ${move.providerName || 'Proveedor'}` : `Venta / Despacho`)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-black text-xs block ${isEn ? 'text-emerald-600' : 'text-rose-650'}`}>
                    {isEn ? '+' : '-'}{move.quantityKg.toFixed(1)} KG
                  </span>
                  <span className="text-[9px] text-slate-350 block leading-none mt-0.5">{move.dateTime.split(',')[0]}</span>
                </div>
              </div>
            );
          })}

          {movements.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No hay registros de flujo aún.</p>
          )}
        </div>
      </div>

      {/* MODAL 1: RECIBIR LOTE PROVEEDOR */}
      {showIncomingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 text-on-surface">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative">
            <button 
              onClick={() => setShowIncomingModal(false)} 
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-400 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Recibir Despacho de Proveedor
              </h3>
            </div>

            <form onSubmit={handleExecuteIncoming} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Rubro de Pollo que Ingresa</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705"
                  value={incomingProduct}
                  onChange={(e) => setIncomingProduct(e.target.value)}
                  required
                >
                  <option value="">Seleccione el rubro comercial...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Proveedor Distribuidor</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705"
                  value={incomingProvider}
                  onChange={(e) => setIncomingProvider(e.target.value)}
                  required
                >
                  <option value="">Seleccione el remitente...</option>
                  {providers.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Cantidad (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-700"
                    placeholder="Kilos ingresando..."
                    value={incomingQty}
                    onChange={(e) => setIncomingQty(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Precio de Compra (Total Neto $ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-rose-700"
                    placeholder="Monto total del lote..."
                    value={incomingPrice}
                    onChange={(e) => setIncomingPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Tasa del Despacho (Bs./USD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold font-sans"
                  value={incomingTasa}
                  onChange={(e) => setIncomingTasa(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha del Despacho</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-705"
                  value={incomingDate}
                  onChange={(e) => setIncomingDate(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold pr-3 pl-3 py-3 rounded-xl text-xs uppercase tracking-wider shadow-xs transition-transform active:scale-98 cursor-pointer"
              >
                Cargar Despacho a Existencias
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AJUSTE ENTRADA/SALIDA MANUAL CON MOTIVO (REQUISITO EXPLICITO) */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 text-on-surface animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative">
            
            <button 
              onClick={() => setShowAdjustmentModal(false)}
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-400 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-slate-700" />
                Ajuste Manual de Mercancía
              </h3>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-4">
              
              {/* Product selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Par de Rubro a Ajustar</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705"
                  value={adjustmentProductId}
                  onChange={(e) => setAdjustmentProductId(e.target.value)}
                  required
                >
                  <option value="">Seleccione el rubro avícola...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock actual: {p.availableKg.toFixed(1)} kg)</option>
                  ))}
                </select>
              </div>

              {/* Adjustment type: Entry or Exit */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Flujo o Sentido de Operación</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border border-slate-205 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('ENTRADA')}
                    className={`py-2 text-[10.5px] font-black uppercase rounded-lg transition-all ${
                      adjustmentType === 'ENTRADA' 
                        ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-100' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    + Entrada Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('SALIDA')}
                    className={`py-2 text-[10.5px] font-black uppercase rounded-lg transition-all ${
                      adjustmentType === 'SALIDA' 
                        ? 'bg-white text-rose-700 shadow-2xs border border-rose-100' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    - Salida Manual
                  </button>
                </div>
              </div>

              {/* Kilos quantity */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Cantidad (Kilos a ajustar)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-700"
                    placeholder="Ej. 12.30"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(e.target.value)}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KG</span>
                </div>
              </div>

              {/* Provider assignment for adjustment */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Proveedor Asociado al Ajuste</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705"
                  value={adjustmentProviderId}
                  onChange={(e) => setAdjustmentProviderId(e.target.value)}
                  required
                >
                  <option value="">Seleccione el proveedor...</option>
                  {providers.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom Date for adjustment */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha del Ajuste</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-705"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  required
                />
              </div>

              {/* MOTIVO (Reason) (REQUISITO EXPLICITO) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Motivo / Explicación del Ajuste</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-700 placeholder-slate-400"
                  placeholder="Ej. Revisión trimestral, Merma por descarte físico, Corrección de peso..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  required
                />
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-lg text-[10px] text-indigo-900 font-medium flex gap-1.5">
                <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <span>Esta acción modificará directamente el inventario físico en cámara de manera inmediata.</span>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 border border-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider"
              >
                Aplicar Ajuste Físico
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MERMA */}
      {showMermaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative text-slate-800">
            
            <button 
              type="button"
              onClick={() => setShowMermaModal(false)} 
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-xs text-amber-950 uppercase flex items-center gap-1.5 font-sans">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
                Registrar Merma de Rubro
              </h3>
            </div>

            <form onSubmit={handleExecuteMerma} className="space-y-4">
              {/* Product selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Rubro a Registrar Merma *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-700 outline-hidden"
                  value={mermaProductId}
                  onChange={(e) => setMermaProductId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Rubro --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Disponible: {p.availableKg.toFixed(1)} kg)</option>
                  ))}
                </select>
              </div>

              {/* Kilos quantity */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Cantidad Perdida (Kilos) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-700"
                    placeholder="Ej. 3.50"
                    value={mermaQty}
                    onChange={(e) => setMermaQty(e.target.value)}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KG</span>
                </div>
              </div>

              {/* Motivos sugeridos por Gemini */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Motivo / Causa de la Merma *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-700 outline-hidden"
                  value={mermaReason}
                  onChange={(e) => setMermaReason(e.target.value)}
                  required
                >
                  <option value="Evaporación">Evaporación (Deshidratación natural)</option>
                  <option value="Goteo">Goteo (Pérdida de líquidos/hielo)</option>
                  <option value="Recortes">Recortes / Deshuesado de piezas</option>
                  <option value="Daño">Daño físico / Rotura de empaque</option>
                  <option value="Inventario no registrado">Diferencia de pesaje inicial</option>
                  <option value="Vencimiento">Descomposición / Vencimiento</option>
                  <option value="Otros">Otros motivos de descarte</option>
                </select>
              </div>

              {/* Provider for Merma */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Proveedor del Lote Mermado *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705"
                  value={mermaProviderId}
                  onChange={(e) => setMermaProviderId(e.target.value)}
                  required
                >
                  <option value="">Seleccione el proveedor...</option>
                  {providers.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom date for Merma */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha de Merma *</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-705"
                  value={mermaDate}
                  onChange={(e) => setMermaDate(e.target.value)}
                  required
                />
              </div>

              {/* Additional notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Observaciones Detalladas (Opcional)</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-700 placeholder-slate-400"
                  placeholder="Ej. Deshidratación excesiva por falla temporal de refrigeración..."
                  value={mermaNotes}
                  onChange={(e) => setMermaNotes(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[10px] text-amber-900 font-medium flex gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Esta acción restará inmediatamente los KG del stock disponible e imputará la pérdida a balances.</span>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 border border-amber-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider"
              >
                Registrar Merma Física
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
