import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { getAssetImage } from '../utils/images';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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



  const handleExportPDF = () => {
    if (filtered.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = today.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // ─── Header Bar ───────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageW, 28, 'F');

    // Accent line
    doc.setFillColor(22, 163, 74); // violet-700
    doc.rect(0, 28, pageW, 2, 'F');

    // Company name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Miguel Stock', 14, 12);

    // Report subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Sistema de Gestión de Activos de TI', 14, 19);
    doc.text('INFORME CORPORATIVO CONFIDENCIAL', 14, 24);

    // Date / time top-right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado: ${dateStr} ${timeStr}`, pageW - 14, 12, { align: 'right' });
    doc.text(`Total de activos en catálogo: ${assets.length}`, pageW - 14, 18, { align: 'right' });
    doc.text(`Activos en este reporte: ${filtered.length}`, pageW - 14, 24, { align: 'right' });

    // ─── Report Title ─────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Registro de Activos de Hardware', 14, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const activeFilters = [
      statusFilter ? `Estado: ${STATUS_LABELS[statusFilter] || statusFilter}` : null,
      locationFilter ? `Ubicación: ${locationFilter}` : null,
      search ? `Búsqueda: "${search}"` : null,
    ].filter(Boolean);
    doc.text(
      activeFilters.length > 0
        ? `Filtros aplicados — ${activeFilters.join(' | ')}`
        : 'Sin filtros — mostrando todos los activos disponibles',
      14,
      49
    );

    // ─── Summary Cards Row ────────────────────────────────────
    const cards = [
      { label: 'Total de Activos',   value: assets.length,                                        color: [22, 163, 74] },
      { label: 'Disponibles',        value: assets.filter(a => a.status === 'Available').length,   color: [5, 150, 105] },
      { label: 'Prestados',          value: assets.filter(a => a.status === 'Lent' || a.status === 'Assigned').length,    color: [37, 99, 235] },
      { label: 'En Mantenimiento',   value: assets.filter(a => a.status === 'Maintenance').length, color: [180, 83, 9] },
      { label: 'Desplegados',        value: assets.filter(a => a.status === 'Deployed').length,    color: [109, 40, 217] },
    ];
    const cardW = (pageW - 28) / cards.length;
    const cardY = 55;

    cards.forEach((card, i) => {
      const cx = 14 + i * cardW;

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(225, 232, 240);
      doc.roundedRect(cx, cardY, cardW - 3, 20, 3, 3, 'FD');

      // Colored top strip
      doc.setFillColor(...card.color);
      doc.roundedRect(cx, cardY, cardW - 3, 4, 2, 2, 'F');
      doc.rect(cx, cardY + 2, cardW - 3, 2, 'F'); // flush bottom of strip

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...card.color);
      doc.text(String(card.value), cx + (cardW - 3) / 2, cardY + 13, { align: 'center' });

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), cx + (cardW - 3) / 2, cardY + 18, { align: 'center' });
    });

    // ─── Main Table ───────────────────────────────────────────
    const statusColors = {
      Assigned:    { cell: [220, 252, 231], text: [21, 128, 61] },
      Available:   { cell: [209, 250, 229], text: [4, 120, 87] },
      Maintenance: { cell: [254, 243, 199], text: [146, 64, 14] },
      Deployed:    { cell: [237, 233, 254], text: [109, 40, 217] },
    };

    const tableRows = filtered.map(a => [
      a.id,
      a.name + (a.sub ? `\n${a.sub}` : ''),
      CATEGORY_LABELS[a.category] || a.category,
      STATUS_LABELS[a.status] || a.status,
      a.assignee || 'Sin asignar',
      a.location,
      a.value || '—',
      a.purchaseDate || '—',
      a.serial || '—',
    ]);

    autoTable(doc, {
      startY: cardY + 26,
      head: [['ID Activo', 'Nombre / Modelo', 'Categoría', 'Estado', 'Asignado a', 'Ubicación', 'Valor', 'Adquirido', 'N/S']],
      body: tableRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.25,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [22, 163, 74], cellWidth: 22 },
        1: { cellWidth: 52 },
        2: { cellWidth: 22 },
        3: { cellWidth: 26 },
        4: { cellWidth: 32 },
        5: { cellWidth: 28 },
        6: { fontStyle: 'bold', textColor: [22, 163, 74], cellWidth: 22, halign: 'right' },
        7: { cellWidth: 24 },
        8: { fontStyle: 'normal', textColor: [100, 116, 139], cellWidth: 30 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const raw = data.cell.raw;
          const key = Object.entries(STATUS_LABELS).find(([k, v]) => v === raw)?.[0];
          const sc = statusColors[key];
          if (sc) {
            data.cell.styles.fillColor = sc.cell;
            data.cell.styles.textColor = sc.text;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.section === 'body' && data.column.index === 4 && data.cell.raw === 'Sin asignar') {
          data.cell.styles.textColor = [148, 163, 184];
          data.cell.styles.fontStyle = 'italic';
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ─── Footer on every page ─────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      // Footer bar
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageH - 10, pageW, 10, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(0, pageH - 10, pageW, pageH - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Miguel Stock — Reporte Confidencial de Inventario de Hardware', 14, pageH - 4);
      doc.text(`Página ${p} de ${totalPages}`, pageW - 14, pageH - 4, { align: 'right' });
      doc.text(dateStr, pageW / 2, pageH - 4, { align: 'center' });
    }

    doc.save(`inventario_miguel_stock_${today.toISOString().slice(0, 10)}.pdf`);
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
                        <span className="text-[12px] font-semibold text-violet-700 font-mono">{asset.value}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-slate-400">{asset.lastAudit}</span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className="py-16 text-center">
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
