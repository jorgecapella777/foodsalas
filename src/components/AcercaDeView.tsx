import React, { useState, useRef } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  FileTerminal, 
  ExternalLink,
  Instagram,
  ShoppingBag,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Client, Provider, ProviderStock, Product, InventoryMovement, HistoricalOperation, Merma, ClientPayment, ProviderPayment } from '../types';

interface AcercaDeViewProps {
  clients: Client[];
  providers: Provider[];
  providerStocks: ProviderStock[];
  products: Product[];
  movements: InventoryMovement[];
  historicalOperations: HistoricalOperation[];
  mermas: Merma[];
  clientPayments: ClientPayment[];
  providerPayments: ProviderPayment[];
  isSyncing: boolean;
  onSync: () => void;
  pendingSyncCount: number;
  isSupabaseConfigured: boolean;
  isOnline: boolean;
  onImportDatabase: (data: any) => void;
}

export default function AcercaDeView({
  clients,
  providers,
  providerStocks,
  products,
  movements,
  historicalOperations,
  mermas,
  clientPayments,
  providerPayments,
  isSyncing,
  onSync,
  pendingSyncCount,
  isSupabaseConfigured,
  isOnline,
  onImportDatabase,
}: AcercaDeViewProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleExportDatabase = () => {
    try {
      const dataToExport = {
        clients,
        providers,
        providerStocks,
        products,
        movements,
        historicalOperations,
        mermas,
        clientPayments,
        providerPayments,
        version: '1.5',
        exportedAt: new Date().toISOString(),
      };
      
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `food_salas_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      
      triggerFeedback('¡Base de datos exportada en formato JSON correctamente!', 'success');
    } catch (error) {
      console.error(error);
      triggerFeedback('Fallo al exportar la base de datos.', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic structure check
        if (!json || (!json.clients && !json.products && !json.providers)) {
          throw new Error('Formato de respaldo JSON inválido o incompleto.');
        }

        onImportDatabase(json);
        triggerFeedback('¡Base de datos cargada e importada con éxito!', 'success');
      } catch (error: any) {
        console.error(error);
        triggerFeedback(error.message || 'Error al analizar el archivo de respaldo.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  return (
    <div className="space-y-6 fade-in h-full flex flex-col justify-between pb-10" id="acerca-view-root">
      
      {/* Description Content */}
      <div className="space-y-5">
        
        {/* App Title Hero Card */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-2xs space-y-3 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="font-extrabold text-lg text-slate-800">Inversiones Food Salas F.P.</h2>
            <p className="text-[10px] text-primary uppercase font-black tracking-widest">APP ECOMMERCE MULTIUSE v1.5</p>
          </div>
          <div className="w-12 h-0.5 bg-slate-200 mx-auto"></div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Sistema administrativo vertical de distribución avícola mayorista y al detal. Desarrollado con tecnología de alta velocidad e integra tasas dinámicas.
          </p>
        </div>

        {/* FEEDBACK NOTIFICATION */}
        {feedbackMessage && (
          <div className={`p-3 border rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-150 text-emerald-950' 
              : 'bg-rose-50 border-rose-150 text-rose-950'
          }`}>
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* CONTROL DE DATOS Y RESPALDOS (ADMIN CARD) */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-2xs space-y-4" id="data-admin-panel">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 font-sans">
              <Database className="w-4 h-4 text-indigo-650" />
              Herramientas de Datos y Sincronización
            </h3>
            <p className="text-[10.5px] text-slate-500 font-medium leading-tight mt-0.5">
              Administre la persistencia offline, exporte respaldos o sincronice la base de datos central en la nube.
            </p>
          </div>

          {/* Sync status section */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-slate-700">
                  {isSupabaseConfigured ? 'Nube (base de datos)' : 'Sincronizador en Nube'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-[8.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold uppercase">
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal max-w-xs">
                {isSupabaseConfigured 
                  ? (pendingSyncCount > 0 
                      ? `Hay ${pendingSyncCount} cambios locales pendientes por enviar a la nube.` 
                      : 'Todos los registros están sincronizados con la nube.') 
                  : 'Para activar la sincronización, configure la URL y KEY de la base de datos central.'
                }
              </p>
            </div>

            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold uppercase rounded-xl text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 shadow-md hover:shadow-lg border border-amber-600"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>

          {/* Export / Import buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportDatabase}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-extrabold text-xs py-3 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-5 h-5 text-indigo-650" />
              <span>Exportar DB</span>
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-extrabold text-xs py-3 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Importar DB</span>
            </button>
          </div>

          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 gap-2">
          
          <div className="bg-white p-3.5 rounded-xl border border-slate-150 flex gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-slate-800 text-xs">Seguridad de Transacciones</h4>
              <p className="text-slate-500 leading-normal">
                Todas las deudas de clientes y abonos a proveedores coinciden con los balances al instante sin riesgo de desajustes de caja.
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-150 flex gap-3 text-xs">
            <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-slate-800 text-xs">Tasa de Sincronización Directa</h4>
              <p className="text-slate-500 leading-normal">
                Consulta y actualiza de manera automatizada las cotizaciones del Banco Central de Venezuela (BCV) y USDT para cálculos de cambio exactos.
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-150 flex gap-3 text-xs">
            <FileTerminal className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-slate-800 text-xs">Exportación Directa PDF</h4>
              <p className="text-slate-500 leading-normal">
                Descarga inmediata de informes de rentabilidad y balances estadísticos en formato PDF sin necesidad de abrir la ventana de impresión nativa.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Powered by Capella Tec persistent link section (At the bottom) */}
      <div className="pt-6 border-t border-slate-200 text-center space-y-2 mt-auto" id="capellatec-credit-block">
        
        <a 
          href="https://www.instagram.com/capellatec/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 justify-center py-2 px-5 bg-gradient-to-r from-teal-500/10 to-blue-500/10 hover:from-teal-500/15 hover:to-blue-500/15 border border-primary/20 rounded-full transition-all group active:scale-98 cursor-pointer"
        >
          <Instagram className="w-4 h-4 text-emerald-600 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black text-primary tracking-wide">
            POWERED BY <strong className="text-emerald-700 underline group-hover:text-emerald-800">CAPELLA TEC</strong>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </a>

      </div>

    </div>
  );
}
