import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const [chartView, setChartView] = useState('category');
  const [hovered, setHovered] = useState(null);
  const [assets, setAssets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsData, logsData] = await Promise.all([
        api.getAssets(),
        api.getLogs()
      ]);
      setAssets(assetsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Listen to updates from other pages
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('inventory-updated', handleUpdate);
    return () => {
      window.removeEventListener('inventory-updated', handleUpdate);
    };
  }, []);

  // Compute Stats
  const totalAssets = assets.length;
  const inMaintenance = assets.filter(a => a.status === 'Maintenance').length;
  const operativeAssets = assets.filter(a => a.status !== 'Maintenance' && a.status !== 'Decommissioned').length;
  
  const totalValueNum = assets.reduce((sum, a) => {
    const cleanVal = parseInt(a.value.replace(/[^0-9]/g, '') || 0);
    return sum + cleanVal;
  }, 0);

  const formattedValue = totalValueNum >= 1000000 
    ? `$${(totalValueNum / 1000000).toFixed(2)}M` 
    : `$${totalValueNum.toLocaleString('es-CO')}`;

  const stats = [
    {
      label: 'Total de Activos', value: totalAssets, change: '+1 registrado recientemente', up: true,
      icon: 'inventory_2',
      iconColor: '#15803d', iconBg: 'rgba(124, 58, 237,0.1)',
      cls: 'stat-electric',
    },
    {
      label: 'En Mantenimiento', value: inMaintenance, change: inMaintenance > 0 ? 'Equipos en reparación' : 'Sin pendientes', up: inMaintenance === 0,
      icon: 'build',
      iconColor: '#b45309', iconBg: 'rgba(217,119,6,0.1)',
      cls: 'stat-amber',
    },
    {
      label: 'Activos Operativos', value: operativeAssets, change: totalAssets > 0 ? `${Math.round((operativeAssets/totalAssets)*100)}% de utilización` : '100% de utilización', up: true,
      icon: 'check_circle',
      iconColor: '#047857', iconBg: 'rgba(5,150,105,0.1)',
      cls: 'stat-emerald',
    },
    {
      label: 'Valor del Portafolio', value: formattedValue, change: '100% valor libro', up: true,
      icon: 'payments',
      iconColor: '#6d28d9', iconBg: 'rgba(124,58,237,0.1)',
      cls: 'stat-violet',
    },
  ];

  // Compute Dynamic Chart Data
  const categoryCounts = {};
  const locationCounts = {};
  
  assets.forEach(a => {
    const cat = a.category || 'Otros';
    const loc = a.location || 'Oficina';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  const getBarColor = (name, type) => {
    if (type === 'category') {
      if (name.toLowerCase().includes('laptop')) return '#7c3aed';
      if (name.toLowerCase().includes('display') || name.toLowerCase().includes('pantalla')) return '#0d9488';
      if (name.toLowerCase().includes('net') || name.toLowerCase().includes('red')) return '#7c3aed';
      return '#d97706';
    } else {
      if (name.toLowerCase().includes('ny') || name.toLowerCase().includes('york')) return '#7c3aed';
      if (name.toLowerCase().includes('sf') || name.toLowerCase().includes('francisco')) return '#0d9488';
      if (name.toLowerCase().includes('remoto')) return '#7c3aed';
      return '#d97706';
    }
  };

  const chartData = {
    category: Object.keys(categoryCounts).map(name => {
      const count = categoryCounts[name];
      const maxCount = Math.max(...Object.values(categoryCounts), 1);
      const pct = Math.round((count / maxCount) * 100);
      return { name, count, pct, color: getBarColor(name, 'category') };
    }),
    location: Object.keys(locationCounts).map(name => {
      const count = locationCounts[name];
      const maxCount = Math.max(...Object.values(locationCounts), 1);
      const pct = Math.round((count / maxCount) * 100);
      return { name, count, pct, color: getBarColor(name, 'location') };
    })
  };

  // If dynamic chart data is empty, populate fallback
  if (chartData.category.length === 0) {
    chartData.category = [
      { name: 'Laptops', count: 0, pct: 10, color: '#7c3aed' },
      { name: 'Servidores', count: 0, pct: 10, color: '#0d9488' }
    ];
  }
  if (chartData.location.length === 0) {
    chartData.location = [
      { name: 'Sede — NY', count: 0, pct: 10, color: '#7c3aed' },
      { name: 'Remoto', count: 0, pct: 10, color: '#7c3aed' }
    ];
  }

  // Quick Action Handlers
  const handleNewAsset = () => {
    window.dispatchEvent(new CustomEvent('open-new-asset-modal'));
  };

  const handleScanQR = () => {
    const randomAsset = assets.length > 0 ? assets[Math.floor(Math.random() * assets.length)] : null;
    if (randomAsset) {
      navigate(`/assets/${randomAsset.id}`);
    } else {
      alert("No hay activos disponibles para escanear. Registre un nuevo activo primero.");
    }
  };

  const handleStartAudit = async () => {
    const name = prompt("Ingrese el nombre de la nueva sesión de auditoría:", "Auditoría Rápida Dashboard");
    if (!name) return;
    try {
      await api.createAuditSession({
        name,
        totalChecked: assets.length,
        compliance: '100%'
      });
      navigate('/audit');
    } catch (err) {
      alert("Error al iniciar la auditoría: " + err.message);
    }
  };

  const handleExportPDF = () => {
    if (assets.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', { 
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' 
    });
    const timeStr = now.toLocaleTimeString('es-CO', { 
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' 
    });

    // ── Header background ──────────────────────────────────────────
    doc.setFillColor(18, 10, 50);
    doc.rect(0, 0, pageW, 38, 'F');

    // Gradient accent bar (top edge)
    const accentColors = [[124, 58, 237], [6, 182, 212], [167, 139, 250]];
    const segW = pageW / accentColors.length;
    accentColors.forEach(([r, g, b], i) => {
      doc.setFillColor(r, g, b);
      doc.rect(i * segW, 0, segW + 1, 2, 'F');
    });

    // Company name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('SMA LATB STOCK', 14, 16);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(167, 139, 250);
    doc.text('Sistema de Gestión de Inventario Tecnológico', 14, 23);

    // Report title (right side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('REPORTE EJECUTIVO DE INVENTARIO', pageW - 14, 15, { align: 'right' });

    // Date/time (right side)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado: ${dateStr} · ${timeStr.toUpperCase()}`, pageW - 14, 22, { align: 'right' });
    doc.text(`Total de Activos: ${assets.length}`, pageW - 14, 28, { align: 'right' });

    // ── KPI summary cards ──────────────────────────────────────────
    const kpis = [
      { label: 'Total Activos',     value: String(totalAssets),    color: [124, 58, 237] },
      { label: 'Activos Operativos', value: String(operativeAssets), color: [5, 150, 105] },
      { label: 'En Mantenimiento',  value: String(inMaintenance),   color: [217, 119, 6] },
      { label: 'Valor Portafolio',  value: formattedValue,          color: [99, 102, 241] },
    ];

    const cardW = (pageW - 28 - 9) / 4;
    const cardY = 44;
    kpis.forEach(({ label, value, color }, i) => {
      const x = 14 + i * (cardW + 3);
      // Card bg
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, cardY, cardW, 22, 3, 3, 'F');
      // Left accent stripe
      doc.setFillColor(...color);
      doc.roundedRect(x, cardY, 3, 22, 1.5, 1.5, 'F');
      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...color);
      doc.text(value, x + cardW / 2 + 1.5, cardY + 10, { align: 'center' });
      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), x + cardW / 2 + 1.5, cardY + 17, { align: 'center' });
    });

    // ── Section heading ────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('DETALLE COMPLETO DE ACTIVOS', 14, 76);
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.5);
    doc.line(14, 78, 80, 78);

    // ── Assets table ───────────────────────────────────────────────
    const statusColor = (status) => {
      if (status === 'Active')        return [5, 150, 105];
      if (status === 'Maintenance')   return [217, 119, 6];
      if (status === 'Decommissioned') return [220, 38, 38];
      if (status === 'Available')     return [37, 99, 235];
      return [100, 116, 139];
    };
    const statusLabel = (status) => {
      if (status === 'Active')        return 'Activo';
      if (status === 'Maintenance')   return 'Mantenimiento';
      if (status === 'Decommissioned') return 'Baja';
      if (status === 'Available')     return 'Disponible';
      return status;
    };

    autoTable(doc, {
      startY: 81,
      margin: { left: 14, right: 14 },
      head: [['#', 'ID', 'Nombre del Equipo', 'Categoría', 'Estado', 'Asignatario', 'Ubicación', 'Valor', 'N° Serie']],
      body: assets.map((a, idx) => [
        idx + 1,
        a.id,
        a.name,
        a.category,
        statusLabel(a.status),
        a.assignee || 'Disponible',
        a.location,
        a.value,
        a.serial || '—',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        font: 'helvetica',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: [18, 10, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0:  { cellWidth: 8,  halign: 'center', textColor: [148, 163, 184] },
        1:  { cellWidth: 22, fontStyle: 'bold', textColor: [124, 58, 237] },
        2:  { cellWidth: 52 },
        3:  { cellWidth: 30 },
        4:  { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
        5:  { cellWidth: 36 },
        6:  { cellWidth: 28 },
        7:  { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
        8:  { cellWidth: 'auto' },
      },
      didParseCell(data) {
        // Color-code the Status column
        if (data.column.index === 4 && data.section === 'body') {
          const raw = assets[data.row.index]?.status;
          const [r, g, b] = statusColor(raw);
          data.cell.styles.textColor = [r, g, b];
        }
      },
      didDrawPage(data) {
        // ── Footer on every page ──
        const footerY = doc.internal.pageSize.getHeight() - 8;
        doc.setFillColor(18, 10, 50);
        doc.rect(0, footerY - 5, pageW, 16, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Sma Latb Stock · Documento Confidencial · Uso Interno', 14, footerY + 2);
        doc.text(
          `Página ${doc.internal.getCurrentPageInfo().pageNumber} · ${dateStr}`,
          pageW - 14, footerY + 2, { align: 'right' }
        );
      },
    });

    doc.save(`reporte_inventario_sma_latb_${now.toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="relative rounded-2xl px-7 py-6 overflow-hidden flex items-center justify-between welcome-banner-override transition-all duration-300"
      >
        {/* Accent top border */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
          background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #a78bfa)',
        }} />
        {/* Subtle right gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at right center, rgba(124, 58, 237,0.08) 0%, transparent 70%)',
        }} />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-widest mb-1">Bienvenido de nuevo</p>
          <h2 className="text-[22px] font-bold text-slate-800 leading-tight">
            Panel <span className="text-gradient-electric">Ejecutivo</span>
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">Resumen de activos en tiempo real · Q2 2026</p>
        </div>

        <div className="relative z-10 hidden lg:flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background: 'rgba(124, 58, 237,0.08)', border: '1px solid rgba(124, 58, 237,0.2)' }}
          >
            <span className="dot-pulse" style={{ color: '#7c3aed', background: '#7c3aed' }} />
            <span className="text-[12px] font-semibold text-violet-800">Monitoreo en Vivo</span>
          </div>
          <button onClick={handleExportPDF} className="btn-electric flex items-center gap-2 text-[13px]">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>picture_as_pdf</span>
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`card relative overflow-hidden ${stat.cls} cursor-default`}
            style={{ padding: '22px' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: stat.iconBg, border: `1px solid ${stat.iconColor}20` }}
            >
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px', color: stat.iconColor }}>
                {stat.icon}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-[26px] font-bold text-slate-800 leading-none mb-2 tracking-tight">{stat.value}</div>

            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined icon-filled"
                style={{ fontSize: '13px', color: stat.up ? '#15803d' : '#b91c1c' }}
              >
                {stat.up ? 'trending_up' : 'trending_down'}
              </span>
              <span className="text-[11px]" style={{ color: stat.up ? '#15803d' : '#b91c1c' }}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Chart + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Chart Card */}
        <div className="xl:col-span-8 card" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Distribución del Inventario</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Desglose por {chartView === 'category' ? 'categoría de hardware' : 'ubicación de oficina'}</p>
            </div>
            <div
              className="flex p-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)]"
            >
              {['category', 'location'].map(v => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 ${
                    chartView === v
                      ? 'bg-[var(--bg-card)] text-violet-700 border border-[var(--border-light)] shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {v === 'category' ? 'Por Categoría' : 'Por Ubicación'}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div
            className="relative rounded-xl flex items-end justify-around px-6 pb-8 pt-4 gap-4 chart-backdrop-override transition-all duration-300"
            style={{ height: '260px' }}
          >
            {/* Y-axis grid lines */}
            <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25].map(pct => (
                <div key={pct} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono w-5 text-right flex-shrink-0">{pct}</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 transition-colors duration-300" />
                </div>
              ))}
            </div>

            {chartData[chartView].map((bar, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center justify-end h-full cursor-pointer"
                style={{ flex: 1, zIndex: 10 }}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
              >
                {hovered === idx && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-center animate-fade-in whitespace-nowrap z-20"
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${bar.color}30`,
                      boxShadow: `0 4px 16px rgba(15,23,42,0.1)`,
                    }}
                  >
                    <div className="text-[13px] font-bold text-slate-800">{bar.count.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">unidades</div>
                  </div>
                )}

                <div
                  className="w-full rounded-t-xl relative overflow-hidden transition-all duration-300"
                  style={{
                    height: `${bar.pct}%`,
                    background: hovered === idx
                      ? `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}cc 100%)`
                      : `linear-gradient(180deg, ${bar.color}cc 0%, ${bar.color}66 100%)`,
                    border: `1px solid ${bar.color}30`,
                    borderBottom: 'none',
                    boxShadow: hovered === idx ? `0 4px 16px ${bar.color}30` : 'none',
                  }}
                />
                <span className="absolute -bottom-6 text-[11px] text-slate-500 font-medium whitespace-nowrap">{bar.name}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6">
            {chartData[chartView].map((bar, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: bar.color }} />
                <span className="text-[12px] text-slate-500">{bar.name}</span>
                <span className="text-[12px] font-semibold text-slate-700">{bar.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="xl:col-span-4 card flex flex-col overflow-hidden" style={{ padding: '0' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Registro de Actividad</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Flujo de eventos en vivo</p>
            </div>
            <button onClick={() => navigate('/audit')} className="text-[12px] text-violet-700 hover:text-violet-800 font-medium transition-colors">Ver todo</button>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-50">
            {logs.slice(0, 4).map((log) => {
              const getBadgeCls = (action) => {
                if (action === 'Registro') return 'badge-violet';
                if (action === 'Asignación') return 'badge-electric';
                if (action === 'Mantenimiento') return 'badge-amber';
                if (action === 'Auditoría') return 'badge-emerald';
                if (action === 'Baja') return 'badge-rose';
                return 'badge-slate';
              };

              return (
                <div key={log.id} onClick={() => navigate('/audit')} className="flex gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div
                    className="w-8 h-8 rounded-xl flex-shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ background: log.iconBg }}
                  >
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: '15px', color: log.iconColor }}>
                      {log.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                        {log.action} por {log.user}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{log.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{log.detail}</p>
                    <span className={`badge mt-2 ${getBadgeCls(log.action)}`}>{log.action}</span>
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="p-8 text-center text-[12px] text-slate-400">
                No hay actividades recientes.
              </div>
            )}
          </div>

          <div className="px-5 py-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => navigate('/audit')}
              className="w-full py-2 rounded-xl text-[12px] font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
              style={{ border: '1px solid rgba(124, 58, 237,0.15)' }}
            >
              Ver Registro de Eventos Completo
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
