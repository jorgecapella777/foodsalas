import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Users, 
  Truck, 
  Package, 
  CreditCard, 
  History, 
  Calculator, 
  Coins, 
  BarChart3 
} from 'lucide-react';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content: string[];
}

export default function InstruccionesView() {
  const [openSection, setOpenSection] = useState<string | null>('inicio');

  const sections: ManualSection[] = [
    {
      id: 'inicio',
      title: '1. Inicio (Módulo de Indicadores Clave)',
      icon: Layers,
      content: [
        'Este panel representa el corazón operativo de la empresa, reuniendo los indicadores financieros clave en tiempo real.',
        'Saldos Totales por Cobrar: Muestra el dinero total que la cartera de clientes le adeuda a la empresa en dólares e indexado a la tasa BCV oficial.',
        'Cuentas por Pagar Proveedores: Visualiza el monto total acumulado que se le debe a los proveedores de mercancía avícola.',
        'Stock Físico Consolidado: Expresa la cantidad de kilogramos totales de pollo que se encuentran resguardados actualmente en la cámara de congelación.',
        'Tasas de Referencia en Tiempo Real: Consulta el precio del Dólar Oficial del Banco Central de Venezuela (BCV), Euro BCV, y el Dólar Digital USDT para sincronizar los cobros.'
      ]
    },
    {
      id: 'clientes',
      title: '2. Cartera de Clientes & CRM',
      icon: Users,
      content: [
        'Gestión integral de los compradores de pollo, diseñada para garantizar el control riguroso de deudas y prevenir pérdidas de capital.',
        'Búsqueda Avanzada: Filtre a los clientes instantáneamente escribiendo su nombre, cédula/RIF, o número de teléfono celular.',
        'Clasificación por Estatus: Visualice y filtre clientes según su estado financiero: "Con Deuda", "Atrasado" (crédito vencido), "Al Día" (solvente) y "A Favor" (con saldo a favor o abono adelantado).',
        'Registro de Cliente Nuevo: Formulario completo que recopila Nombre/RIF, Teléfono de contacto, Dirección del negocio, rubro sugerido, volumen inicial y saldo adeudado inicial.',
        'Abono Específico de Rubro: Al realizar un abono parcial o pago adelantado de un cliente, el sistema requiere especificar a qué rubro de pollo comprado se imputará el saldo. Si el cliente tiene múltiples compras vigentes, el sistema sugiere y pre-selecciona automáticamente el rubro correspondiente para simplificar la conciliación.',
        'Historial de Transacciones de Clientes: Permite consultar el expediente detallado de cada cliente. Podrá saber exactamente cuántas veces le debió, cuántas veces pagó adelantado, a tiempo, o atrasado. Asimismo, se desglosa la lista con fechas de pago, montos exactos, rubros de pollo comercializados y cantidades en KG descontadas del inventario.'
      ]
    },
    {
      id: 'proveedores',
      title: '3. Lista de Proveedores & Logística',
      icon: Truck,
      content: [
        'Módulo para administrar las cuentas de proveedores distribuidores y la recepción de nuevos lotes de mercancía.',
        'Estatus de Deuda: Monitoree qué proveedores tienen facturas pendientes de cobro, la fecha exacta de vencimiento y el monto que se les debe amortizar.',
        'Recibir Nuevo Lote (Despacho): Permite registrar una compra de mercancía especificando el rubro de pollo, el proveedor, los KGs despachados, y el precio de compra pactado. Si el rubro no existe en el catálogo actual, puede seleccionarse la opción de registrar un nuevo rubro dinámicamente y el sistema lo dará de alta en la base de datos automáticamente con un margen sugerido.',
        'Amortizar / Pagar Deuda por Rubro: Al abonar una deuda a un proveedor, el sistema exige indicar explícitamente a qué rubro o producto comprado se le está abonando para llevar una contabilidad transparente.',
        'Historial de Proveedores: Detalla el número de despachos recibidos, pagos totales, montos abonados, rubros suministrados y fechas correspondientes.'
      ]
    },
    {
      id: 'inventario',
      title: '4. Inventario Mercancía (Cámara de Pollo)',
      icon: Package,
      content: [
        'Control estricto del stock en kilogramos de los distintos rubros: Pollo Entero, Pechuga, Muslos, Patas y Alas.',
        'Alertas de Existencia Crítica: El sistema genera una alarma visual intermitente si algún rubro se encuentra por debajo de 20.00 KG de existencia en cámara.',
        'Ajuste Manual con Motivo (Obligatorio): Si detecta diferencias físicas en cámara, puede realizar ajustes de entrada o salida manual detallando el motivo del ajuste para auditorías.',
        'Modificar Precio de Venta (Novedad): Permite modificar de forma directa el precio neto base por kilogramo para la venta a clientes, actualizando de inmediato los márgenes en los módulos de ventas.',
        'Registro y Control de Mermas: Herramienta dedicada a reportar pérdida de mercancía (por evaporación, goteo natural, recortes o inventario no registrado). El sistema resta los KGs del stock de manera inmediata y asume el costo real de adquisición de la pérdida en el análisis financiero general.'
      ]
    },
    {
      id: 'pagos',
      title: '5. Módulo de Cobros y Pagos (Caja)',
      icon: CreditCard,
      content: [
        'Módulo unificado para formular transacciones comerciales de compra-venta.',
        'Formular Venta de Pollo: Permite vender mercancía al contado o a crédito. Si es a crédito, se puede pautar un cronograma de pago (semanal, quincenal, completo) y recibir un abono parcial inicial.',
        'Medios de Pago: Soporte completo para transacciones en Efectivo, Divisas, Transferencias Bancarias, Pago Móvil, etc.',
        'Conversión y Equivalencia: Al introducir montos en dólares, el sistema calcula de inmediato la equivalencia en Bolívares usando la tasa BCV del día para transacciones en moneda nacional.'
      ]
    },
    {
      id: 'historicos',
      title: '6. Histórico Completo de Operaciones',
      icon: History,
      content: [
        'Bitácora o libro diario auditable donde se asientan cronológicamente todas las operaciones financieras y de almacén.',
        'Filtros Rápidos: Permite explorar la bitácora según el tipo de operación: Cobros de Clientes, Pagos a Proveedores, Recepción de Despachos, Ajustes de Almacén y Mermas.',
        'Trazabilidad: Cada registro detalla la fecha y hora exacta, descripción de la acción comercial, origen del flujo, destino, referencias bancarias y montos ejecutados.'
      ]
    },
    {
      id: 'calculadora',
      title: '7. Calculadora Mayor, Detal & Rendimiento de Mermas',
      icon: Calculator,
      content: [
        'Herramientas avanzadas para presupuestar y auditar la rentabilidad del negocio.',
        'Calculadora de Mayor y Detal: Introduzca el costo neto base de adquisición, el porcentaje de rentabilidad deseada para mayor y para detal. Obtenga al instante el precio de venta sugerido y el total de ganancias estimadas.',
        'Calculadora de Mermas e Impacto Financiero: Le permite calcular el impacto real de las pérdidas físicas. Al ingresar los KGs de inventario inicial, los KGs reales vendidos, el costo de adquisición y el precio de venta, la calculadora arroja la merma exacta en KGs y %, la pérdida real sobre costo, el ingreso que dejó de percibir (costo de oportunidad) y el rendimiento neto comercializable.'
      ]
    },
    {
      id: 'tasas',
      title: '8. Sincronización de Tasas del Día',
      icon: Coins,
      content: [
        'Permite ajustar las tasas de cambio de referencia que rigen el sistema.',
        'Sincronización Inteligente: Al presionar "Sincronizar Tasas Oficiales", el sistema carga las tasas oficiales vigentes.',
        'Ajuste Manual Flexible: Si es necesario usar una tasa preferencial acordada con el cliente, puede reescribir manualmente las tasas (USD, EUR, USDT) y guardarlas para que afecten a todo el software.'
      ]
    },
    {
      id: 'estadisticas',
      title: '9. Análisis Financiero & Descarga de PDF',
      icon: BarChart3,
      content: [
        'Análisis integral de rentabilidad con gráficos e informes automatizados.',
        'Resultados de Ganancias y Pérdidas (P&L): Evalúe los ingresos brutos contra los costos de mercancía, obteniendo la utilidad neta por periodos (Diario, Semanal, Quincenal, Mensual, Trimestral o Anual).',
        'Análisis de Mermas Integrado: Vea cómo las mermas registradas por evaporación, goteo o recortes restan utilidad al negocio con desglose de pérdidas reales y causas comunes.',
        'Descarga de PDF Consolidado: Genere y descargue al instante informes gerenciales oficiales firmados y sellados digitalmente por Food Salas, conteniendo los resúmenes financieros exactos e indexados a tasa BCV.'
      ]
    },
    {
      id: 'facturacion',
      title: '10. Módulo FACTURAR (Recibos de Pago al Estilo Talonario)',
      icon: BookOpen,
      content: [
        'Generación automatizada de comprobantes de pago estructurados bajo el formato clásico de un talonario físico de recibos.',
        'Criterios de Filtro: Seleccione un cliente específico y defina un rango de fechas ("Desde" y "Hasta") para buscar todos los despachos y abonos registrados.',
        'Automatización Completa: Al seleccionar un movimiento, el recibo se llena automáticamente con el peso en kilogramos, la descripción del rubro con precio unitario, y el total equivalente en Bolívares usando la tasa BCV oficial.',
        'Diseño de Talonario Clásico: El recibo en PDF incluye una cabecera con el Nombre Comercial, Teléfono y Dirección fiscal. Modifica los campos tradicionales a "Nombre/Razon Social" y "Recibo de Pago". Presenta renglones rayados vacíos simulados para lograr un aspecto de papel preimpreso de alta fidelidad.',
        'Totales Detallados en Pie de Página: El bloque de liquidación desglosa de manera rigurosa los campos requeridos: Subtotal, Total USD, Tasa BCV REF, y el Total Bs.D (Bolívares Digitales).'
      ]
    }
  ];

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="space-y-4 fade-in pb-10" id="instrucciones-view-root">
      
      {/* Hero Banner Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-1 shadow-sm">
        <h2 className="font-extrabold text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          MANUAL DE INSTRUCCIONES
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Guía técnica y detallada de uso para el personal de Inversiones Food Salas F.P. Siga el orden lógico de cada módulo.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5" id="instrucciones-accordion-container">
        {sections.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;

          return (
            <div 
              key={section.id} 
              className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                isOpen ? 'border-indigo-400 shadow-xs' : 'border-slate-150'
              }`}
            >
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left font-sans cursor-pointer hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isOpen ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {section.title}
                  </span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Accordion Content Box */}
              {isOpen && (
                <div className="p-4 bg-slate-50/40 border-t border-slate-100 space-y-3">
                  {section.content.map((paragraph, index) => (
                    <div key={index} className="flex gap-2.5 items-start text-xs text-slate-650 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1.5"></span>
                      <span>{paragraph}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Help Footer Box */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-950 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-[10.5px] uppercase tracking-wider text-indigo-900">¿Necesita asistencia adicional?</h4>
          <p className="text-xs text-indigo-800 leading-relaxed">
            Consulte la documentación del desarrollador o contacte con el equipo de soporte técnico de <strong>Capella Tec</strong> para dudas operativas sobre el balance o las tasas oficiales.
          </p>
        </div>
      </div>

    </div>
  );
}
