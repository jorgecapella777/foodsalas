import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Layers, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Info,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { Client, Provider, Product, ClientPayment, ProviderPayment, ProviderStock, HistoricalOperation } from '../types';
import PinConfirmModal from './PinConfirmModal';

interface PagosViewProps {
  clients: Client[];
  providers: Provider[];
  products: Product[];
  providerStocks: ProviderStock[];
  clientPayments: ClientPayment[];
  providerPayments: ProviderPayment[];
  tasaBcvUsd: number;
  historicalOperations?: HistoricalOperation[];
  onRegisterClientSale: (
    clientId: string,
    productId: string,
    qtyKg: number,
    priceUsd: number,
    type: 'CONTADO' | 'CRÉDITO',
    paymentMethod: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro',
    reference: string,
    schedule: 'Semanal' | 'Quincenal' | 'Completo' | 'N/A',
    partialAmountPaid: number, // 0 if none
    providerId?: string,
    customDate?: string
  ) => void;
  onRegisterProviderPayment: (
    providerId: string,
    paymentMethod: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro',
    reference: string,
    amountUsd: number,
    date: string,
    productName: string
  ) => void;
  onEditClientPayment?: (id: string, updatedFields: Partial<ClientPayment>) => void;
  onDeleteClientPayment?: (id: string) => void;
  onEditProviderPayment?: (id: string, updatedFields: Partial<ProviderPayment>) => void;
  onDeleteProviderPayment?: (id: string) => void;
}

export default function PagosView({
  clients,
  providers,
  products,
  providerStocks,
  clientPayments,
  providerPayments,
  tasaBcvUsd,
  historicalOperations,
  onRegisterClientSale,
  onRegisterProviderPayment,
  onEditClientPayment,
  onDeleteClientPayment,
  onEditProviderPayment,
  onDeleteProviderPayment
}: PagosViewProps) {
  
  const [activeForm, setActiveForm] = useState<'CLIENTE' | 'PROVEEDOR'>('CLIENTE');

  // Calcular deudas en kilos
  const getClientOwedKg = (client: Client) => {
    if (client.balanceUsd <= 0) return 0;
    const clientSales = (historicalOperations || []).filter(op => {
      const nameMatch = op.destination?.toLowerCase() === client.name.toLowerCase() || 
                        op.origin?.toLowerCase() === client.name.toLowerCase() || 
                        op.description.toLowerCase().includes(client.name.toLowerCase());
      const isSale = op.description.toLowerCase().includes('venta') && op.kg !== undefined && op.kg > 0;
      return nameMatch && isSale;
    });

    if (clientSales.length === 0) {
      const avgProductPrice = products && products.length > 0
        ? products.reduce((sum, p) => sum + p.priceUsd, 0) / products.length
        : 6.0; // Precio de referencia por kg
      return client.balanceUsd / avgProductPrice;
    }

    const totalSalesUsd = clientSales.reduce((sum, op) => sum + (op.amountUsd || 0), 0);
    const totalSalesKg = clientSales.reduce((sum, op) => sum + (op.kg || 0), 0);

    if (totalSalesUsd > 0 && totalSalesKg > 0) {
      return client.balanceUsd / (totalSalesUsd / totalSalesKg);
    }
    return 0;
  };

  // Edit Client Payment States
  const [editingClientPayment, setEditingClientPayment] = useState<ClientPayment | null>(null);
  const [editCPMethod, setEditCPMethod] = useState<'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro'>('Efectivo');
  const [editCPReference, setEditCPReference] = useState('');
  const [editCPAmount, setEditCPAmount] = useState('');

  // Edit Provider Payment States
  const [editingProviderPayment, setEditingProviderPayment] = useState<ProviderPayment | null>(null);
  const [editPPMethod, setEditPPMethod] = useState('');
  const [editPPReference, setEditPPReference] = useState('');
  const [editPPAmount, setEditPPAmount] = useState('');

  // Security pin states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalTitle, setPinModalTitle] = useState('');
  const [pinModalMessage, setPinModalMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit_cp' | 'delete_cp' | 'edit_pp' | 'delete_pp';
    targetId: string;
    payload?: any;
  } | null>(null);

  const handleStartEditCP = (cp: ClientPayment) => {
    setEditingClientPayment(cp);
    setEditCPMethod(cp.paymentMethod as any);
    setEditCPReference(cp.reference || '');
    setEditCPAmount(cp.amountUsd.toString());
  };

  const handleSaveEditCP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientPayment || !onEditClientPayment) return;
    setPendingAction({
      type: 'edit_cp',
      targetId: editingClientPayment.id,
      payload: {
        paymentMethod: editCPMethod,
        reference: editCPReference.trim() || undefined,
        amountUsd: parseFloat(editCPAmount) || 0
      }
    });
    setPinModalTitle('Confirmar Modificación');
    setPinModalMessage(`¿Está seguro de que desea modificar este cobro de cliente? Se requerirá PIN de seguridad.`);
    setPinModalOpen(true);
  };

  const handleStartDeleteCP = (cp: ClientPayment) => {
    if (!onDeleteClientPayment) return;
    setPendingAction({
      type: 'delete_cp',
      targetId: cp.id
    });
    setPinModalTitle('Confirmar Eliminación');
    setPinModalMessage(`¿Está seguro de que desea eliminar este cobro de la base de datos por completo? Se requerirá PIN de seguridad.`);
    setPinModalOpen(true);
  };

  const handleStartEditPP = (pp: ProviderPayment) => {
    setEditingProviderPayment(pp);
    setEditPPMethod(pp.paymentMethod || 'Efectivo');
    setEditPPReference(pp.reference || '');
    setEditPPAmount(pp.amountUsd.toString());
  };

  const handleSaveEditPP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProviderPayment || !onEditProviderPayment) return;
    setPendingAction({
      type: 'edit_pp',
      targetId: editingProviderPayment.id,
      payload: {
        paymentMethod: editPPMethod,
        reference: editPPReference.trim() || undefined,
        amountUsd: parseFloat(editPPAmount) || 0
      }
    });
    setPinModalTitle('Confirmar Modificación');
    setPinModalMessage(`¿Está seguro de que desea modificar este pago a proveedor? Se requerirá PIN de seguridad.`);
    setPinModalOpen(true);
  };

  const handleStartDeletePP = (pp: ProviderPayment) => {
    if (!onDeleteProviderPayment) return;
    setPendingAction({
      type: 'delete_pp',
      targetId: pp.id
    });
    setPinModalTitle('Confirmar Eliminación');
    setPinModalMessage(`¿Está seguro de que desea eliminar este pago de la base de datos por completo? Se requerirá PIN de seguridad.`);
    setPinModalOpen(true);
  };

  const handleExecutePendingAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'edit_cp' && onEditClientPayment) {
      onEditClientPayment(pendingAction.targetId, pendingAction.payload);
      setEditingClientPayment(null);
      alert('Cobro de cliente modificado con éxito.');
    } else if (pendingAction.type === 'delete_cp' && onDeleteClientPayment) {
      onDeleteClientPayment(pendingAction.targetId);
      alert('Cobro de cliente eliminado con éxito.');
    } else if (pendingAction.type === 'edit_pp' && onEditProviderPayment) {
      onEditProviderPayment(pendingAction.targetId, pendingAction.payload);
      setEditingProviderPayment(null);
      alert('Pago a proveedor modificado con éxito.');
    } else if (pendingAction.type === 'delete_pp' && onDeleteProviderPayment) {
      onDeleteProviderPayment(pendingAction.targetId);
      alert('Pago a proveedor eliminado con éxito.');
    }

    setPinModalOpen(false);
    setPendingAction(null);
  };

  // CLIENT FORM STATES
  const [clientId, setClientId] = useState('');
  const [productId, setProductId] = useState('');
  const [priceEstablishedUsd, setPriceEstablishedUsd] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [purchaseType, setPurchaseType] = useState<'CONTADO' | 'CRÉDITO'>('CONTADO');
  const [clientProviderId, setClientProviderId] = useState('');
  const [clientDate, setClientDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Contado states
  const [clientMethod, setClientMethod] = useState<'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro'>('Efectivo');
  const [clientReference, setClientReference] = useState('');

  // Crédito states
  const [creditSchedule, setCreditSchedule] = useState<'Semanal' | 'Quincenal' | 'Completo'>('Semanal');
  const [hasPartialPaymentOverCredit, setHasPartialPaymentOverCredit] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');

  // PROVIDER FORM STATES
  const [providerId, setProviderId] = useState('');
  const [providerMethod, setProviderMethod] = useState<'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro'>('Transferencia');
  const [providerReference, setProviderReference] = useState('');
  const [providerAmount, setProviderAmount] = useState('');
  const [providerDate, setProviderDate] = useState(new Date().toISOString().split('T')[0]);
  const [providerProductName, setProviderProductName] = useState('');

  // Handle product selection to prefill price
  const handleProductSelect = (id: string) => {
    setProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setPriceEstablishedUsd(prod.priceUsd.toString());
    }
  };

  // Submit client payment/sale
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return alert('Por favor seleccione el comprador.');
    if (!productId) return alert('Por favor seleccione el rubro a comprar.');
    
    const qty = parseFloat(quantityKg);
    const price = parseFloat(priceEstablishedUsd);
    
    if (isNaN(qty) || qty <= 0) return alert('Por favor indique una cantidad de kilos válida.');
    if (isNaN(price) || price <= 0) return alert('Por favor indique un precio establecido válido.');

    let partialPaid = 0;
    if (purchaseType === 'CRÉDITO' && hasPartialPaymentOverCredit) {
      partialPaid = parseFloat(partialPaymentAmount) || 0;
      if (partialPaid < 0) return alert('El monto a abonar no puede ser negativo.');
      const totalCost = qty * price;
      if (partialPaid > totalCost) {
        return alert(`El abono parcial ($${partialPaid}) no puede ser mayor que el costo total de la venta ($${totalCost.toFixed(2)}).`);
      }
    }

    // Method to pass:
    const finalMethod = purchaseType === 'CONTADO' ? clientMethod : 'Efectivo';
    const finalRef = purchaseType === 'CONTADO' ? (clientMethod === 'Efectivo' || clientMethod === 'Divisas' ? '' : clientReference) : '';
    const finalSchedule = purchaseType === 'CRÉDITO' ? creditSchedule : 'N/A';

    onRegisterClientSale(
      clientId,
      productId,
      qty,
      price,
      purchaseType,
      finalMethod,
      finalRef,
      finalSchedule,
      partialPaid,
      clientProviderId || undefined,
      clientDate
    );

    // Reset client form
    setClientId('');
    setProductId('');
    setPriceEstablishedUsd('');
    setQuantityKg('');
    setPurchaseType('CONTADO');
    setClientMethod('Efectivo');
    setClientReference('');
    setCreditSchedule('Semanal');
    setHasPartialPaymentOverCredit(false);
    setPartialPaymentAmount('');
    setClientProviderId('');
    setClientDate(new Date().toISOString().split('T')[0]);
    
    alert('Operación registrada exitosamente.');
  };

  // Submit provider payment
  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return alert('Por favor seleccione el proveedor a pagar.');
    if (!providerProductName) return alert('Por favor especifique el rubro/producto al que abona.');
    
    const amount = parseFloat(providerAmount);
    if (isNaN(amount) || amount <= 0) return alert('Por favor indique un monto válido.');

    const finalRef = (providerMethod === 'Efectivo' || providerMethod === 'Divisas') ? '' : providerReference;
    if (providerMethod !== 'Efectivo' && providerMethod !== 'Divisas' && !finalRef.trim()) {
      return alert('La referencia es obligatoria para transferencias y pagos móviles.');
    }

    onRegisterProviderPayment(
      providerId,
      providerMethod,
      finalRef,
      amount,
      providerDate,
      providerProductName
    );

    // Reset provider form
    setProviderId('');
    setProviderMethod('Transferencia');
    setProviderReference('');
    setProviderAmount('');
    setProviderProductName('');
    
    alert('Pago a proveedor registrado exitosamente.');
  };

  // Calculation values
  const currentProduct = products.find(p => p.id === productId);
  const qtyNum = parseFloat(quantityKg) || 0;
  const priceNum = parseFloat(priceEstablishedUsd) || 0;
  const rawTotalUsd = qtyNum * priceNum;
  const rawTotalBs = rawTotalUsd * tasaBcvUsd;

  return (
    <div className="space-y-6 fade-in pb-10" id="pagos-view-root">
      
      {/* Selector de Formularios de Transacción */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200" id="pagos-form-selection">
        <button
          type="button"
          onClick={() => setActiveForm('CLIENTE')}
          className={`py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeForm === 'CLIENTE' 
              ? 'bg-primary text-white shadow-xs' 
              : 'text-slate-600 hover:text-primary'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          Ingreso Pago Cliente
        </button>
        <button
          type="button"
          onClick={() => setActiveForm('PROVEEDOR')}
          className={`py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeForm === 'PROVEEDOR' 
              ? 'bg-primary text-white shadow-xs' 
              : 'text-slate-600 hover:text-primary'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
          Egreso Pago Proveedor
        </button>
      </div>

      {/* FORMULARIO COBRO CLIENTE (VENTAS) */}
      {activeForm === 'CLIENTE' ? (
        <form onSubmit={handleClientSubmit} className="bg-white border border-slate-150 p-5 rounded-3xl space-y-4 shadow-sm animate-fade-in" id="client-payment-form">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Registrar Venta / Pago de Cliente
            </h3>
            <span className="text-[8.5px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">Ingreso</span>
          </div>

          {/* Comprador (Lista desplegable de Nombre y Apellido) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Comprador (Cliente de Cartera)</label>
            <select
              className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-primary/50"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Seleccione el comprador de la lista...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.cedula ? `[C.I. ${c.cedula}]` : ''} {c.balanceUsd > 0 ? `(Debe: $${c.balanceUsd.toLocaleString('es-VE')} - ${getClientOwedKg(c).toFixed(1)} Kg aprox.)` : c.balanceUsd < 0 ? `(A favor: $${Math.abs(c.balanceUsd).toLocaleString('es-VE')})` : '(Solvente)'}
                </option>
              ))}
            </select>
          </div>

          {/* Rubro a comprar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Rubro / Producto</label>
              <select
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                value={productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                required
              >
                <option value="">Seleccionar Rubro...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.availableKg} kg - Ref: ${p.priceUsd}/kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Provider select to pull stock from */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Proveedor del Lote (Descontar de...)</label>
              <select
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                value={clientProviderId}
                onChange={(e) => setClientProviderId(e.target.value)}
                required
              >
                <option value="">Seleccionar Proveedor...</option>
                {productId ? (
                  providerStocks
                    .filter(ps => ps.productId === productId && ps.availableKg > 0)
                    .map(ps => (
                      <option key={ps.id} value={ps.providerId}>
                        {ps.providerName} ({ps.availableKg.toFixed(1)} KG disponibles)
                      </option>
                    ))
                ) : (
                  providers.map(prov => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Custom Editable Date */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Fecha del Registro</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                value={clientDate}
                onChange={(e) => setClientDate(e.target.value)}
                required
              />
            </div>

            {/* Precio establecido en divisas */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Precio Unitario ($ / KG)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-black text-primary font-sans"
                  placeholder="0.00 $"
                  value={priceEstablishedUsd}
                  onChange={(e) => setPriceEstablishedUsd(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary font-mono">$ USD</span>
              </div>
            </div>
          </div>

          {/* Cantidad de Kilos a comprar */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Cantidad de Kilos a Comprar</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold font-sans"
                placeholder="Ej. 120.35 kg"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KG</span>
            </div>
          </div>

          {/* Live established price outputs (calculated instantly) */}
          {rawTotalUsd > 0 && (
            <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Total Divisas (USD):</span>
                <span className="font-black text-slate-800 text-sm font-sans">${rawTotalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Tasa Consolidada del Día:</span>
                <span className="font-extrabold text-indigo-700">Bs. {tasaBcvUsd.toFixed(2)}</span>
              </div>
              <div className="h-[1px] bg-slate-200 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-650 font-bold">Equivalente en Bolívares (VES):</span>
                <span className="font-black text-primary text-sm font-sans">Bs. {rawTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Tipo de compra */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Tipo de Compra</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setPurchaseType('CONTADO')}
                className={`py-2 text-xs font-black uppercase rounded-lg transition-all ${
                  purchaseType === 'CONTADO' 
                    ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                De Contado
              </button>
              <button
                type="button"
                onClick={() => setPurchaseType('CRÉDITO')}
                className={`py-2 text-xs font-black uppercase rounded-lg transition-all ${
                  purchaseType === 'CRÉDITO' 
                    ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                A Crédito
              </button>
            </div>
          </div>

          {/* FUNCTIONS CONDITIONALS */}
          {purchaseType === 'CONTADO' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-1 text-[10px] uppercase font-black text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Condición: Pago Completo Recibido</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo de Transacción</label>
                  <select
                    className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold text-slate-700"
                    value={clientMethod}
                    onChange={(e) => setClientMethod(e.target.value as any)}
                  >
                    <option value="Efectivo">Efectivo (N/A Ref)</option>
                    <option value="Divisas">Divisas Físicas (N/A Ref)</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Otro">Otro Método</option>
                  </select>
                </div>

                {clientMethod !== 'Efectivo' && clientMethod !== 'Divisas' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Referencia de Pago</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold font-mono placeholder-slate-400"
                      placeholder="N° de referencia o lote..."
                      value={clientReference}
                      onChange={(e) => setClientReference(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* A CRÉDITO PARAMETERS */
            <div className="bg-indigo-50/50 border border-indigo-105 border-indigo-100 rounded-2xl p-4 space-y-4 animate-fade-in">
              <div className="flex items-center gap-1 text-[10px] uppercase font-black text-indigo-900">
                <Info className="w-4 h-4 text-indigo-700" />
                <span>Condición: Deuda Cargada en Cartera</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Cuotas Establecidas</label>
                  <select
                    className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold text-slate-705 text-slate-700"
                    value={creditSchedule}
                    onChange={(e) => setCreditSchedule(e.target.value as any)}
                  >
                    <option value="Semanal">Semanal (Amortización)</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Completo">Completo al vencimiento</option>
                  </select>
                </div>

                {/* Casilla si va a pagar una parte */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">¿Abona una Parte Hoy?</label>
                  <div className="flex items-center gap-2 h-[34px] px-2 bg-white border border-slate-205 rounded-lg">
                    <input
                      type="checkbox"
                      id="partialCheck"
                      className="w-4 h-4 cursor-pointer"
                      checked={hasPartialPaymentOverCredit}
                      onChange={(e) => setHasPartialPaymentOverCredit(e.target.checked)}
                    />
                    <label htmlFor="partialCheck" className="text-[9.5px] font-black text-slate-600 uppercase cursor-pointer select-none leading-none">
                      Pagar parte
                    </label>
                  </div>
                </div>
              </div>

              {hasPartialPaymentOverCredit && (
                <div className="space-y-1.5 animate-fade-in bg-white p-3 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <label className="block font-bold text-slate-550 text-slate-500 uppercase">Monto de Abono Inicial ($ USD)</label>
                    <span className="text-emerald-600 font-extrabold block">Bs. {((parseFloat(partialPaymentAmount) || 0) * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 1 })}</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-lg text-xs font-bold font-sans text-emerald-650"
                    placeholder="Monto que entrega en divisas..."
                    value={partialPaymentAmount}
                    onChange={(e) => setPartialPaymentAmount(e.target.value)}
                    required
                  />
                  {rawTotalUsd > 0 && (
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      * Ajuste automático: La deuda neta que se asignará al cliente será: 
                      <strong className="text-rose-600 font-bold ml-1 font-sans">
                        ${(rawTotalUsd - (parseFloat(partialPaymentAmount) || 0)).toFixed(2)} USD
                      </strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Submit */}
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-98 cursor-pointer"
          >
            Registrar Transación y Actualizar Stock
          </button>
        </form>
      ) : (
        /* EGRESO PAGO PROVEEDOR FORM */
        <form onSubmit={handleProviderSubmit} className="bg-white border border-slate-150 p-5 rounded-3xl space-y-4 shadow-sm animate-fade-in" id="provider-payment-form">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-rose-600" />
              Soporte de Egreso a Proveedores
            </h3>
            <span className="text-[8.5px] bg-rose-50 text-rose-700 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">Egreso</span>
          </div>

          {/* Proveedor a pagar */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Proveedor destinatario</label>
            <select
              className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              required
            >
              <option value="">Seleccione el proveedor de la lista...</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.totalOwedUsd > 0 ? `(Deuda restante: $${p.totalOwedUsd.toLocaleString('es-VE')})` : '(Al día)'}
                </option>
              ))}
            </select>
          </div>

          {/* Rubro / Producto al que abona */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Rubro / Producto que está pagando</label>
            <select
              className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-705 text-slate-700 focus:outline-hidden"
              value={providerProductName}
              onChange={(e) => setProviderProductName(e.target.value)}
              required
            >
              <option value="">Seleccione el rubro que está abonando...</option>
              {products.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tipo de transacción con la que se pagó */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Tipo de Transacción</label>
              <select
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-705 text-slate-700 focus:outline-hidden"
                value={providerMethod}
                onChange={(e) => setProviderMethod(e.target.value as any)}
              >
                <option value="Efectivo">Efectivo (N/A Ref)</option>
                <option value="Divisas">Divisas (N/A Ref)</option>
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Otro">Otro Método</option>
              </select>
            </div>

            {/* Número de referencia (a excepción de divisas y efectivo) */}
            {providerMethod !== 'Efectivo' && providerMethod !== 'Divisas' && (
              <div className="space-y-1 animate-fade-in">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Número de Referencia</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-mono font-bold placeholder-slate-400"
                  placeholder="ID de Transacción..."
                  value={providerReference}
                  onChange={(e) => setProviderReference(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Monto pagado y la fecha de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Monto Pagado ($ USD)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-rose-700 font-sans"
                  placeholder="0.00 $"
                  value={providerAmount}
                  onChange={(e) => setProviderAmount(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-rose-550 font-mono">$ USD</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Fecha en que se pagó</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl text-xs font-bold text-slate-700"
                value={providerDate}
                onChange={(e) => setProviderDate(e.target.value)}
                required
              />
            </div>
          </div>

          {providerAmount ? (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-550 flex justify-between items-center font-bold">
              <span>Equivalente del Abono en Bolívares:</span>
              <strong className="text-rose-700 font-sans">Bs. {((parseFloat(providerAmount) || 0) * tasaBcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 1 })}</strong>
            </div>
          ) : null}

          {/* Form Submit */}
          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-98 cursor-pointer"
          >
            Registrar Abono a Proveedor y Disminuir Deuda
          </button>
        </form>
      )}

      {/* HISTÓRICO DE COBROS Y PAGOS */}
      <div className="space-y-3" id="pagos-historicos-panel">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Histórico de Cobros y Pagos</h4>
          <span className="text-[8.5px] text-slate-400 font-black uppercase">Últimos Registros</span>
        </div>

        <div className="space-y-2">
          {/* Clientes */}
          {clientPayments.map((cp) => (
            <div key={cp.id} className="bg-white border border-slate-150 p-4 rounded-2xl flex justify-between items-center gap-3 shadow-2xs hover:bg-slate-50/20 transition-colors">
              <div className="flex gap-2.5 items-start flex-1">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5 border border-emerald-100 shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-extrabold text-xs text-slate-800 leading-tight flex items-center gap-1.5">
                    Cobro: {cp.clientName}
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditClientPayment && (
                        <button
                          onClick={() => handleStartEditCP(cp)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer"
                          title="Modificar Cobro"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteClientPayment && (
                        <button
                          onClick={() => handleStartDeleteCP(cp)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-650 transition-colors cursor-pointer"
                          title="Eliminar Cobro"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </h5>
                  <div className="text-[9.5px] text-slate-450 font-bold flex flex-wrap items-center gap-1 uppercase">
                    <span className="text-emerald-700 font-black">{cp.type}</span>
                    <span>•</span>
                    <span>{cp.paymentMethod}</span>
                    {cp.reference && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{cp.reference}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block">{cp.dateTime}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-emerald-600 font-sans block leading-none">+${cp.amountUsd.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 font-medium block mt-1">Bs. {(cp.amountUsd * tasaBcvUsd).toLocaleString('es-VE')},00</span>
              </div>
            </div>
          ))}

          {/* Proveedores */}
          {providerPayments.map((pp) => (
            <div key={pp.id} className="bg-white border border-slate-150 p-4 rounded-2xl flex justify-between items-center gap-3 shadow-2xs hover:bg-slate-50/20 transition-colors">
              <div className="flex gap-2.5 items-start flex-1">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl mt-0.5 border border-rose-100 shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-extrabold text-xs text-slate-800 leading-tight flex items-center gap-1.5">
                    Pago: {pp.providerName}
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditProviderPayment && (
                        <button
                          onClick={() => handleStartEditPP(pp)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer"
                          title="Modificar Pago"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteProviderPayment && (
                        <button
                          onClick={() => handleStartDeletePP(pp)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-650 transition-colors cursor-pointer"
                          title="Eliminar Pago"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </h5>
                  <div className="text-[9.5px] text-slate-450 font-bold flex flex-wrap items-center gap-1 uppercase">
                    <span>{pp.paymentMethod || 'Abono'}</span>
                    {pp.reference && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{pp.reference}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block">{pp.dateTime}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-rose-600 font-sans block leading-none">-${pp.amountUsd.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 font-medium block mt-1">Bs. {(pp.amountUsd * tasaBcvUsd).toLocaleString('es-VE')},00</span>
              </div>
            </div>
          ))}

          {clientPayments.length === 0 && providerPayments.length === 0 && (
            <div className="p-10 text-center bg-white border border-slate-150 rounded-2xl text-slate-400 text-xs">
              No se han registrado operaciones comerciales aún.
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITAR COBRO CLIENTE */}
      {editingClientPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleSaveEditCP} className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative text-slate-800 flex flex-col max-h-[90vh]">
            <button 
              type="button"
              onClick={() => setEditingClientPayment(null)} 
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-indigo-600" />
                Modificar Cobro de Cliente
              </h3>
            </div>

            <div className="space-y-3.5 overflow-y-auto no-scrollbar py-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto ($ USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold" 
                  value={editCPAmount}
                  onChange={(e) => setEditCPAmount(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Método de Pago</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold"
                  value={editCPMethod}
                  onChange={(e) => setEditCPMethod(e.target.value as any)}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Divisas">Divisas</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Referencia</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold" 
                  value={editCPReference}
                  onChange={(e) => setEditCPReference(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex gap-2">
              <button 
                type="button"
                onClick={() => setEditingClientPayment(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase py-3 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase py-3 rounded-xl cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITAR PAGO PROVEEDOR */}
      {editingProviderPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleSaveEditPP} className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative text-slate-800 flex flex-col max-h-[90vh]">
            <button 
              type="button"
              onClick={() => setEditingProviderPayment(null)} 
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-indigo-600" />
                Modificar Pago a Proveedor
              </h3>
            </div>

            <div className="space-y-3.5 overflow-y-auto no-scrollbar py-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto ($ USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold" 
                  value={editPPAmount}
                  onChange={(e) => setEditPPAmount(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Canal / Método de Pago</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold" 
                  value={editPPMethod}
                  onChange={(e) => setEditPPMethod(e.target.value)}
                  placeholder="Ej. Transferencia Banesco, Divisas"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Referencia</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold" 
                  value={editPPReference}
                  onChange={(e) => setEditPPReference(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex gap-2">
              <button 
                type="button"
                onClick={() => setEditingProviderPayment(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase py-3 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase py-3 rounded-xl cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PORTAL DE PIN DE SEGURIDAD */}
      <PinConfirmModal
        isOpen={pinModalOpen}
        title={pinModalTitle}
        message={pinModalMessage}
        onConfirm={handleExecutePendingAction}
        onCancel={() => {
          setPinModalOpen(false);
          setPendingAction(null);
        }}
      />

    </div>
  );
}
