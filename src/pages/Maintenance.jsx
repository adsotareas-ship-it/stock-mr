import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const SEVERITY_CONFIG = {
  'Crítica': { text: '#b91c1c', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
  'Alta':    { text: '#ea580c', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.2)' },
  'Media':   { text: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)' },
  'Baja':    { text: '#0d9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)' },
};

const STATUS_CONFIG = {
  'Pending':     { label: 'Pendiente',     color: '#b45309', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)',    dot: '#d97706' },
  'In Progress': { label: 'En Proceso',     color: '#6d28d9', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)',   dot: '#7c3aed' },
  'Resolved':    { label: 'Resuelto',      color: '#047857', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.2)',    dot: '#0e7490' },
};

export default function Maintenance() {
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Form states for adding new incident
  const [showForm, setShowForm] = useState(false);
  const [newAssetId, setNewAssetId] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newType, setNewType] = useState('');
  const [newSeverity, setNewSeverity] = useState('Media');
  const [newTech, setNewTech] = useState('');
  const [newCost, setNewCost] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [ticketsData, assetsData] = await Promise.all([
          api.getTickets(),
          api.getAssets()
        ]);
        if (isMounted) {
          setTickets(ticketsData);
          setAssets(assetsData);
          if (assetsData.length > 0) {
            setNewAssetId(assetsData[0].id);
            setNewAssetName(assetsData[0].name);
          }
        }
      } catch (err) {
        console.error("Error loading maintenance data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleAddTicket = async (e) => {
    e.preventDefault();
    try {
      const newTicket = {
        assetId: newAssetId,
        assetName: newAssetName,
        type: newType,
        severity: newSeverity,
        tech: newTech || 'Por asignar',
        cost: newCost ? `$${newCost}` : 'N/A',
      };
      await api.createTicket(newTicket);
      
      // Reload tickets and assets
      const [ticketsData, assetsData] = await Promise.all([
        api.getTickets(),
        api.getAssets()
      ]);
      setTickets(ticketsData);
      setAssets(assetsData);
      
      setShowForm(false);
      setNewType('');
      setNewTech('');
      setNewCost('');
      
      // Dispatch custom event to notify inventory page if open
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert("Error al registrar el incidente: " + err.message);
    }
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.assetName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchSeverity = !severityFilter || t.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => t.status === 'Pending').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-widest mb-1">Mantenimiento</p>
          <h2 className="text-[20px] font-bold text-slate-800 leading-tight">Control de Incidencias</h2>
          <p className="text-[13px] text-slate-500 mt-1">Supervisa y gestiona el estado de reparación de los equipos de la empresa</p>
        </div>
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-electric flex items-center gap-1.5 text-[12px]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
            Registrar Incidente
          </button>
        </div>
      </div>

      {/* KPI Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Incidentes Totales', value: totalTickets, color: '#1e293b', bg: '#f8fafc', border: 'rgba(15,23,42,0.08)', icon: 'build_circle' },
          { label: 'Pendientes', value: pendingTickets, color: '#b45309', bg: 'rgba(217,119,6,0.05)', border: 'rgba(217,119,6,0.15)', icon: 'hourglass_empty' },
          { label: 'En Proceso', value: inProgressTickets, color: '#6d28d9', bg: 'rgba(124,58,237,0.05)', border: 'rgba(124,58,237,0.15)', icon: 'autorenew' },
          { label: 'Resueltos', value: resolvedTickets, color: '#047857', bg: 'rgba(5,150,105,0.05)', border: 'rgba(5,150,105,0.15)', icon: 'task_alt' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-xl px-5 py-4 flex items-center justify-between bg-white transition-all duration-200 hover:shadow-md"
            style={{ border: `1px solid ${kpi.border}` }}
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</div>
              <div className="text-[26px] font-bold text-slate-800 leading-none">{kpi.value}</div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Ticket Form Overlay */}
      {showForm && (
        <div className="relative rounded-2xl p-6 bg-white border border-slate-100 shadow-xl max-w-xl mx-auto w-full animate-fade-in">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-[15px] font-bold text-slate-800">Registrar Nuevo Incidente</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
          <form onSubmit={handleAddTicket} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">ID de Activo / Equipo</label>
              <select
                className="input-premium py-2 text-[12px]"
                value={newAssetId}
                onChange={e => {
                  const id = e.target.value;
                  setNewAssetId(id);
                  const selectedAsset = assets.find(a => a.id === id);
                  setNewAssetName(selectedAsset ? selectedAsset.name : 'Equipo');
                }}
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({a.status === 'Maintenance' ? 'En Mantenimiento' : 'Disponible'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Incidente / Falla</label>
              <input
                type="text"
                placeholder="Ej. Batería inflada, error de SO"
                className="input-premium py-2 text-[12px]"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Gravedad</label>
              <select
                className="input-premium py-2 text-[12px]"
                value={newSeverity}
                onChange={e => setNewSeverity(e.target.value)}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Técnico Asignado</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                className="input-premium py-2 text-[12px]"
                value={newTech}
                onChange={e => setNewTech(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Costo Estimado ($)</label>
              <input
                type="number"
                placeholder="Ej. 150"
                className="input-premium py-2 text-[12px]"
                value={newCost}
                onChange={e => setNewCost(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-electric px-5 py-2 text-[12px]"
              >
                Crear Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Row */}
      <div
        className="flex flex-wrap gap-3 items-center px-4 py-3 rounded-xl bg-white"
        style={{ border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '15px' }}>search</span>
          <input
            type="text"
            className="input-premium w-full pl-9 pr-3 py-2 text-[13px]"
            placeholder="Buscar tickets, equipos, incidentes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            className="input-premium appearance-none pl-3 pr-8 py-2 text-[13px] cursor-pointer"
            style={{ minWidth: '140px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="Pending">Pendiente</option>
            <option value="In Progress">En Proceso</option>
            <option value="Resolved">Resuelto</option>
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
        </div>

        <div className="relative">
          <select
            className="input-premium appearance-none pl-3 pr-8 py-2 text-[13px] cursor-pointer"
            style={{ minWidth: '140px' }}
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="">Todas las Gravedades</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
        </div>

        <div className="ml-auto text-[12px] text-slate-500">
          Mostrando <span className="font-semibold text-slate-700">{filtered.length}</span> de {tickets.length} incidentes
        </div>
      </div>

      {/* Tickets Table */}
      <div
        className="rounded-2xl overflow-hidden bg-white"
        style={{
          border: '1px solid rgba(15,23,42,0.07)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">ID Ticket</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Activo</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Incidente / Tipo</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Gravedad</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Técnico</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Costo</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? filtered.map((t) => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.Pending;
                const sev = SEVERITY_CONFIG[t.severity] || SEVERITY_CONFIG.Media;

                return (
                  <tr key={t.id} className="table-row-premium cursor-default group">
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-bold text-violet-700 font-mono">{t.id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <div className="text-[13px] font-semibold text-slate-700">{t.assetName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">{t.assetId}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] text-slate-600 font-medium">{t.type}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="badge text-[10px]"
                        style={{ color: sev.text, background: sev.bg, border: `1px solid ${sev.border}` }}
                      >
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] text-slate-600">{t.tech}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[12px] text-slate-500">
                      {t.cost}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-slate-400">
                      {t.date}
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className="badge inline-flex items-center gap-1.5"
                        style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                        {sc.label}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[13px] text-slate-400">
                    No se encontraron incidentes que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
