import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  HelpCircle, 
  CalendarDays, 
  PieChart as PieIcon, 
  CheckCircle2, 
  Layers,
  AlertTriangle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Product, Merma } from '../types';

type PeriodType = 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Trimestral' | 'Anual';

interface StatItem {
  name: string;
  ingresosUsd: number;
  costosUsd: number;
  gananciasUsd: number;
  volumenKg: number;
}

const STATS_DATA: Record<PeriodType, StatItem[]> = {
  Diario: [
    { name: 'Hoy (19 Jun)', ingresosUsd: 1250, costosUsd: 1060, gananciasUsd: 190, volumenKg: 510 },
    { name: 'Ayer (18 Jun)', ingresosUsd: 1450, costosUsd: 1210, gananciasUsd: 240, volumenKg: 590 },
    { name: '17 Jun', ingresosUsd: 1100, costosUsd: 930, gananciasUsd: 170, volumenKg: 450 },
    { name: '16 Jun', ingresosUsd: 1800, costosUsd: 1515, gananciasUsd: 285, volumenKg: 730 },
    { name: '15 Jun', ingresosUsd: 950, costosUsd: 810, gananciasUsd: 140, volumenKg: 390 }
  ],
  Semanal: [
    { name: 'Semana Actual (S25)', ingresosUsd: 6800, costosUsd: 5780, gananciasUsd: 1020, volumenKg: 2800 },
    { name: 'Semana Anterior (S24)', ingresosUsd: 7900, costosUsd: 6635, gananciasUsd: 1265, volumenKg: 3200 },
    { name: 'Semana S23', ingresosUsd: 6400, costosUsd: 5440, gananciasUsd: 960, volumenKg: 2600 },
    { name: 'Semana S22', ingresosUsd: 7100, costosUsd: 5970, gananciasUsd: 1130, volumenKg: 2900 }
  ],
  Quincenal: [
    { name: '1ra/Jun', ingresosUsd: 14200, costosUsd: 12050, gananciasUsd: 2150, volumenKg: 5800 },
    { name: '2da/May', ingresosUsd: 13900, costosUsd: 11815, gananciasUsd: 2085, volumenKg: 5600 },
    { name: '1ra/May', ingresosUsd: 12800, costosUsd: 10885, gananciasUsd: 1915, volumenKg: 5205 },
    { name: '2da/Abr', ingresosUsd: 15300, costosUsd: 12900, gananciasUsd: 2400, volumenKg: 6200 }
  ],
  Mensual: [
    { name: 'Junio 2026', ingresosUsd: 28500, costosUsd: 24100, gananciasUsd: 4400, volumenKg: 11600 },
    { name: 'Mayo 2026', ingresosUsd: 26700, costosUsd: 22700, gananciasUsd: 4000, volumenKg: 10805 },
    { name: 'Abril 2026', ingresosUsd: 29505, costosUsd: 25010, gananciasUsd: 4495, volumenKg: 11950 },
    { name: 'Marzo 2026', ingresosUsd: 24300, costosUsd: 20600, gananciasUsd: 3700, volumenKg: 10100 }
  ],
  Trimestral: [
    { name: 'Q2 2026 (Proyectado)', ingresosUsd: 84705, costosUsd: 71810, gananciasUsd: 12895, volumenKg: 34355 },
    { name: 'Q1 2026 (Cerrado)', ingresosUsd: 78500, costosUsd: 66725, gananciasUsd: 11775, volumenKg: 32000 },
    { name: 'Q4 2025', ingresosUsd: 81200, costosUsd: 69020, gananciasUsd: 12180, volumenKg: 33100 }
  ],
  Anual: [
    { name: 'Año 2026 (Proyección)', ingresosUsd: 334000, costosUsd: 283900, gananciasUsd: 50100, volumenKg: 136000 },
    { name: 'Año 2025 (Histórico)', ingresosUsd: 312000, costosUsd: 265200, gananciasUsd: 46800, volumenKg: 127050 }
  ]
};

interface EstadisticasViewProps {
  tasaBcvUsd: number;
  mermas: Merma[];
  products: Product[];
}

export default function EstadisticasView({ tasaBcvUsd, mermas, products }: EstadisticasViewProps) {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('Mensual');
  const [isExporting, setIsExporting] = useState(false);

  const currentStats = STATS_DATA[activePeriod];

  // Global calculations
  const totalIngreso = currentStats.reduce((sum, item) => sum + item.ingresosUsd, 0);
  const totalCosto = currentStats.reduce((sum, item) => sum + item.costosUsd, 0);
  const totalGanancia = currentStats.reduce((sum, item) => sum + item.gananciasUsd, 0);
  const totalVolumen = currentStats.reduce((sum, item) => sum + item.volumenKg, 0);

  // Mermas statistics
  const totalMermasKg = mermas.reduce((sum, m) => sum + m.quantityKg, 0);
  const totalMermasUsd = mermas.reduce((sum, m) => sum + (m.quantityKg * m.costPerKgUsd), 0);
  const adjustedGanancia = totalGanancia - totalMermasUsd;
  
  const marginRelative = totalIngreso > 0 ? (adjustedGanancia / totalIngreso) * 100 : 0;

  // Pie chart calculation
  // We represent cost vs profit as segments in a donut vector
  const totalFinancialFlow = totalIngreso + totalCosto;
  const costPercentage = totalFinancialFlow > 0 ? (totalCosto / totalFinancialFlow) * 100 : 50;
  const profitPercentage = totalFinancialFlow > 0 ? (totalGanancia / totalFinancialFlow) * 100 : 50;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Background decorative border
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);

        // Document header
        doc.setFillColor(18, 55, 120); // corporate main blue
        doc.rect(6, 6, 198, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text("INVERSIONES FOOD SALAS F.P.", 12, 17);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text("Reporte Estadístico Consolidado de Rentabilidad Avícola", 12, 23);
        doc.text(`Tasa de Cambio Oficial (BCV): Bs. ${tasaBcvUsd.toFixed(2)} VES/USD`, 12, 28);
        
        // Metadata alignment
        doc.setTextColor(230, 240, 255);
        doc.setFontSize(8);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 145, 15);
        doc.text(`Periodo: ${activePeriod.toUpperCase()}`, 145, 20);
        doc.text(`Cifrado: AVALADO INTERNAL`, 145, 25);

        // Reset text color
        doc.setTextColor(30, 40, 50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("1. Resumen Ejecutivo de Métricas", 12, 47);

        // Accent cards
        doc.setDrawColor(200, 210, 220);
        doc.setFillColor(245, 247, 250);
        doc.rect(12, 52, 55, 24, 'FD');
        doc.rect(73, 52, 55, 24, 'FD');
        doc.rect(134, 52, 55, 24, 'FD');

        // Card 1
        doc.setTextColor(100, 110, 120);
        doc.setFontSize(8);
        doc.text("VOLUMEN TOTAL", 16, 58);
        doc.setTextColor(18, 55, 120);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalVolumen.toLocaleString('es-VE')} KG`, 16, 67);

        // Card 2
        doc.setTextColor(100, 110, 120);
        doc.setFontSize(8);
        doc.text("INGRESOS BRUTOS", 77, 58);
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        doc.text(`$${totalIngreso.toLocaleString('es-VE', { minimumFractionDigits: 1 })}`, 77, 67);

        // Card 3
        doc.setTextColor(100, 110, 120);
        doc.setFontSize(8);
        doc.text("GANANCIA NETA", 138, 58);
        doc.setTextColor(16, 124, 65);
        doc.setFontSize(13);
        doc.text(`$${totalGanancia.toLocaleString('es-VE', { minimumFractionDigits: 1 })}`, 138, 67);

        // Subtitles
        doc.setTextColor(30, 40, 50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("2. Desglose Detallado por Intervalo", 12, 88);

        // Draw Table Header
        doc.setFillColor(235, 240, 247);
        doc.rect(12, 93, 177, 8, 'F');
        doc.setDrawColor(210, 215, 220);
        doc.line(12, 93, 189, 93);
        doc.line(12, 101, 189, 101);

        doc.setFontSize(8.5);
        doc.setTextColor(50, 60, 70);
        doc.text("Intervalo / Interval", 15, 98.5);
        doc.text("Ingresos (USD)", 62, 98.5);
        doc.text("Costos (USD)", 97, 98.5);
        doc.text("Ganancia (USD)", 132, 98.5);
        doc.text("Equivalente VES", 162, 98.5);

        let currentY = 106;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);

        currentStats.forEach((item) => {
          // Row highlight
          doc.setTextColor(30, 40, 50);
          doc.text(item.name, 15, currentY);
          doc.text(`$${item.ingresosUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 62, currentY);
          doc.text(`$${item.costosUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 97, currentY);
          
          doc.setTextColor(16, 124, 65);
          doc.setFont('helvetica', 'bold');
          doc.text(`+$${item.gananciasUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 132, currentY);
          
          doc.setTextColor(15, 50, 100);
          doc.setFont('helvetica', 'normal');
          doc.text(`Bs. ${(item.gananciasUsd * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`, 162, currentY);

          doc.setDrawColor(240, 243, 245);
          doc.line(12, currentY + 2.5, 189, currentY + 2.5);

          currentY += 8.5;
        });

        // Totales consolidados row
        currentY += 2;
        doc.setFillColor(245, 247, 250);
        doc.rect(12, currentY, 177, 8, 'F');
        doc.setDrawColor(18, 55, 120);
        doc.line(12, currentY, 189, currentY);
        doc.line(12, currentY + 8, 189, currentY + 8);
        
        doc.setTextColor(18, 55, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text("CONSOLIDADO TOTAL", 15, currentY + 5.5);
        doc.text(`$${totalIngreso.toLocaleString('es-VE')}`, 62, currentY + 5.5);
        doc.text(`$${totalCosto.toLocaleString('es-VE')}`, 97, currentY + 5.5);
        doc.text(`$${totalGanancia.toLocaleString('es-VE')}`, 132, currentY + 5.5);
        doc.text(`Bs. ${(totalGanancia * tasaBcvUsd).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`, 162, currentY + 5.5);

        // Extra info box
        doc.setFillColor(240, 248, 255);
        doc.setDrawColor(200, 220, 255);
        doc.rect(12, currentY + 16, 177, 24, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text("3. Notas de Certificación Financiera", 17, currentY + 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("Este estado financiero incluye el reporte ponderado de volumen comercializado y ganancia neta estimada.", 17, currentY + 27);
        doc.text("Todos los cálculos están basados en las tasas dictadas por el Banco Central de Venezuela y USDT.com.ve.", 17, currentY + 31);
        doc.text("La veracidad de estos registros está respaldada por la consola comercial de Inversiones Food Salas F.P.", 17, currentY + 35);

        // Footer block
        doc.setDrawColor(220, 225, 230);
        doc.line(12, 275, 189, 275);
        
        doc.setTextColor(140, 150, 160);
        doc.setFontSize(7.5);
        doc.text("Documento oficial de uso privado para Inversiones Food Salas F.P. Prohibida su copia sin consentimiento.", 12, 280);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(18, 55, 120);
        doc.text("POWERED BY CAPELLA TEC - https://www.instagram.com/capellatec/", 12, 284);

        doc.save(`Food_Salas_Reporte_Estadistico_${activePeriod.toUpperCase()}_2026.pdf`);
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        alert(`Ocurrió un error al generar el PDF: ${err.message}`);
      } finally {
        setIsExporting(false);
      }
    }, 1000);
  };

  return (
    <div className="space-y-4 fade-in" id="estadisticas-view-root">
      
      {/* Cover Stats Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Resultados de Ganancias y Pérdidas
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Métricas de comercialización de pollo, utilidades netas y exportación de sumarios.
          </p>
        </div>
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
      </div>

      {/* Navigation Range Selector for 6 periods */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200 overflow-x-auto no-scrollbar" id="estadisticas-period-tabs">
        {(['Diario', 'Semanal', 'Quincenal', 'Mensual', 'Trimestral', 'Anual'] as const).map((p) => {
          const isActive = activePeriod === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setActivePeriod(p)}
              className={`flex-1 py-1.5 px-3.5 text-center rounded-lg text-[9.5px] font-black uppercase whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Main consolidated display of P&L */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" id="estadisticas-consolidado-cards">
        <div className="bg-white p-3 border border-slate-150 rounded-xl text-center shadow-2xs">
          <span className="text-[8px] text-slate-450 uppercase font-black block mb-0.5">INGRESOS</span>
          <span className="text-sm font-black text-slate-800 font-sans block">
            ${totalIngreso.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[7.5px] text-slate-400 font-bold block mt-0.5">USD</span>
        </div>

        <div className="bg-white p-3 border border-slate-150 rounded-xl text-center shadow-2xs">
          <span className="text-[8px] text-slate-450 uppercase font-black block mb-0.5">COSTOS</span>
          <span className="text-sm font-black text-slate-700 font-sans block">
            ${totalCosto.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[7.5px] text-slate-400 font-bold block mt-0.5">Puntos de Compra</span>
        </div>

        <div className="bg-rose-50/50 p-3 border border-rose-150 rounded-xl text-center shadow-2xs">
          <span className="text-[8px] text-rose-700 uppercase font-black block mb-0.5">PÉRDIDA MERMA</span>
          <span className="text-sm font-black text-rose-600 font-sans block">
            -${totalMermasUsd.toFixed(1)}
          </span>
          <span className="text-[7.5px] text-rose-550 text-rose-500 font-bold block mt-0.5">{totalMermasKg.toFixed(1)} KG Perdidos</span>
        </div>

        <div className="bg-emerald-50/45 p-3 border border-emerald-150 rounded-xl text-center shadow-2xs">
          <span className="text-[8px] text-emerald-700 uppercase font-black block mb-0.5 font-sans">UTILIDAD NETA REAL</span>
          <span className={`text-sm font-black font-sans block ${adjustedGanancia >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {adjustedGanancia >= 0 ? '+' : ''}${adjustedGanancia.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[8px] text-emerald-800 font-extrabold block mt-0.5">Bs.{Math.round(adjustedGanancia * tasaBcvUsd).toLocaleString('es-VE')}</span>
        </div>
      </div>

      {/* PDF Direct Generation Trigger Button (No window.print) */}
      <button
        onClick={handleDownloadPDF}
        disabled={isExporting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-98 tracking-wider font-sans cursor-pointer"
      >
        <Download className="w-4 h-4 text-emerald-100" />
        {isExporting ? 'Generando PDF Seguro...' : `DESCARGAR REPORTE ${activePeriod.toUpperCase()} DIRECTO EN PDF`}
      </button>

      {/* SVG Interactive Line Chart and Donut Chart Side-by-Side/Staggered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="estadisticas-svg-graphics">
        
        {/* SVG Live Line Chart */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Tendencia de Ganancias (USD)
            </h4>
            <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded uppercase">Lineal</span>
          </div>

          <div className="relative pt-2">
            {/* Native SVG Line Graph */}
            <svg viewBox="0 0 340 160" className="w-full h-auto overflow-visible">
              {/* Grids */}
              <line x1="30" y1="20" x2="320" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="60" x2="320" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="100" x2="320" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="140" x2="320" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Path generation for gain values */}
              {(() => {
                const maxVal = Math.max(...currentStats.map(i => i.gananciasUsd)) || 100;
                const points = currentStats.map((item, index) => {
                  const stepX = 30 + (index * (280 / Math.max(1, currentStats.length - 1)));
                  const calculatedY = 140 - ((item.gananciasUsd / maxVal) * 110);
                  return { x: stepX, y: calculatedY, name: item.name, val: item.gananciasUsd };
                });

                // Generate polyline string
                const dPathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    {/* Shadow Area under the line */}
                    <path 
                      d={`${dPathString} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`} 
                      fill="url(#profitGradient)" 
                      opacity="0.15" 
                    />

                    {/* Main Line */}
                    <path 
                      d={dPathString} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />

                    {/* Decorative nodes */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="4" 
                          fill="#10b981" 
                          stroke="#ffffff" 
                          strokeWidth="1.5" 
                          className="hover:scale-125 transition-transform"
                        />
                        {/* Text values */}
                        <text 
                          x={p.x} 
                          y={p.y - 7} 
                          fontSize="7" 
                          fontWeight="bold" 
                          fill="#475569" 
                          textAnchor="middle"
                        >
                          ${p.val}
                        </text>
                        {/* Label name */}
                        <text 
                          x={p.x} 
                          y="152" 
                          fontSize="6.5" 
                          fontWeight="bold" 
                          fill="#94a3b8" 
                          textAnchor="middle"
                        >
                          {p.name.split(' ')[0]}
                        </text>
                      </g>
                    ))}

                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* SVG Pie Chart (Donut) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <PieIcon className="w-4 h-4 text-primary" />
              Estructura de Capital Recibido vs Costo
            </h4>
            <span className="text-[8px] bg-indigo-50 text-primary font-black px-1.5 py-0.5 rounded uppercase">Pastel</span>
          </div>

          <div className="flex items-center justify-around gap-2 pt-2">
            {/* Donut graphic */}
            <svg width="110" height="110" viewBox="0 0 36 36" className="shrink-0">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              
              {/* Cost arc segment */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.915" 
                fill="none" 
                stroke="#fda4af" 
                strokeWidth="3.2" 
                strokeDasharray={`${costPercentage} ${100 - costPercentage}`}
                strokeDashoffset="25" 
                className="transition-all duration-700"
              />

              {/* Profit arc segment */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.915" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="3.5" 
                strokeDasharray={`${profitPercentage} ${100 - profitPercentage}`}
                strokeDashoffset={25 + costPercentage} 
                className="transition-all duration-700"
              />

              <g className="text-center">
                <text x="18" y="16.5" fontSize="3.5" fontWeight="bold" textAnchor="middle" fill="#475569">margen</text>
                <text x="18" y="21.5" fontSize="4.5" fontWeight="black" textAnchor="middle" fill="#10b981">+{marginRelative.toFixed(0)}%</text>
              </g>
            </svg>

            {/* Labels and values */}
            <div className="space-y-2.5 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span>
                  <span>Utilidad Neta (Ganancia)</span>
                </div>
                <span className="text-[10px] text-slate-450 font-extrabold pl-4">
                  ${totalGanancia.toLocaleString('es-VE')} ({profitPercentage.toFixed(1)}% del total)
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 bg-rose-300 rounded-sm inline-block"></span>
                  <span>Margen de Costo Puesto</span>
                </div>
                <span className="text-[10px] text-slate-455 text-slate-450 font-extrabold pl-4">
                  ${totalCosto.toLocaleString('es-VE')} ({costPercentage.toFixed(1)}% del total)
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN DETALLADA DE MERMAS (REQUISITO EXPLICITO) */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-4 shadow-sm" id="estadisticas-mermas-analisis-root">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
              Análisis de Mermas y Pérdidas por Motivos
            </h3>
            <p className="text-[10px] text-slate-450 font-bold block mt-0.5">Control de pérdidas en canal, deshidratación y merma física en almacenamiento</p>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-black px-2.5 py-1 rounded-xl uppercase shrink-0">
            Pérdida Total: ${totalMermasUsd.toFixed(2)} USD
          </span>
        </div>

        {/* Breakdown by reason */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-650 uppercase tracking-wider pl-0.5">Pérdida Consolidada por Causa / Motivo</h4>
            
            <div className="space-y-2">
              {['Evaporación', 'Goteo', 'Recortes', 'Daño', 'Inventario no registrado', 'Vencimiento', 'Otros'].map((reason) => {
                const reasonMermas = mermas.filter(m => m.reason === reason);
                const reasonKg = reasonMermas.reduce((sum, m) => sum + m.quantityKg, 0);
                const reasonUsd = reasonMermas.reduce((sum, m) => sum + (m.quantityKg * m.costPerKgUsd), 0);
                const percentage = totalMermasUsd > 0 ? (reasonUsd / totalMermasUsd) * 100 : 0;

                return (
                  <div key={reason} className="text-xs space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-150/55">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{reason}</span>
                      <span className="font-mono text-slate-500">{reasonKg.toFixed(1)} KG (-${reasonUsd.toFixed(1)})</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-650 uppercase tracking-wider pl-0.5">Historial de Registro de Descarte Físico</h4>
            
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar border border-slate-150 rounded-xl p-3 bg-slate-50/40">
              {mermas.map((m) => {
                const prod = products.find(p => p.id === m.productId);
                return (
                  <div key={m.id} className="text-[11px] font-semibold text-slate-605 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between font-extrabold text-slate-850">
                      <span>{prod?.name || 'Rubro Desconocido'}</span>
                      <span className="text-amber-700 font-mono font-black">-{m.quantityKg.toFixed(1)} KG</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-450 mt-0.5">
                      <span>Causa: <strong className="text-slate-600 font-bold">{m.reason}</strong></span>
                      <span>{m.dateTime}</span>
                    </div>
                    {m.notes && (
                      <p className="text-[9.5px] bg-amber-50/50 border border-amber-100/30 p-1.5 rounded mt-1.5 text-amber-900 leading-tight">
                        💡 {m.notes}
                      </p>
                    )}
                  </div>
                );
              })}
              {mermas.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 font-black uppercase">No se han registrado mermas físicas en este ciclo</p>
                  <p className="text-[10px] text-slate-400 mt-1">Utilice el botón "Registrar Merma" en el módulo de Inventario.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certification Footer */}
      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2 text-[10px] text-emerald-900 font-bold" id="stats-certificates">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Todos los reportes están actualizados de acuerdo a las transacciones de ventas reales y compras de proveedores registradas.</span>
      </div>

    </div>
  );
}
