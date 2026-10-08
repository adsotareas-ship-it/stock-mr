import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND, loadLogo, drawBrandHeader, drawCompactHeader, drawFooters } from './pdfBrand';

const STATUS_PILLS = {
  Available:   { fill: [209, 250, 229], text: [4, 120, 87] },
  Lent:        { fill: [219, 234, 254], text: [30, 64, 175] },
  Assigned:    { fill: [219, 234, 254], text: [30, 64, 175] },
  Maintenance: { fill: [254, 243, 199], text: [146, 64, 14] },
  Deployed:    { fill: [237, 233, 254], text: [109, 40, 217] },
};

const money = (v) => parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10) || 0;
const formatCOP = (n) => `$${n.toLocaleString('es-CO')}`;

/**
 * Builds the inventory report. Returns { doc, filename }.
 * `assets` is the whole catalog, `filtered` what the user currently sees.
 */
export async function buildInventoryPdf({ assets, filtered, filters, statusLabels, categoryLabels }) {
  const logo = await loadLogo();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = today.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  doc.setProperties({
    title: 'Registro de Activos de Hardware — Sma Lab Stock',
    subject: 'Reporte de inventario',
    author: 'Sma Lab Stock',
    creator: 'Sma Lab Stock',
  });

  // ─── Header ───────────────────────────────────────────────
  const headerBottom = drawBrandHeader(doc, logo, {
    reportLabel: 'Informe de inventario',
    meta: [
      `Generado: ${dateStr} · ${timeStr}`,
      `Activos en el catálogo: ${assets.length}  ·  En este reporte: ${filtered.length}`,
    ],
  });

  // ─── Title + filters ──────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...BRAND.ink);
  doc.text('Registro de Activos de Hardware', 14, headerBottom + 11);

  const active = [
    filters.status ? `Estado: ${statusLabels[filters.status] || filters.status}` : null,
    filters.location ? `Ubicación: ${filters.location}` : null,
    filters.search ? `Búsqueda: "${filters.search}"` : null,
  ].filter(Boolean);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    active.length ? `Filtros aplicados — ${active.join('  |  ')}` : 'Sin filtros — se muestran todos los activos del catálogo',
    14,
    headerBottom + 17.5
  );

  // ─── KPI cards ────────────────────────────────────────────
  const count = (fn) => assets.filter(fn).length;
  const total = assets.length || 1;
  const cards = [
    { label: 'Total de activos', value: assets.length, color: BRAND.indigo, sub: 'en el catálogo' },
    { label: 'Disponibles', value: count(a => a.status === 'Available'), color: [5, 150, 105] },
    { label: 'Prestados', value: count(a => a.status === 'Lent' || a.status === 'Assigned'), color: [37, 99, 235] },
    { label: 'En mantenimiento', value: count(a => a.status === 'Maintenance'), color: [217, 119, 6] },
    { label: 'Desplegados', value: count(a => a.status === 'Deployed'), color: [124, 58, 237] },
    { label: 'Valor del reporte', value: formatCOP(filtered.reduce((s, a) => s + money(a.value), 0)), color: BRAND.ink, small: true, sub: 'suma de los activos listados' },
  ];
  const gap = 3;
  const usable = pageW - 28;
  const cardW = (usable - gap * (cards.length - 1)) / cards.length;
  const cardY = headerBottom + 23;
  const cardH = 21;

  cards.forEach((card, i) => {
    const cx = 14 + i * (cardW + gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cardY, cardW, cardH, 2.5, 2.5, 'FD');
    doc.setFillColor(...card.color);
    doc.roundedRect(cx, cardY, 1.8, cardH, 0.9, 0.9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(card.small ? 11.5 : 18);
    doc.setTextColor(...card.color);
    doc.text(String(card.value), cx + 6, cardY + 10.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...BRAND.muted);
    doc.text(card.label.toUpperCase(), cx + 6, cardY + 15.5, { charSpace: 0.2 });

    const sub = card.sub ?? `${Math.round((card.value / total) * 100)}% del total`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND.faint);
    doc.text(sub, cx + 6, cardY + 19);
  });

  // ─── Table ────────────────────────────────────────────────
  const body = filtered.map(a => [
    a.id,
    a.name + (a.sub ? `\n${a.sub}` : ''),
    categoryLabels[a.category] || a.category,
    statusLabels[a.status] || a.status,
    a.assignee || 'Sin asignar',
    a.location || '—',
    a.value || '—',
    a.purchaseDate || '—',
    a.serial || '—',
  ]);

  const compactTitle = 'Sma Lab Stock · Registro de Activos de Hardware';
  const compactRight = `Generado: ${dateStr} · ${timeStr}`;

  autoTable(doc, {
    startY: cardY + cardH + 7,
    head: [['ID Activo', 'Nombre / Modelo', 'Categoría', 'Estado', 'Asignado a', 'Ubicación', 'Valor', 'Adquirido', 'N/S']],
    body,
    theme: 'grid',
    margin: { top: 21, left: 14, right: 14, bottom: 16 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      valign: 'middle',
      lineColor: BRAND.line,
      lineWidth: 0.2,
      textColor: BRAND.text,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: BRAND.indigo,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      lineColor: BRAND.indigo,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    },
    alternateRowStyles: { fillColor: BRAND.zebra },
    // 269 mm usable on A4 landscape
    columnStyles: {
      0: { cellWidth: 23, fontStyle: 'bold', textColor: BRAND.indigo },
      1: { cellWidth: 52 },
      2: { cellWidth: 29 },
      3: { cellWidth: 26 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25 },
      6: { cellWidth: 24, fontStyle: 'bold', textColor: BRAND.ink, halign: 'right' },
      7: { cellWidth: 24 },
      8: { cellWidth: 36, textColor: BRAND.muted, fontSize: 7 },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 6) data.cell.styles.halign = 'right';
      if (data.section !== 'body') return;
      if (data.column.index === 3) data.cell.text = ['']; // drawn as a pill below
      if (data.column.index === 4 && data.cell.raw === 'Sin asignar') {
        data.cell.styles.textColor = BRAND.faint;
        data.cell.styles.fontStyle = 'italic';
      }
      if (data.column.index === 8 && data.cell.raw === 'S/N-UNKNOWN') {
        data.cell.styles.textColor = BRAND.faint;
        data.cell.styles.fontStyle = 'italic';
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 3) return;
      const label = String(data.cell.raw);
      const key = Object.entries(statusLabels).find(([, v]) => v === label)?.[0];
      const pill = STATUS_PILLS[key] || { fill: [241, 245, 249], text: [71, 85, 105] };
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const w = doc.getTextWidth(label) + 6;
      const h = 5;
      const x = data.cell.x + 3;
      const y = data.cell.y + (data.cell.height - h) / 2;
      doc.setFillColor(...pill.fill);
      doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');
      doc.setTextColor(...pill.text);
      doc.text(label, x + 3, y + 3.5);
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawCompactHeader(doc, logo, { title: compactTitle, right: compactRight });
    },
  });

  drawFooters(doc, { note: 'Sma Lab Stock — Reporte confidencial de inventario de hardware · Uso interno', dateStr });

  return { doc, filename: `inventario_sma_lab_stock_${today.toISOString().slice(0, 10)}.pdf` };
}
