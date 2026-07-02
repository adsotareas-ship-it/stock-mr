import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const ACTION_COLORS = {
  'Asignación':   { text: '#15803d', bg: 'rgba(124, 58, 237,0.08)',    border: 'rgba(124, 58, 237,0.2)' },
  'Mantenimiento': { text: '#b45309', bg: 'rgba(217,119,6,0.08)',    border: 'rgba(217,119,6,0.2)' },
  'Registro':      { text: '#6d28d9', bg: 'rgba(124,58,237,0.08)',   border: 'rgba(124,58,237,0.2)' },
  'Modificación':  { text: '#0d9488', bg: 'rgba(13,148,136,0.08)',   border: 'rgba(13,148,136,0.2)' },
  'Auditoría':     { text: '#1d4ed8', bg: 'rgba(37,99,235,0.08)',    border: 'rgba(37,99,235,0.2)' },
  'Baja':          { text: '#b91c1c', bg: 'rgba(220,38,38,0.08)',    border: 'rgba(220,38,38,0.2)' },
};

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [auditSessions, setAuditSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [sessionsData, logsData] = await Promise.all([
          api.getAuditSessions(),
          api.getLogs()
        ]);
        if (isMounted) {
          setAuditSessions(sessionsData);
          setLogs(logsData);
        }
      } catch (err) {
        console.error("Error loading audit data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Reset page when search or action filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter]);

  const handleNewConciliation = async () => {
    const name = prompt("Ingrese el nombre de la sesión de conciliación:", "Auditoría Física Express");
    if (!name) return;
    try {
      await api.createAuditSession({
        name,
        totalChecked: Math.floor(50 + Math.random() * 200),
        compliance: `${(95 + Math.random() * 5).toFixed(1)}%`
      });
      // Reload
      const [sessionsData, logsData] = await Promise.all([
        api.getAuditSessions(),
        api.getLogs()
      ]);
      setAuditSessions(sessionsData);
      setLogs(logsData);
    } catch (err) {
      alert("Error al crear la auditoría: " + err.message);
    }
  };

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.user.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-widest mb-1">Auditoría</p>
          <h2 className="text-[20px] font-bold text-slate-800 leading-tight">Registro de Auditoría</h2>
          <p className="text-[13px] text-slate-500 mt-1">Inspecciona la bitácora de eventos y la bitácora de cambios del sistema</p>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="text-[15px] font-bold text-slate-800">Bitácora de Eventos de Seguridad</h3>

          {/* Inline filters */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '14px' }}>search</span>
              <input
                type="text"
                placeholder="Filtrar por usuario, detalle, id..."
                className="input-premium w-full pl-8 pr-2 py-1.5 text-[12px]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="input-premium appearance-none pl-2.5 pr-7 py-1.5 text-[12px] cursor-pointer"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
              >
                <option value="">Todas las Acciones</option>
                {Object.keys(ACTION_COLORS).map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '14px' }}>expand_more</span>
            </div>
          </div>
        </div>

        {/* Logs Timeline */}
        <div
          className="rounded-2xl bg-white overflow-hidden"
          style={{ border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}
        >
          <div className="divide-y divide-slate-100">
            {paginatedLogs.length > 0 ? paginatedLogs.map((log) => {
              const ac = ACTION_COLORS[log.action] || { text: '#475569', bg: '#f1f5f9', border: 'transparent' };
              return (
                <div key={log.id} className="flex gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                  {/* Action Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: log.iconBg }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: log.iconColor }}>{log.icon}</span>
                  </div>

                  {/* Log details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-700">{log.user}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({log.email})</span>
                        <span
                          className="badge text-[9px] font-bold"
                          style={{ color: ac.text, background: ac.bg, border: `1px solid ${ac.border}` }}
                        >
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{log.time}</span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 leading-relaxed">{log.detail}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">ID Transacción: {log.id}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-[13px] text-slate-400">
                No se encontraron logs de eventos que coincidan con los filtros.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && filteredLogs.length > 0 && (
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}
            >
              <span className="text-[12px] text-slate-400">
                Mostrando <span className="text-slate-600 font-medium">{startIndex + 1}</span> a <span className="text-slate-600 font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)}</span> de <span className="text-slate-600 font-medium">{filteredLogs.length}</span> registros
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className="w-7 h-7 rounded-lg text-[12px] font-medium transition-all duration-150"
                    style={n === currentPage
                      ? { background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.2)' }
                      : { background: '#ffffff', color: '#94a3b8', border: '1px solid rgba(15, 23, 42, 0.08)' }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
