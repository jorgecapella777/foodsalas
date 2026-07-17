import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Banknote, 
  X,
  CreditCard,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { Client } from '../types';

interface ClientsViewProps {
  clients: Client[];
  tasaBcv: number;
  onAddClient: (name: string, RIF: string, initialBalance: number, status: 'Con Deuda' | 'Atrasado' | 'Al día') => void;
  openPaymentModal: (clientName: string) => void;
}

export default function ClientsView({
  clients,
  tasaBcv,
  onAddClient,
  openPaymentModal,
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'deuda' | 'atrasado' | 'al-dia'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newRif, setNewRif] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newStatus, setNewStatus] = useState<'Con Deuda' | 'Atrasado' | 'Al día'>('Con Deuda');
  const [formError, setFormError] = useState('');

  // Calculations
  const totalOutstandingUsd = clients.reduce((acc, c) => acc + c.balanceUsd, 0);
  const totalOutstandingVes = totalOutstandingUsd * tasaBcv;
  const overdueClientsCount = clients.filter(c => c.status === 'Atrasado').length;

  // Toggle details
  const handleToggleDetails = (id: string) => {
    if (expandedClientId === id) {
      setExpandedClientId(null);
    } else {
      setExpandedClientId(id);
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.rif.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'deuda') return client.status === 'Con Deuda';
    if (activeFilter === 'atrasado') return client.status === 'Atrasado';
    if (activeFilter === 'al-dia') return client.status === 'Al día';

    return true;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRif.trim()) {
      setFormError('El nombre y el RIF son obligatorios.');
      return;
    }
    
    // RIF validation standard regex representation
    const cleanRif = newRif.trim().toUpperCase();
    
    const balanceNum = parseFloat(newBalance) || 0;
    const finalStatus = balanceNum === 0 ? 'Al día' : newStatus;

    onAddClient(newName.trim(), cleanRif, balanceNum, finalStatus);
    
    // Reset Form
    setNewName('');
    setNewRif('');
    setNewBalance('');
    setNewStatus('Con Deuda');
    setFormError('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 fade-in" id="clients-view-container">
      
      {/* Dashboard summary cards */}
      <section className="grid grid-cols-2 gap-4" id="clients-stat-summary">
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">POR COBRAR TOTAL</p>
            <p className="font-extrabold text-xl text-primary font-sans">
              ${totalOutstandingUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-xs text-outline font-medium mt-1">
            {totalOutstandingVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES
          </p>
        </div>

        <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">CLIENTES ATRASADOS</p>
            <p className="font-extrabold text-xl text-error font-sans">
              {overdueClientsCount}
            </p>
          </div>
          <p className="text-xs text-outline font-medium mt-1">
            {overdueClientsCount > 0 ? 'Requieren Acción Directa' : 'Cartera al día'}
          </p>
        </div>
      </section>

      {/* Search and Filters Segment */}
      <section className="space-y-3" id="clients-controls shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o RIF..."
              className="block w-full pl-10 pr-4 py-3 border border-outline-variant rounded-full bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary text-sm font-sans outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <span className="text-outline text-xs font-bold mr-2 hidden sm:inline-block uppercase">Filtros:</span>
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => setActiveFilter('deuda')} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'deuda' 
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-outline-variant text-on-surface'
              }`}
            >
              Con Deuda
            </button>
            <button 
              onClick={() => setActiveFilter('atrasado')} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'atrasado' 
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-outline-variant text-on-surface'
              }`}
            >
              Atrasados
            </button>
            <button 
              onClick={() => setActiveFilter('al-dia')} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'al-dia' 
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-outline-variant text-on-surface'
              }`}
            >
              Al Día
            </button>
          </div>
        </div>
      </section>

      {/* Collapsible Add New Client Form */}
      {showAddForm && (
        <form onSubmit={handleCreateClient} className="bg-slate-50 p-5 rounded-xl border border-dashed border-primary/30 space-y-4 fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/50">
            <div className="flex items-center gap-2 text-primary font-bold">
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Cliente</span>
            </div>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 text-error rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Nombre Comercial</label>
              <input 
                type="text" 
                placeholder="Ej. Distribuidora Pollo de Oro C.A."
                className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Cédula o RIF</label>
              <input 
                type="text" 
                placeholder="Ej. J-31245678-0"
                className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm"
                value={newRif}
                onChange={(e) => setNewRif(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Saldo de Deuda Inicial (USD)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Estatus Crediticio</label>
              <select 
                className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm cursor-pointer"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                disabled={parseFloat(newBalance) === 0}
              >
                <option value="Con Deuda">Con Deuda (Activo)</option>
                <option value="Atrasado">Atrasado (Requiere atención)</option>
                <option value="Al día">Al día (Solvente)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:underline"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      )}

      {/* Cartera de Clientes List */}
      <section className="space-y-3" id="cartera-clientes-list">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-lg text-on-surface">Cartera de Clientes</h2>
          {!showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" /> Agregar Cliente
            </button>
          )}
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-outline-variant text-slate-400 text-sm">
            No se encontraron clientes con los criterios indicados.
          </div>
        ) : (
          filteredClients.map((client) => {
            const isExpanded = expandedClientId === client.id;
            const hasOutstanding = client.balanceUsd > 0;
            const bcvEquivalent = client.balanceUsd * tasaBcv;

            // Render style based on status
            let badgeClass = '';
            let textClass = '';
            let wrapperBorder = 'border-slate-200';
            
            if (client.status === 'Con Deuda') {
              badgeClass = 'bg-secondary-container text-on-secondary-container';
              textClass = 'text-primary';
            } else if (client.status === 'Atrasado') {
              badgeClass = 'bg-error-container text-on-error-container animate-pulse-slow';
              textClass = 'text-error';
              wrapperBorder = 'border-error/40';
            } else {
              badgeClass = 'bg-slate-100 text-slate-600';
              textClass = 'text-slate-500';
            }

            return (
              <div 
                key={client.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-sm ${wrapperBorder}`}
                onClick={() => handleToggleDetails(client.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {/* AV Initials circle */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                      client.status === 'Atrasado'
                        ? 'bg-error-container text-on-error-container'
                        : client.status === 'Con Deuda'
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                    }`}>
                      {client.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px] leading-tight text-on-surface">
                        {client.name}
                      </h3>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-wider mt-0.5">
                        RIF: {client.rif}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide inline-block ${badgeClass}`}>
                    {client.status}
                  </span>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="text-[9px] text-outline font-bold uppercase tracking-wider mb-0.5">
                      Saldo Pendiente
                    </p>
                    <p className={`font-bold text-lg ${textClass}`}>
                      ${client.balanceUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {hasOutstanding ? (
                    <button 
                      className="bg-primary text-white hover:bg-primary/95 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPaymentModal(client.name);
                      }}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Pagar
                    </button>
                  ) : (
                    <button 
                      className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-not-allowed"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Solvente
                    </button>
                  )}
                </div>

                {/* Expanded Accordion Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-outline-variant space-y-2.5 text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Vencimiento Cobranza:</span>
                      <span className={`font-bold ${client.status === 'Atrasado' ? 'text-error' : 'text-on-surface'}`}>
                        {client.vencimientoInfo || 'No registra retrasos'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Equivalente de Deuda:</span>
                      <span className="font-bold text-on-surface">
                        Bs. {bcvEquivalent.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Registro de Último Pago:</span>
                      <span className="font-bold text-slate-600">
                        {client.ultimoPago || 'Sin registro'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
      
      {/* FAB representing Quick Registration */}
      <div className="fixed bottom-24 right-4 z-40 sm:hidden">
        <button 
          onClick={() => setShowAddForm(true)} 
          className="bg-primary text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
