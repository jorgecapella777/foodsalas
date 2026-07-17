import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  Plus, 
  Calendar, 
  TrendingUp, 
  CreditCard,
  X,
  PlusCircle,
  Truck,
  DollarSign,
  Info,
  History,
  CheckCircle,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { Provider, Product, HistoricalOperation, ProviderPayment } from '../types';

interface ProveedoresViewProps {
  providers: Provider[];
  products: Product[];
  tasaBcvUsd: number;
  historicalOperations: HistoricalOperation[];
  providerPayments: ProviderPayment[];
  onAddProvider: (name: string, phone: string, productsBought: string[], initialOwed: number, dueDate: string) => void;
  onRegisterPurchase: (
    providerId: string, 
    productName: string, 
    kg: number, 
    totalCostUsd: number, 
    applyPaymentNow: boolean,
    paymentMethod?: string,
    reference?: string
  ) => void;
  onPayProvider: (
    providerId: string, 
    amount: number, 
    method?: string, 
    reference?: string, 
    customDate?: string, 
    productName?: string
  ) => void;
}

export default function ProveedoresView({
  providers,
  products,
  tasaBcvUsd,
  historicalOperations,
  providerPayments,
  onAddProvider,
  onRegisterPurchase,
  onPayProvider,
}: ProveedoresViewProps) {
  // Estados para añadir Proveedor
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newProducts, setNewProducts] = useState<string[]>([]);
  const [newOwed, setNewOwed] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Estados para Registrar Compra a Proveedor
  const [selectedProviderForPurchase, setSelectedProviderForPurchase] = useState<Provider | null>(null);
  const [purchaseProduct, setPurchaseProduct] = useState('');
  const [newPurchaseProductName, setNewPurchaseProductName] = useState('');
  const [purchaseKg, setPurchaseKg] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [payImmediately, setPayImmediately] = useState(false);
  
  // New transaction fields for purchase
  const [purchaseMethod, setPurchaseMethod] = useState('Efectivo');
  const [purchaseReference, setPurchaseReference] = useState('');

  // Estados para Realizar Pago de Deuda
  const [selectedProviderForPayment, setSelectedProviderForPayment] = useState<Provider | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProduct, setPaymentProduct] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (selectedProviderForPayment) {
      const provProducts = selectedProviderForPayment.productsBought || [];
      if (provProducts.length > 0) {
        setPaymentProduct(provProducts[0]);
      } else if (products && products.length > 0) {
        setPaymentProduct(products[0].name);
      } else {
        setPaymentProduct('');
      }
    } else {
      setPaymentProduct('');
    }
  }, [selectedProviderForPayment, products]);

  // Estado para Historial de Proveedor
  const [selectedProviderForHistory, setSelectedProviderForHistory] = useState<Provider | null>(null);

  // Cálculos consolidados
  const totalOwedAllProviders = providers.reduce((acc, p) => acc + p.totalOwedUsd, 0);

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Nombre y número de contacto son requeridos');
      return;
    }
    const owedNum = parseFloat(newOwed) || 0;
    const finalDate = newDueDate || 'Solvente';
    onAddProvider(newName.trim(), newPhone.trim(), newProducts, owedNum, finalDate);
    
    // Resetear formulario
    setNewName('');
    setNewPhone('');
    setNewProducts([]);
    setNewOwed('');
    setNewDueDate('');
    setShowAddForm(false);
  };

  const handleExecutePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderForPurchase) return;
    const kgNum = parseFloat(purchaseKg) || 0;
    const priceNum = parseFloat(purchasePrice) || 0;
    
    let prodName = purchaseProduct;
    if (purchaseProduct === '__NEW__') {
      if (!newPurchaseProductName.trim()) {
        alert('Por favor ingrese el nombre del nuevo rubro comercial.');
        return;
      }
      prodName = newPurchaseProductName.trim();
    } else if (!prodName) {
      prodName = products[0] ? products[0].name : 'Pollo Entero';
    }

    if (kgNum <= 0 || priceNum <= 0) {
      alert('Por favor ingrese cantidad y precio mayores que cero.');
      return;
    }

    onRegisterPurchase(
      selectedProviderForPurchase.id, 
      prodName, 
      kgNum, 
      priceNum, 
      payImmediately,
      payImmediately ? purchaseMethod : undefined,
      payImmediately ? purchaseReference : undefined
    );

    setSelectedProviderForPurchase(null);
    setPurchaseKg('');
    setPurchasePrice('');
    setPurchaseProduct('');
    setNewPurchaseProductName('');
    setPayImmediately(false);
    setPurchaseMethod('Efectivo');
    setPurchaseReference('');

    alert('Compra y mercancía despachadas en inventario con éxito.');
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderForPayment) return;
    const payNum = parseFloat(paymentAmount) || 0;

    if (payNum <= 0) {
      alert('Por favor ingrese un monto a abonar válido.');
      return;
    }

    onPayProvider(
      selectedProviderForPayment.id, 
      payNum, 
      paymentMethod, 
      paymentReference, 
      paymentDate, 
      paymentProduct || 'Abono Deuda Genérico'
    );

    setSelectedProviderForPayment(null);
    setPaymentAmount('');
    setPaymentMethod('Efectivo');
    setPaymentReference('');
    setPaymentProduct('');

    alert('Deuda amortizada con éxito.');
  };

  const toggleProductTag = (pName: string) => {
    if (newProducts.includes(pName)) {
      setNewProducts(prev => prev.filter(p => p !== pName));
    } else {
      setNewProducts(prev => [...prev, pName]);
    }
  };

  return (
    <div className="space-y-4 fade-in pb-10" id="proveedores-view-root">
      
      {/* Resumen Deuda Proveedores */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total por Pagar Proveedores</p>
          <p className="text-2xl font-black text-rose-600 font-sans leading-none">
            ${totalOwedAllProviders.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block">
            Equivalente: Bs. {(totalOwedAllProviders * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })} VES
          </span>
        </div>
        
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-3.5 rounded-xl text-xs uppercase tracking-wider shadow-xs transition-transform active:scale-97 cursor-pointer"
        >
          + Proveedor
        </button>
      </div>

      {/* Formulario Añadir Proveedor */}
      {showAddForm && (
        <form onSubmit={handleCreateProvider} className="bg-white p-5 rounded-3xl border border-slate-205 space-y-4 shadow-md text-slate-800">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Truck className="w-4 h-4 text-indigo-600" />
              Nuevo Distribuidor / Proveedor
            </h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-100 hover:bg-slate-200 p-1 rounded-full text-slate-550">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre / Razón Social</label>
              <input 
                type="text" 
                placeholder="Ej. Avícola Mayorista Del Centro"
                className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold outline-hidden"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Teléfono de Enlace</label>
              <input 
                type="tel" 
                placeholder="Ej. +58414999999"
                className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold outline-hidden"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Rubros Avícolas Pautados</label>
              <div className="flex flex-wrap gap-1">
                {products.map(p => {
                  const isSelected = newProducts.includes(p.name);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProductTag(p.name)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all tracking-wide border ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                          : 'bg-white border-slate-202 text-slate-600 hover:border-slate-350'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Deuda Inicial ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold"
                  value={newOwed}
                  onChange={(e) => setNewOwed(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Plazo de Vencimiento</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs font-bold text-slate-505 text-slate-500 py-2 px-3 hover:underline">
              Cancelar
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs">
              Registrar Proveedor
            </button>
          </div>
        </form>
      )}

      {/* Lista de Proveedores */}
      <div className="space-y-4" id="providers-list-cards-root">
        {providers.map((p) => {
          const hasOwed = p.totalOwedUsd > 0;
          const waLink = `https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`;
          const telLink = `tel:${p.phone}`;

          return (
            <div key={p.id} className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-3.5 shadow-xs transition-colors hover:border-slate-300">
              
              {/* Header card info */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 font-sans leading-snug">{p.name}</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Telf: {p.phone}</span>
                </div>
                
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                  hasOwed ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                }`}>
                  {hasOwed ? 'Con Factura Pendiente' : 'Solvente'}
                </span>
              </div>

              {/* Rubros que comercializa */}
              <div className="flex flex-wrap gap-1">
                {p.productsBought.map((prod, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 text-[8.5px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg border border-slate-152">
                    {prod}
                  </span>
                ))}
              </div>

              {/* Puntos financieros */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold font-sans">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block mb-0.5">Monto de Deuda</span>
                  <span className={`text-sm font-black ${hasOwed ? 'text-rose-600' : 'text-slate-500'}`}>
                    ${p.totalOwedUsd.toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block mb-0.5">Límite de Liquidación</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {p.paymentDueDate}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-0.5 pt-0.5">
                <span>Total Compras Acumulado:</span>
                <strong className="text-slate-700 font-sans">${p.totalPaidUsd.toLocaleString('es-VE')} USD</strong>
              </div>

              {/* Último abono con rubro especificado */}
              {(() => {
                const lastPay = providerPayments.find(pay => pay.providerId === p.id);
                if (!lastPay) return null;
                return (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-2.5 mt-1.5 text-[10.5px] space-y-0.5 text-slate-600 font-semibold leading-none">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Último abono:</span>
                      <strong className="text-emerald-700">${lastPay.amountUsd.toFixed(2)} USD</strong>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-slate-400 font-medium">Rubro cancelado:</span>
                      <strong className="text-indigo-950 uppercase text-[9px] font-black">{lastPay.productName || 'General'}</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive buttons block */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                {/* Whatsapp link */}
                <a 
                  href={waLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all font-bold"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span className="text-[8px] uppercase mt-1">WhatsApp</span>
                </a>

                {/* Call direct */}
                <a 
                  href={telLink}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-blue-50 hover:bg-blue-105 hover:bg-blue-100 text-blue-700 rounded-xl transition-all font-bold"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-[8px] uppercase mt-1">Llamar</span>
                </a>

                {/* REGISTRAR COMPRA (REQUISITO EXPLICITO) */}
                <button 
                  onClick={() => setSelectedProviderForPurchase(p)}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-805 text-indigo-800 rounded-xl transition-all font-black cursor-pointer text-center"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span className="text-[8px] mt-1 uppercase leading-none">Registrar Compra</span>
                </button>

                {/* ABONAR PAGO DE DEUDA (REQUISITO EXPLICITO) */}
                <button 
                  onClick={() => setSelectedProviderForPayment(p)}
                  disabled={p.totalOwedUsd <= 0}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-rose-50 hover:bg-rose-100/80 text-rose-750 text-rose-700 rounded-xl disabled:opacity-30 disabled:hover:bg-rose-50 disabled:hover:text-rose-700 transition-all font-black cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  <span className="text-[7.5px] mt-1 uppercase text-center leading-none">Abonar Deuda</span>
                </button>
              </div>

              {/* Botón de Historial de Transacciones de Proveedor */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedProviderForHistory(p)}
                  className="w-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 transition-all py-2 px-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60 active:scale-98"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  Ver Historial de Despachos y Pagos
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL 1: REGISTRAR COMPRA A PROVEEDOR (IMPACTA STOCK) */}
      {selectedProviderForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 text-on-surface">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedProviderForPurchase(null)}
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-400 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-3 shrink-0">
              <h3 className="font-extrabold text-sm text-slate-850 uppercase flex items-center gap-1.5 font-sans">
                <Truck className="w-5 h-5 text-indigo-600" />
                Registrar Despacho
              </h3>
            </div>

            <p className="text-[11px] text-slate-500 mb-4 font-semibold shrink-0">
              Especifique los kilos que están ingresando al inventario despachados por <strong className="text-slate-800">{selectedProviderForPurchase.name}</strong>.
            </p>

            <form onSubmit={handleExecutePurchase} className="flex-1 flex flex-col min-h-0">
              <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 no-scrollbar pb-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Rubro Comercial</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold"
                    value={purchaseProduct}
                    onChange={(e) => setPurchaseProduct(e.target.value)}
                    required
                  >
                    <option value="">Seleccione el rubro comercial...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    <option value="__NEW__" className="text-emerald-600 font-bold">+ REGISTRAR NUEVO RUBRO...</option>
                  </select>
                </div>

                {purchaseProduct === '__NEW__' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[10px] font-bold text-emerald-700 uppercase">Nombre del Nuevo Rubro</label>
                    <input 
                      type="text" 
                      className="w-full bg-emerald-50/50 border border-emerald-200 p-2.5 rounded-xl text-xs font-bold text-emerald-900 placeholder-emerald-600/50 outline-hidden"
                      value={newPurchaseProductName}
                      onChange={(e) => setNewPurchaseProductName(e.target.value)}
                      placeholder="Ej. Alas de Pollo, Chuleta, etc."
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Cantidad (KG)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-black" 
                      value={purchaseKg} 
                      onChange={(e) => setPurchaseKg(e.target.value)}
                      placeholder="0.00 kg" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Precio de Compra (Total Neto $ USD)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-black" 
                      value={purchasePrice} 
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="Ej. 150.00" 
                      required 
                    />
                  </div>
                </div>

                {/* PAYMENT NOW SECTION - CONTADO O CRÉDITO WITH BANK REF */}
                <div className="bg-slate-50 p-2.5 border border-slate-202 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="payImmediatelyCheck" 
                      className="w-4 h-4 cursor-pointer"
                      checked={payImmediately}
                      onChange={(e) => setPayImmediately(e.target.checked)}
                    />
                    <label htmlFor="payImmediatelyCheck" className="text-[10px] font-black text-slate-700 cursor-pointer uppercase select-none">
                      Pagar de Contado (Pago Inmediato)
                    </label>
                  </div>

                  {payImmediately && (
                    <div className="space-y-2 pt-1 border-t border-slate-200 animate-fade-in">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-indigo-900 uppercase">Método del Desembolso</label>
                        <select
                          className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold text-indigo-955"
                          value={purchaseMethod}
                          onChange={(e) => setPurchaseMethod(e.target.value)}
                        >
                          <option value="Efectivo">Efectivo (USD / VES)</option>
                          <option value="Divisas">Divisas (Dólar Billete)</option>
                          <option value="Transferencia">Transferencia Bancaria</option>
                          <option value="Pago Móvil">Pago Móvil</option>
                          <option value="Otro">Otro Método</option>
                        </select>
                      </div>

                      {purchaseMethod !== 'Efectivo' && purchaseMethod !== 'Divisas' && (
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Código / Referencia Bancaria</label>
                          <input
                            type="text"
                            placeholder="Ref. No o comprobante..."
                            className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs"
                            value={purchaseReference}
                            onChange={(e) => setPurchaseReference(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex gap-2 shrink-0">
                <button type="button" onClick={() => setSelectedProviderForPurchase(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg text-xs font-bold text-slate-500">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-bold shadow-xs">
                  Cargar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ABONAR PAGO DE DEUDA AL PROVEEDOR */}
      {selectedProviderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 text-on-surface">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative text-slate-800 flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedProviderForPayment(null)}
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-400 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-3_5 shrink-0">
              <h3 className="font-extrabold text-sm text-slate-850 uppercase flex items-center gap-1.5 font-sans">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Abonar pago de deuda
              </h3>
            </div>

            <form onSubmit={handleExecutePayment} className="flex-1 flex flex-col min-h-0">
              <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 no-scrollbar pb-2">
                <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase block">Proveedor Destinatario</span>
                  <span className="text-slate-800 font-sans block">{selectedProviderForPayment.name}</span>
                  <span className="text-rose-600 block mt-0.5">Saldo pendiente: ${selectedProviderForPayment.totalOwedUsd.toFixed(2)} USD</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto a Amortizar ($ USD)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-sm font-black text-slate-850 outline-hidden" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00 $" 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Vía / Canal de Pago</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Divisas">Divisas (Dólar Billete)</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Otro">Otro Método</option>
                  </select>
                </div>

                {/* Rubro / Producto que está abonando */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Rubro que está abonando</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold text-slate-705 focus:outline-hidden"
                    value={paymentProduct}
                    onChange={(e) => setPaymentProduct(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione rubro --</option>
                    {/* Rubros de este proveedor */}
                    {selectedProviderForPayment.productsBought && selectedProviderForPayment.productsBought.map((p, idx) => (
                      <option key={`prov-bought-${idx}`} value={p}>
                        {p} (Suministrado)
                      </option>
                    ))}
                    {/* Todos los demás del catálogo */}
                    {products && products.map(p => p.name).filter(name => {
                      const boughtList = selectedProviderForPayment.productsBought || [];
                      return !boughtList.includes(name);
                    }).map((pName, idx) => (
                      <option key={`catalog-p-${idx}`} value={pName}>
                        {pName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha de Abono */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha del Abono</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-black text-slate-705"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                {paymentMethod !== 'Efectivo' && paymentMethod !== 'Divisas' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Datos de Referencia u Operación</label>
                    <input
                      type="text"
                      placeholder="Referencia o notas bancarias..."
                      className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2 shrink-0">
                <button type="button" onClick={() => setSelectedProviderForPayment(null)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold shadow-xs">
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXPEDIENTE E HISTORIAL DE TRANSACCIONES DE PROVEEDOR */}
      {selectedProviderForHistory && (() => {
        const name = selectedProviderForHistory.name.toLowerCase();
        
        // Filter operations matching provider name
        const ops = historicalOperations.filter(op => {
          const desc = op.description.toLowerCase();
          return op.destination?.toLowerCase() === name || op.origin?.toLowerCase() === name || desc.includes(name);
        });

        // Filter payments
        const pays = providerPayments.filter(p => p.providerId === selectedProviderForHistory.id);

        const purchaseOps = ops.filter(op => op.description.toLowerCase().includes('despacho') || op.description.toLowerCase().includes('compra') || op.description.toLowerCase().includes('lote') || op.type === 'PROVIDER_PAYMENT');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white w-[95%] max-w-lg md:max-w-md rounded-2xl overflow-hidden p-5 md:p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[90vh]">
              
              <button 
                type="button"
                onClick={() => setSelectedProviderForHistory(null)} 
                className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pb-3 border-b border-slate-100 mb-4 shrink-0">
                <h3 className="font-extrabold text-xs text-indigo-950 uppercase flex items-center gap-1.5 font-sans">
                  <History className="w-5 h-5 text-indigo-600" />
                  Expediente de Proveedor: {selectedProviderForHistory.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">Trazabilidad de Abastecimiento y Desembolsos</span>
              </div>

              {/* Scrollable Container */}
              <div className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1">
                
                {/* 1. Indicadores Operativos */}
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2">
                  <h4 className="text-[9.5px] font-black text-indigo-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Resumen Financiero del Proveedor
                  </h4>

                  <div className="grid grid-cols-3 gap-1.5 text-xs font-bold text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Despachos</span>
                      <strong className="text-indigo-950 text-xs block font-sans">{purchaseOps.length} lotes</strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Monto Deuda</span>
                      <strong className={`text-xs block font-sans ${selectedProviderForHistory.totalOwedUsd > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        ${selectedProviderForHistory.totalOwedUsd.toFixed(2)}
                      </strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Total Pagos</span>
                      <strong className="text-emerald-700 text-xs block font-sans">
                        ${selectedProviderForHistory.totalPaidUsd.toFixed(1)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Historial de Despachos */}
                <div className="space-y-2">
                  <h4 className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1 pl-0.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                    Lotes y Despachos Recibidos
                  </h4>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                    {purchaseOps.map((op) => (
                      <div key={op.id} className="text-[11px] font-semibold text-slate-650 flex justify-between gap-3 border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-slate-800 font-extrabold truncate">{op.description.split(':').slice(1).join(':').split('(')[0].trim() || op.description}</p>
                          <span className="text-[9px] text-slate-400 font-medium block">{op.dateTime}</span>
                        </div>
                        <span className="font-extrabold text-slate-750 font-sans text-right shrink-0">
                          {op.kg ? `${op.kg.toFixed(1)} KG` : ''}
                          <span className="block text-[9.5px] text-slate-450 font-medium">${op.amountUsd.toFixed(2)}</span>
                        </span>
                      </div>
                    ))}
                    {purchaseOps.length === 0 && (
                      <p className="text-[10.5px] text-slate-400 text-center py-4 font-bold uppercase">No hay despachos registrados aún</p>
                    )}
                  </div>
                </div>

                {/* 3. Pagos y Abonos Realizados */}
                <div className="space-y-2">
                  <h4 className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1 pl-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    Abonos y Pagos de Factura Realizados
                  </h4>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                    {pays.map((p) => (
                      <div key={p.id} className="text-[11px] font-semibold text-slate-650 flex justify-between gap-3 border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-slate-800 font-extrabold flex items-center gap-1.5 flex-wrap">
                            <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black px-1.5 py-0.3 rounded border border-emerald-200 uppercase">Abono Rubro</span>
                            <span className="text-indigo-950 uppercase text-[9.5px] font-black">{p.productName || 'General'}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Canal: {p.paymentMethod} {p.reference ? `(Ref: ${p.reference})` : ''}</p>
                          <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{p.dateTime}</span>
                        </div>
                        <strong className="text-emerald-700 font-sans text-right shrink-0 font-black">+${p.amountUsd.toFixed(2)}</strong>
                      </div>
                    ))}
                    {pays.length === 0 && (
                      <p className="text-[10.5px] text-slate-400 text-center py-4 font-bold uppercase">No hay pagos registrados aún</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex justify-between items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    import('../utils/pdfGenerator').then(module => {
                      module.exportProviderExpedientePDF(
                        selectedProviderForHistory,
                        { 
                          purchaseCount: purchaseOps.length, 
                          totalOwed: selectedProviderForHistory.totalOwedUsd, 
                          totalPaid: selectedProviderForHistory.totalPaidUsd 
                        },
                        purchaseOps,
                        pays
                      );
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] md:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-97"
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setSelectedProviderForHistory(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] md:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
