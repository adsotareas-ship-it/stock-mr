import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

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
    : `$${totalValueNum.toLocaleString('en-US')}`;

  const stats = [
    {
      label: 'Total de Activos', value: totalAssets, change: '+1 registrado recientemente', up: true,
      icon: 'inventory_2',
      iconColor: '#15803d', iconBg: 'rgba(22,163,74,0.1)',
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
      if (name.toLowerCase().includes('laptop')) return '#16a34a';
      if (name.toLowerCase().includes('display') || name.toLowerCase().includes('pantalla')) return '#0d9488';
      if (name.toLowerCase().includes('net') || name.toLowerCase().includes('red')) return '#7c3aed';
      return '#d97706';
    } else {
      if (name.toLowerCase().includes('ny') || name.toLowerCase().includes('york')) return '#16a34a';
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
      { name: 'Laptops', count: 0, pct: 10, color: '#16a34a' },
      { name: 'Servidores', count: 0, pct: 10, color: '#0d9488' }
    ];
  }
  if (chartData.location.length === 0) {
    chartData.location = [
      { name: 'Sede — NY', count: 0, pct: 10, color: '#16a34a' },
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

  const handleExportCSV = () => {
    if (assets.length === 0) return;
    const headers = ['ID', 'Nombre', 'Subtítulo', 'Categoría', 'Estado', 'Asignatario', 'Ubicación', 'Valor', 'Serie', 'Fecha Compra'];
    const rows = assets.map(a => [
      a.id, a.name, a.sub, a.category, a.status, a.assignee || 'Disponible', a.location, a.value, a.serial, a.purchaseDate
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_miguel_stock_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="relative rounded-2xl px-7 py-6 overflow-hidden flex items-center justify-between welcome-banner-override transition-all duration-300"
      >
        {/* Accent top border */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
          background: 'linear-gradient(90deg, #16a34a, #14b8a6, #22c55e)',
        }} />
        {/* Subtle right gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at right center, rgba(22,163,74,0.08) 0%, transparent 70%)',
        }} />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold text-green-600 uppercase tracking-widest mb-1">Bienvenido de nuevo</p>
          <h2 className="text-[22px] font-bold text-slate-800 leading-tight">
            Panel <span className="text-gradient-electric">Ejecutivo</span>
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">Resumen de activos en tiempo real · Q2 2026</p>
        </div>

        <div className="relative z-10 hidden lg:flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <span className="dot-pulse" style={{ color: '#16a34a', background: '#16a34a' }} />
            <span className="text-[12px] font-semibold text-green-700">Monitoreo en Vivo</span>
          </div>
          <button onClick={handleExportCSV} className="btn-electric flex items-center gap-2 text-[13px]">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
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
                      ? 'bg-[var(--bg-card)] text-green-600 border border-[var(--border-light)] shadow-sm'
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
            <button onClick={() => navigate('/audit')} className="text-[12px] text-green-600 hover:text-green-700 font-medium transition-colors">Ver todo</button>
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
              className="w-full py-2 rounded-xl text-[12px] font-semibold text-green-600 hover:bg-green-50 transition-colors"
              style={{ border: '1px solid rgba(22,163,74,0.15)' }}
            >
              Ver Registro de Eventos Completo
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Nuevo Activo',    icon: 'add_box',          grad: 'from-green-500 to-teal-500',   desc: 'Registrar equipo', handler: handleNewAsset },
          { label: 'Escanear QR',     icon: 'qr_code_scanner',  grad: 'from-violet-500 to-purple-600', desc: 'Búsqueda rápida de activo', handler: handleScanQR },
          { label: 'Iniciar Auditoría',icon: 'rule',              grad: 'from-emerald-500 to-teal-500',  desc: 'Control de inventario', handler: handleStartAudit },
          { label: 'Exportar CSV',    icon: 'table_view',        grad: 'from-amber-500 to-orange-500',  desc: 'Descargar registros', handler: handleExportCSV },
        ].map((qa, i) => (
          <button
            key={i}
            onClick={qa.handler}
            className="glass glass-hover rounded-xl p-4 text-left flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${qa.grad}`}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>{qa.icon}</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-700">{qa.label}</div>
              <div className="text-[11px] text-slate-400">{qa.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
