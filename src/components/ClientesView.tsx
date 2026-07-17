import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  CreditCard, 
  ArrowUpRight, 
  DollarSign, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Check, 
  UserPlus,
  Coins,
  Phone,
  MapPin,
  ShoppingBag,
  History,
  Info,
  FileText
} from 'lucide-react';
import { Client, HistoricalOperation, ClientPayment } from '../types';

interface ClientesViewProps {
  clients: Client[];
  tasaBcvUsd: number;
  historicalOperations: HistoricalOperation[];
  clientPayments: ClientPayment[];
  products?: any[];
  onAddClient: (
    name: string, 
    rif: string, 
    initialBalance: number,
    phone: string,
    address?: string,
    whatBought?: string,
    amountBoughtUsd?: number
  ) => void;
  onRegisterClientCreditAbono: (
    clientId: string, 
    amountUsd: number, 
    method: 'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro', 
    reference: string,
    isAdvance: boolean,
    customDate?: string,
    productBoughtName?: string
  ) => void;
}

export default function ClientesView({
  clients,
  tasaBcvUsd,
  historicalOperations,
  clientPayments,
  products,
  onAddClient,
  onRegisterClientCreditAbono,
}: ClientesViewProps) {
  // Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('');

  const getProductDebtBreakdown = (client: Client) => {
    // Obtener todos los productos comprados por el cliente
    const boughtProducts = client.whatBought 
      ? client.whatBought.split(/[,;]/).map(s => s.trim()).filter(Boolean) 
      : [];

    // Mostrar el desglose si tiene 2 o más productos comprados
    if (boughtProducts.length < 2) return [];

    // Hacer seguimiento de compras, pagos y deudas por rubro
    const breakdown: { [productName: string]: { totalBought: number; totalPaid: number } } = {};
    boughtProducts.forEach(prod => {
      breakdown[prod] = { totalBought: 0, totalPaid: 0 };
    });

    // Buscar ventas asociadas en operaciones históricas
    historicalOperations.forEach(op => {
      if (op.type === 'CLIENT_PAYMENT' && op.destination === client.name) {
        const matchedProd = boughtProducts.find(p => op.description.toLowerCase().includes(p.toLowerCase()));
        if (matchedProd) {
          const totalCost = op.amountUsd || 0;
          breakdown[matchedProd].totalBought += totalCost;

          // Extraer abono inicial si existe
          const abonoMatch = op.description.match(/\(Abonado inicial:\s*\$?([\d.]+)\)/i) || 
                             op.description.match(/\(Abono inicial\s*\$?([\d.]+)\)/i);
          if (abonoMatch && abonoMatch[1]) {
            const initialAbono = parseFloat(abonoMatch[1]) || 0;
            breakdown[matchedProd].totalPaid += initialAbono;
          } else if (op.description.includes('Venta (CONTADO)')) {
            breakdown[matchedProd].totalPaid += totalCost;
          }
        }
      }
    });

    // Agregar abonos específicos o distribuir abonos generales
    clientPayments.forEach(p => {
      if (p.clientId === client.id) {
        if (p.productBoughtName) {
          const matchedProd = boughtProducts.find(prod => prod.toLowerCase() === p.productBoughtName?.toLowerCase().trim());
          if (matchedProd) {
            breakdown[matchedProd].totalPaid += p.amountUsd;
          }
        } else {
          // Distribuir a rubros con saldo pendiente
          const unpaidProd = boughtProducts.find(prod => {
            const currentDebt = breakdown[prod].totalBought - breakdown[prod].totalPaid;
            return currentDebt > 0;
          });
          if (unpaidProd) {
            breakdown[unpaidProd].totalPaid += p.amountUsd;
          } else if (boughtProducts[0]) {
            breakdown[boughtProducts[0]].totalPaid += p.amountUsd;
          }
        }
      }
    });

    return boughtProducts.map(prod => {
      const b = breakdown[prod];
      const debt = Math.max(0, parseFloat((b.totalBought - b.totalPaid).toFixed(2)));
      const isPaid = debt <= 0 && b.totalBought > 0;
      return {
        productName: prod,
        totalBought: b.totalBought,
        totalPaid: b.totalPaid,
        debt,
        isPaid
      };
    });
  };
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'CON_DEUDA' | 'ATRASADOS' | 'AL_DIA' | 'A_FAVOR'>('TODOS');

  // Registrar cliente modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientRif, setClientRif] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientWhatBought, setClientWhatBought] = useState('');
  const [clientAmountBoughtUsd, setClientAmountBoughtUsd] = useState('');
  const [clientInitialBalance, setClientInitialBalance] = useState('');

  // Registrar Abono / Cobro de Crédito modal
  const [selectedClientForAbono, setSelectedClientForAbono] = useState<Client | null>(null);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoMethod, setAbonoMethod] = useState<'Efectivo' | 'Divisas' | 'Transferencia' | 'Pago Móvil' | 'Otro'>('Efectivo');
  const [abonoReference, setAbonoReference] = useState('');
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [abonoDate, setAbonoDate] = useState(new Date().toISOString().split('T')[0]);
  const [abonoProduct, setAbonoProduct] = useState('');

  React.useEffect(() => {
    if (selectedClientForAbono) {
      const parsed = selectedClientForAbono.whatBought
        ? selectedClientForAbono.whatBought.split(/[,;]/).map(s => s.trim()).filter(Boolean)
        : [];
      if (parsed.length > 0) {
        setAbonoProduct(parsed[0]);
      } else if (products && products.length > 0) {
        setAbonoProduct(products[0].name);
      } else {
        setAbonoProduct('');
      }
    } else {
      setAbonoProduct('');
    }
  }, [selectedClientForAbono, products]);

  // Historial y Estadísticas de Cliente modal
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  // Procesar registro de cliente con los seis campos descritos
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor ingrese el nombre del cliente y su teléfono de contacto');
      return;
    }

    const boughtUsd = parseFloat(clientAmountBoughtUsd) || 0;
    // La deuda inicial por defecto es la ingresada o se puede autocompletar con el monto de lo comprado si es crédito inicial
    const balance = parseFloat(clientInitialBalance) || boughtUsd;

    onAddClient(
      clientName.trim(), 
      clientRif.trim() || 'N/A', 
      balance,
      clientPhone.trim(),
      clientAddress.trim() || undefined,
      clientWhatBought.trim() || undefined,
      boughtUsd || undefined
    );

    // Resetear
    setClientName('');
    setClientRif('');
    setClientPhone('');
    setClientAddress('');
    setClientWhatBought('');
    setClientAmountBoughtUsd('');
    setClientInitialBalance('');
    setShowAddModal(false);
    alert('Cliente asignado y guardado en la cartera comercial.');
  };

  // Procesar cobro de crédito
  const handleExecuteAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForAbono) return;

    const amt = parseFloat(abonoAmount) || 0;
    if (amt <= 0) {
      alert('Por favor ingrese un monto mayor a cero.');
      return;
    }

    if (abonoMethod !== 'Efectivo' && abonoMethod !== 'Divisas' && !abonoReference.trim()) {
      alert('Por favor complete la referencia de pago.');
      return;
    }

    onRegisterClientCreditAbono(
      selectedClientForAbono.id,
      amt,
      abonoMethod,
      (abonoMethod === 'Efectivo' || abonoMethod === 'Divisas') ? '' : abonoReference.trim(),
      isAdvancePayment,
      abonoDate,
      abonoProduct || undefined
    );

    setSelectedClientForAbono(null);
    setAbonoAmount('');
    setAbonoMethod('Efectivo');
    setAbonoReference('');
    setIsAdvancePayment(false);
    setAbonoDate(new Date().toISOString().split('T')[0]);
    setAbonoProduct('');
    alert('Abono procesado y restado del saldo del cliente.');
  };

  // Filtrado de clientes
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.rif && c.rif.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === 'TODOS') return true;
    if (statusFilter === 'CON_DEUDA') return c.status === 'Con Deuda';
    if (statusFilter === 'ATRASADOS') return c.status === 'Atrasado';
    if (statusFilter === 'AL_DIA') return c.status === 'Al día';
    if (statusFilter === 'A_FAVOR') return c.status === 'A favor' || c.balanceUsd < 0;

    return true;
  });

  // Estadísticas cartera
  const deudoresCount = clients.filter(c => c.balanceUsd > 0).length;
  const totalOutstandingDeuda = clients.reduce((sum, c) => c.balanceUsd > 0 ? sum + c.balanceUsd : sum, 0);
  const totalFavorAmount = Math.abs(clients.reduce((sum, c) => c.balanceUsd < 0 ? sum + c.balanceUsd : sum, 0));

  return (
    <div className="space-y-4 fade-in pb-10" id="clientes-view-wrapper">
      
      {/* Tarjetas Resúmenes de Cartera */}
      <div className="grid grid-cols-2 gap-3" id="clientes-head-metrics">
        <div className="bg-white p-4 rounded-2xl border border-slate-150">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Cartera Comercial por Cobrar</span>
          <div className="text-xl font-black text-rose-600 font-sans leading-none">
            ${totalOutstandingDeuda.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[9px] text-slate-500 font-semibold block mt-1">
            ({deudoresCount} clientes con deuda)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Pagos Adelantados</span>
          <div className="text-xl font-black text-emerald-600 font-sans leading-none">
            ${totalFavorAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[9px] text-slate-500 font-semibold block mt-1">
            Saldo acumulado a favor
          </span>
        </div>
      </div>

      {/* Buscador + Botón Añadir */}
      <div className="flex gap-2 items-center" id="clientes-search-action-bar">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por Teléfono o Cliente..."
            className="w-full bg-white border border-slate-205 rounded-xl py-2 pl-9 pr-3 text-xs outline-hidden font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs shrink-0 uppercase tracking-wide cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Cliente</span>
        </button>
      </div>

      {/* Filtros por Categoría */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200 overflow-x-auto no-scrollbar" id="clientes-category-tabs">
        {(['TODOS', 'CON_DEUDA', 'ATRASADOS', 'AL_DIA', 'A_FAVOR'] as const).map(f => {
          const isActive = statusFilter === f;
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-650 hover:text-indigo-700'
              }`}
            >
              {f === 'TODOS' && 'Todos'}
              {f === 'CON_DEUDA' && 'Deuda'}
              {f === 'ATRASADOS' && 'Atrasado'}
              {f === 'AL_DIA' && 'Al Día'}
              {f === 'A_FAVOR' && 'A Favor'}
            </button>
          );
        })}
      </div>

      {/* Listado de Clientes con Diseño de Tarjetas */}
      <div className="space-y-3" id="clientes-list-cards-root">
        {filteredClients.map(c => {
          const hasDeuda = c.balanceUsd > 0;
          const isAFavor = c.balanceUsd < 0;
          const isSolvente = c.balanceUsd === 0;

          let badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
          if (c.status === 'Atrasado') badgeColor = 'bg-rose-50 text-rose-700 border-rose-154';
          else if (c.status === 'Con Deuda') badgeColor = 'bg-amber-50 text-amber-700 border-amber-154';
          else if (isAFavor || c.status === 'A favor') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-154';
          else if (isSolvente || c.status === 'Al día') badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-154';

          return (
            <div key={c.id} className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-3 shadow-xs">
              
              {/* Cabecera */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans leading-tight">{c.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-emerald-600" /> {c.phone}</span>
                    {c.rif && c.rif !== 'N/A' && <span className="font-mono">Cedula/RIF: {c.rif}</span>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider shrink-0 ${badgeColor}`}>
                  {isAFavor ? 'PAGO ADELANTADO' : c.status}
                </span>
              </div>

              {/* Información de CRM (Dirección y última compra) */}
              {(c.address || c.whatBought || (c.amountBoughtUsd !== undefined && c.amountBoughtUsd > 0)) && (
                <div className="bg-slate-50/50 p-2.5 border border-slate-150 rounded-xl text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  {c.address && (
                    <p className="flex items-start gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{c.address}</span>
                    </p>
                  )}
                  {c.whatBought && (
                    <div className="flex items-center gap-1.5 pl-0.5 text-slate-500 font-black">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Compró: <strong className="text-indigo-950 font-black uppercase text-[10px]">{c.whatBought}</strong></span>
                      {c.amountBoughtUsd !== undefined && c.amountBoughtUsd > 0 && (
                        <span>por <strong className="text-slate-800">${c.amountBoughtUsd.toFixed(2)}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Balance Deuda */}
              <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black block mb-0.5">Saldo en Cuenta</span>
                  {hasDeuda && (
                    <span className="text-sm font-black text-rose-600 font-sans block">
                      Debiendo: ${c.balanceUsd.toFixed(2)} USD
                    </span>
                  )}
                  {isAFavor && (
                    <span className="text-sm font-black text-emerald-600 font-sans block">
                      A Favor: ${Math.abs(c.balanceUsd).toFixed(2)} USD
                    </span>
                  )}
                  {isSolvente && (
                    <span className="text-xs font-black text-slate-500 block">
                      Solvente ($0.00)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-black block mb-0.5">Equiv. Bolívares</span>
                  <span className="text-xs font-black text-slate-700 font-sans block">
                    Bs. {Math.abs(c.balanceUsd * tasaBcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Info adicional del último movimiento de cobro */}
              <div className="text-[10.5px] text-slate-500 flex flex-col gap-0.5 px-0.5 font-semibold">
                {c.ultimoPago && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Último abono registrado:</span>
                    <strong className="text-slate-700">{c.ultimoPago}</strong>
                  </div>
                )}
                {c.metodoUltimoPago && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Canal / Referencia:</span>
                    <strong className="text-slate-705">
                      {c.metodoUltimoPago} {c.referenciaUltimoPago ? `(${c.referenciaUltimoPago})` : ''}
                    </strong>
                  </div>
                )}
                {c.vencimientoInfo && (
                  <div className="text-[9.5px] text-amber-800 font-black mt-1 uppercase flex items-center gap-0.5">
                    <span>⚠️ Plazo: {c.vencimientoInfo}</span>
                  </div>
                )}
              </div>

              {/* Desglose por Rubro (solo si tiene más de 2 productos que compró) */}
              {(() => {
                const breakdown = getProductDebtBreakdown(c);
                if (breakdown.length === 0) return null;
                return (
                  <div className="bg-indigo-50/25 border border-indigo-100 rounded-xl p-3 space-y-2 animate-fade-in mt-1.5">
                    <span className="text-[9px] text-indigo-950 uppercase font-black flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-650 shrink-0" />
                      Deuda y Amortización por Rubro
                    </span>
                    <div className="space-y-1.5 divide-y divide-indigo-100/40">
                      {breakdown.map((item, idx) => (
                        <div key={idx} className="pt-1.5 first:pt-0 flex flex-col gap-1 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-700 uppercase tracking-wide">
                              {item.productName}
                            </span>
                            {item.isPaid ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm border border-emerald-150 flex items-center gap-0.5 leading-none">
                                <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Solvente
                              </span>
                            ) : item.totalBought === 0 ? (
                              <span className="text-slate-400 text-[8.5px] font-bold">Sin Compras</span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-sm border border-rose-150 leading-none">
                                Debe ${item.debt.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.totalBought > 0 && (
                            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 font-bold leading-none">
                              <div>
                                <span className="text-slate-400 block text-[8px] uppercase font-black mb-0.5">Comprado</span>
                                <span className="text-slate-700 block">${item.totalBought.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8px] uppercase font-black mb-0.5">Abonado</span>
                                <span className="text-emerald-700 block">${item.totalPaid.toFixed(2)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block text-[8px] uppercase font-black mb-0.5">Resta</span>
                                <span className={`block ${item.debt > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-extrabold'}`}>
                                  ${item.debt.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Botones de acción: Abono y Expediente */}
              <div className="pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedClientForAbono(c)}
                  className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors py-2 px-1.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer border border-slate-200 active:scale-98"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Abonar
                </button>

                <button
                  onClick={() => setSelectedClientForHistory(c)}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-900 transition-colors py-2 px-1.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer border border-indigo-100 active:scale-98"
                >
                  <History className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Expediente
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL REGISTRAR CLIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setShowAddModal(false)} 
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="font-extrabold text-xs text-indigo-950 uppercase flex items-center gap-1.5 font-sans">
                <Users className="w-5 h-5 text-indigo-600" />
                Registrar Cliente de Cartera
              </h3>
            </div>

            <form onSubmit={handleCreateClient} className="flex-1 flex flex-col min-h-0">
              <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 no-scrollbar pb-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre y Apellido *</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold outline-hidden"
                    placeholder="Ej. Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Teléfono de Contacto *</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold outline-hidden"
                    placeholder="Ej. +584241002030"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Cédula (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold outline-hidden"
                    placeholder="Ej. 12345678"
                    value={clientRif}
                    onChange={(e) => setClientRif(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Dirección (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold outline-hidden"
                    placeholder="Ej. Av. Sucre, Local 25"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">¿Qué Compró? (Rubro)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold"
                      placeholder="Ej. Pollo Entero"
                      value={clientWhatBought}
                      onChange={(e) => setClientWhatBought(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto Comprado ($ USD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold"
                      placeholder="0.00"
                      value={clientAmountBoughtUsd}
                      onChange={(e) => setClientAmountBoughtUsd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2 border border-slate-202 rounded-lg">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-indigo-900 uppercase">Deuda Inicial ($ USD) / En Blanco si es al Contado</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs font-bold"
                      placeholder="Dejar en blanco para usar monto de compra como saldo"
                      value={clientInitialBalance}
                      onChange={(e) => setClientInitialBalance(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex gap-2 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-bold shadow-xs">
                  Procesar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO A CRÉDITO DEL CLIENTE */}
      {selectedClientForAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedClientForAbono(null)} 
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1 rounded-full text-slate-450 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3 text-on-surface shrink-0">
              <h3 className="font-extrabold text-sm text-indigo-950 uppercase flex items-center gap-1">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Abono de Cliente
              </h3>
            </div>

            <form onSubmit={handleExecuteAbono} className="flex-1 flex flex-col min-h-0">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 no-scrollbar pb-2">
                <div className="p-3 bg-slate-50 border border-slate-201 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-black block">Cliente Destinatario</span>
                  <p className="text-xs font-black text-indigo-955 text-indigo-950 leading-tight block mt-0.5">{selectedClientForAbono.name}</p>
                  <span className="text-[10px] mt-1 text-slate-600 block">
                    Deuda Actual: ${selectedClientForAbono.balanceUsd.toFixed(2)} USD 
                    ({selectedClientForAbono.balanceUsd < 0 ? 'Con saldo a favor' : 'Monto insolvente'})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto Abonado ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-black text-indigo-950" 
                      value={abonoAmount} 
                      onChange={(e) => setAbonoAmount(e.target.value)}
                      placeholder="0.00 $" 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">¿Adelantado?</label>
                    <div className="flex items-center gap-2 h-[38px] px-2 bg-slate-50 border border-slate-205 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="advancePayChecked"
                        className="w-4 h-4 cursor-pointer"
                        checked={isAdvancePayment}
                        onChange={(e) => setIsAdvancePayment(e.target.checked)}
                      />
                      <label htmlFor="advancePayChecked" className="text-[8.5px] font-black text-slate-600 cursor-pointer uppercase select-none leading-none">
                        Es Adelantado
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Canal de Cobro</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold text-slate-700"
                    value={abonoMethod}
                    onChange={(e) => setAbonoMethod(e.target.value as any)}
                  >
                    <option value="Efectivo">Efectivo (USD / VES)</option>
                    <option value="Divisas">Divisas (Dólar Físico)</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Otro">Otro Método</option>
                  </select>
                </div>

                {/* Rubro / Producto que está pagando */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Rubro / Producto que está pagando</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                    value={abonoProduct}
                    onChange={(e) => setAbonoProduct(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione rubro --</option>
                    {/* Rubros que este cliente compró */}
                    {selectedClientForAbono.whatBought && selectedClientForAbono.whatBought.split(/[,;]/).map(s => s.trim()).filter(Boolean).map((p, idx) => (
                      <option key={`bought-${idx}`} value={p}>
                        {p} (Comprado)
                      </option>
                    ))}
                    {/* Resto de productos del catálogo */}
                    {products && products.map(p => p.name).filter(name => {
                      const boughtList = selectedClientForAbono.whatBought 
                        ? selectedClientForAbono.whatBought.split(/[,;]/).map(s => s.trim()).filter(Boolean)
                        : [];
                      return !boughtList.includes(name);
                    }).map((pName, idx) => (
                      <option key={`catalog-${idx}`} value={pName}>
                        {pName}
                      </option>
                    ))}
                  </select>
                  {selectedClientForAbono.whatBought && selectedClientForAbono.whatBought.split(/[,;]/).map(s => s.trim()).filter(Boolean).length >= 2 && (
                    <p className="text-[9px] text-amber-600 font-bold">
                      ⚠️ Múltiples rubros: se auto-seleccionó {abonoProduct || 'el primero'}
                    </p>
                  )}
                </div>

                {/* Custom Date for Abono */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha del Abono</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-black text-slate-700"
                    value={abonoDate}
                    onChange={(e) => setAbonoDate(e.target.value)}
                    required
                  />
                </div>

                {abonoMethod !== 'Efectivo' && abonoMethod !== 'Divisas' && (
                  <div className="bg-slate-50 p-2.5 border border-dashed border-indigo-200 rounded-xl">
                    <label className="block text-[9px] font-black text-indigo-955 uppercase mb-1">Referencia del Comprobante</label>
                    <input 
                      type="text" 
                      placeholder="Número de referencia de operación" 
                      className="w-full bg-white border border-slate-205 p-2 rounded-lg text-xs" 
                      value={abonoReference} 
                      onChange={(e) => setAbonoReference(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2 shrink-0">
                <button type="button" onClick={() => setSelectedClientForAbono(null)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-bold shadow-xs">
                  Guardar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXPEDIENTE E HISTORIAL DE TRANSACCIONES DE CLIENTE */}
      {selectedClientForHistory && (() => {
        const name = selectedClientForHistory.name.toLowerCase();
        const ops = historicalOperations.filter(op => {
          const desc = op.description.toLowerCase();
          return op.destination?.toLowerCase() === name || op.origin?.toLowerCase() === name || desc.includes(name);
        });

        const pays = clientPayments.filter(p => p.clientId === selectedClientForHistory.id);

        // Stats:
        // 1. "cuantas veces me debio" -> Sales where credit is mentioned
        const debioCount = ops.filter(op => op.description.toLowerCase().includes('crédito')).length;

        // 2. "cuantas veces me pagó por adelantado"
        const adelantadoCount = pays.filter(p => p.isAdvance).length;

        // 3. "cuantas veces me pagó atrasado con deuda"
        // Let's count pays which are credit type, not advance, and either date contains "atrasado" or the client is currently atrasado
        const atrasadoCount = pays.filter(p => !p.isAdvance && (p.dateTime.includes('atrasado') || selectedClientForHistory.status === 'Atrasado')).length;

        // 4. "cuantas veces me pagó al día"
        const alDiaCount = Math.max(0, pays.length - adelantadoCount - atrasadoCount);

        const salesOps = ops.filter(op => op.description.toLowerCase().includes('venta'));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white w-[95%] max-w-lg md:max-w-md rounded-2xl overflow-hidden p-5 md:p-6 shadow-2xl animate-fade-in relative text-slate-800 flex flex-col max-h-[90vh]">
              
              <button 
                type="button"
                onClick={() => setSelectedClientForHistory(null)} 
                className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pb-3 border-b border-slate-100 mb-4 shrink-0">
                <h3 className="font-extrabold text-xs text-indigo-950 uppercase flex items-center gap-1.5 font-sans">
                  <History className="w-5 h-5 text-indigo-600" />
                  Expediente de Cliente: {selectedClientForHistory.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">Historial y Análisis de Fidelidad Comercial</span>
              </div>

              {/* Scrollable Container */}
              <div className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1">
                
                {/* 1. Indicadores de Comportamiento */}
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2">
                  <h4 className="text-[9.5px] font-black text-indigo-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Métricas de Comportamiento y Fidelidad
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block">Veces que debió</span>
                      <strong className="text-amber-700 text-sm block font-sans">{debioCount} veces</strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block">Pagó Adelantado</span>
                      <strong className="text-emerald-700 text-sm block font-sans">{adelantadoCount} veces</strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block">Pagó al día</span>
                      <strong className="text-slate-700 text-sm block font-sans">{alDiaCount} veces</strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-0.5">
                      <span className="text-[8px] text-slate-450 uppercase font-black block">Atrasado con deuda</span>
                      <strong className="text-rose-700 text-sm block font-sans">{atrasadoCount} veces</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Lo que se le vendió y cantidades */}
                <div className="space-y-2">
                  <h4 className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1 pl-0.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                    Rubros Vendidos y Cantidades
                  </h4>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                    {salesOps.map((op) => (
                      <div key={op.id} className="text-[11px] font-semibold text-slate-650 flex justify-between gap-3 border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-slate-800 font-extrabold truncate">{op.description.split(':').slice(1).join(':').split('(')[0].trim() || op.description}</p>
                          <span className="text-[9px] text-slate-400 font-medium block">{op.dateTime}</span>
                        </div>
                        <span className="font-extrabold text-slate-700 font-sans text-right shrink-0">
                          {op.kg ? `${op.kg.toFixed(1)} KG` : ''}
                          <span className="block text-[9.5px] text-slate-400 font-medium">${op.amountUsd.toFixed(2)}</span>
                        </span>
                      </div>
                    ))}
                    {salesOps.length === 0 && (
                      <p className="text-[10.5px] text-slate-400 text-center py-4 font-bold uppercase">No hay ventas registradas aún</p>
                    )}
                  </div>
                </div>

                {/* 3. Fechas y Canales de Pago */}
                <div className="space-y-2">
                  <h4 className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1 pl-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    Historial de Abonos y Fechas de Pago
                  </h4>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                    {pays.map((p) => (
                      <div key={p.id} className="text-[11px] font-semibold text-slate-650 flex justify-between gap-3 border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-slate-800 font-extrabold flex items-center gap-1">
                            {p.isAdvance ? (
                              <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black px-1.5 py-0.3 rounded border border-emerald-200">ADELANTADO</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 text-[8px] font-black px-1.5 py-0.3 rounded border border-slate-200">ABONO</span>
                            )}
                            Canal: {p.paymentMethod}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{p.dateTime} {p.reference ? `(Ref: ${p.reference})` : ''}</span>
                        </div>
                        <strong className="text-emerald-600 font-sans text-right shrink-0 font-black">+${p.amountUsd.toFixed(2)}</strong>
                      </div>
                    ))}
                    {pays.length === 0 && (
                      <p className="text-[10.5px] text-slate-400 text-center py-4 font-bold uppercase">No hay abonos registrados aún</p>
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
                      module.exportClientExpedientePDF(
                        selectedClientForHistory,
                        { debioCount, adelantadoCount, alDiaCount, atrasadoCount },
                        salesOps,
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
                  onClick={() => setSelectedClientForHistory(null)}
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
