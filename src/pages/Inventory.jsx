import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { getAssetImage } from '../utils/images';
import { buildInventoryPdf } from '../utils/inventoryPdf';
import { productKey, productStats } from '../utils/products';

const STATUS_CONFIG = {
  Assigned:    { color: '#2563eb', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)',   dot: '#2563eb' },
  Available:   { color: '#047857', bg: 'rgba(5,150,105,0.08)',    border: 'rgba(5,150,105,0.2)',    dot: '#0e7490' },
  Maintenance: { color: '#b45309', bg: 'rgba(217,119,6,0.08)',    border: 'rgba(217,119,6,0.2)',    dot: '#d97706' },
  Deployed:    { color: '#6d28d9', bg: 'rgba(124,58,237,0.08)',   border: 'rgba(124,58,237,0.2)',   dot: '#7c3aed' },
  Lent:        { color: '#2563eb', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)',   dot: '#2563eb' },
};

const CATEGORY_ICONS = {
  Laptop: 'laptop', Display: 'monitor', Networking: 'router', Server: 'dns',
  Tablet: 'tablet', Mobile: 'smartphone', default: 'devices',
};

const STATUS_LABELS = {
  Assigned:    'Prestado',
  Available:   'Disponible',
  Maintenance: 'Mantenimiento',
  Deployed:    'Desplegado',
  Lent:        'Prestado',
};

const CATEGORY_LABELS = {
  Laptop:     'Laptop',
  Display:    'Pantalla',
  Networking: 'Redes',
  Server:     'Servidor',
  Tablet:     'Tablet',
  Mobile:     'Móvil',
};

export default function Inventory() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Error al cargar activos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();

    // Listen to custom updates from Sidebar/Modal global saves
    const handleUpdate = () => {
      loadAssets();
    };
    window.addEventListener('inventory-updated', handleUpdate);
    return () => window.removeEventListener('inventory-updated', handleUpdate);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, locationFilter, sortBy, sortDir]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  // Units of the same product across the whole catalog (not just the filtered rows).
  const stats = productStats(assets);
  const qtyOf = (a) => stats.get(productKey(a))?.total ?? 1;

  const filtered = assets
    .filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.assignee || '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || 
        (statusFilter === 'Lent' ? (a.status === 'Lent' || a.status === 'Assigned') : a.status === statusFilter);
      const matchLoc = !locationFilter || a.location === locationFilter;
      return matchSearch && matchStatus && matchLoc;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'quantity') {
        return (qtyOf(a) - qtyOf(b)) * dir;
      }
      if (sortBy === 'value') {
        const valA = parseFloat((a.value || '').replace(/[^0-9]/g, '')) || 0;
        const valB = parseFloat((b.value || '').replace(/[^0-9]/g, '')) || 0;
        return (valA - valB) * dir;
      }
      return (a[sortBy] || '').localeCompare(b[sortBy] || '') * dir;
    });

  const uniqueLocations = Array.from(new Set(assets.map(a => a.location).filter(Boolean))).sort();

  const SortIcon = ({ col }) => (
    <span className="material-symbols-outlined ml-1 opacity-30" style={{ fontSize: '13px' }}>
      {sortBy === col ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
    </span>
  );



  const handleExportPDF = async () => {
    if (filtered.length === 0) return;
    const { doc, filename } = await buildInventoryPdf({
      assets,
      filtered,
      filters: { status: statusFilter, location: locationFilter, search },
      statusLabels: STATUS_LABELS,
      categoryLabels: CATEGORY_LABELS,
    });
    doc.save(filename);
  };

  const handleOpenNewAssetModal = () => {
    window.dispatchEvent(new CustomEvent('open-new-asset-modal'));
  };

  const summaryItems = [
    { label: 'Total',           count: assets.length,                                          color: '#15803d', bg: 'rgba(124, 58, 237,0.08)', filter: '' },
    { label: 'Disponible',      count: assets.filter(a => a.status === 'Available').length,    color: '#047857', bg: 'rgba(5,150,105,0.08)', filter: 'Available' },
    { label: 'Prestado',        count: assets.filter(a => a.status === 'Lent' || a.status === 'Assigned').length,         color: '#2563eb', bg: 'rgba(37,99,235,0.08)', filter: 'Lent' },
    { label: 'Mantenimiento',   count: assets.filter(a => a.status === 'Maintenance').length,  color: '#b45309', bg: 'rgba(217,119,6,0.08)', filter: 'Maintenance' },
  ];

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAssets = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-widest mb-1">Inventario</p>
          <h2 className="text-[20px] font-bold text-slate-800 leading-tight">Registro de Activos</h2>
          <p className="text-[13px] text-slate-500 mt-1">Monitorea y gestiona todos los activos de hardware de la organización</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">

          <button 
            onClick={handleExportPDF}
            disabled={isLoading || filtered.length === 0}
            className="btn-ghost flex items-center gap-1.5 text-[12px] disabled:opacity-50 disabled:cursor-not-allowed text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/30"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>picture_as_pdf</span>
            Exportar PDF
          </button>
          <button 
            onClick={handleOpenNewAssetModal}
            className="btn-electric flex items-center gap-1.5 text-[12px]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryItems.map((s, i) => (
          <div
            key={i}
            onClick={() => setStatusFilter(s.filter)}
            className="rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-md"
            style={{
              background: statusFilter === s.filter ? s.bg : '#ffffff',
              border: `1px solid ${statusFilter === s.filter ? s.color + '30' : 'rgba(15,23,42,0.08)'}`,
              boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            }}
          >
            <div className="text-[22px] font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[11px] text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

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
            placeholder="Buscar activos, usuarios, IDs…"
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
            <option value="Available">Disponible</option>
            <option value="Lent">Prestado</option>
            <option value="Deployed">Desplegado</option>
            <option value="Maintenance">Mantenimiento</option>
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
        </div>

        <div className="relative">
          <select
            className="input-premium appearance-none pl-3 pr-8 py-2 text-[13px] cursor-pointer"
            style={{ minWidth: '140px' }}
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">Todas las Ubicaciones</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
        </div>

        <div className="ml-auto text-[12px] text-slate-500">
          Mostrando <span className="font-semibold text-slate-700">{filtered.length}</span> de {assets.length} resultados
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden bg-white"
        style={{
          border: '1px solid rgba(15,23,42,0.07)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.03)',
        }}
      >
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-600/20 border-t-violet-700 rounded-full animate-spin" />
              <span>Cargando inventario...</span>
            </div>
          ) : (
            <table className="w-full" style={{ minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                  {[
                    { label: 'ID del Activo',   col: 'id',        w: '120px' },
                    { label: 'Nombre / Modelo', col: 'name',    w: 'auto' },
                    { label: 'Categoría',       col: 'category' },
                    { label: 'Estado',          col: 'status' },
                    { label: 'Asignado A',      col: 'assignee' },
                    { label: 'Ubicación',       col: 'location' },
                    { label: 'Cantidad',        col: 'quantity' },
                    { label: 'Valor',           col: 'value' },
                    { label: 'Última Auditoría', col: 'lastAudit' },
                  ].map((h, idx) => (
                    <th
                      key={idx}
                      onClick={() => handleSort(h.col)}
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      style={{ width: h.w }}
                    >
                      <div className="flex items-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                        {h.label}
                        <SortIcon col={h.col} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? paginatedAssets.map((asset) => {
                  const sc = STATUS_CONFIG[asset.status] || STATUS_CONFIG.Available;
                  const catIcon = CATEGORY_ICONS[asset.category] || CATEGORY_ICONS.default;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className="table-row-premium cursor-pointer group"
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-bold text-violet-700 font-mono">{asset.id}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 bg-white">
                            <img
                              src={getAssetImage(asset)}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getAssetImage({ ...asset, imageUrl: undefined });
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">{asset.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{asset.sub}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-slate-500">{CATEGORY_LABELS[asset.category] || asset.category}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div
                          className="badge inline-flex items-center gap-1.5"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot, boxShadow: `0 0 4px ${sc.dot}80` }} />
                          {STATUS_LABELS[asset.status] || asset.status}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {asset.assignee ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                            >
                              <span className="text-white text-[9px] font-bold">{asset.assignee[0]}</span>
                            </div>
                            <span className="text-[12px] text-slate-700">{asset.assignee}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400 italic">Sin asignar</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '12px' }}>location_on</span>
                          <span className="text-[12px] text-slate-500">{asset.location}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {(() => {
                          const s = stats.get(productKey(asset)) ?? { total: 1, available: asset.status === 'Available' ? 1 : 0 };
                          return (
                            <div className="flex flex-col items-start gap-0.5">
                              <span
                                className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg text-[12px] font-bold"
                                style={{ color: '#047857', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)' }}
                                title={`${s.total} ${s.total === 1 ? 'unidad registrada' : 'unidades registradas'} de este producto`}
                              >
                                {s.total}
                              </span>
                              {s.total > 1 && (
                                <span className="text-[10px] text-slate-400">{s.available} disp.</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-semibold text-violet-700 font-mono">{asset.value}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-slate-400">{asset.lastAudit}</span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>search_off</span>
                      <p className="text-[14px] text-slate-500">No hay activos que coincidan con los filtros</p>
                      <button
                        onClick={() => { setSearch(''); setStatusFilter(''); setLocationFilter(''); }}
                        className="text-[13px] text-violet-700 hover:text-violet-800 transition-colors mt-2 font-medium"
                      >
                        Limpiar todos los filtros
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}
          >
            <span className="text-[12px] text-slate-400">
              Mostrando <span className="text-slate-600 font-medium">{filtered.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-slate-600 font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</span> de <span className="text-slate-600 font-medium">{filtered.length}</span> activos
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className="w-7 h-7 rounded-lg text-[12px] font-medium transition-all duration-150"
                  style={n === currentPage
                    ? { background: 'rgba(124, 58, 237,0.1)', color: '#15803d', border: '1px solid rgba(124, 58, 237,0.2)' }
                    : { background: '#ffffff', color: '#94a3b8', border: '1px solid rgba(15,23,42,0.08)' }
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
  );
}
