// Shared look & feel for the PDF reports (logo, brand gradient, header and footer).

export const BRAND = {
  indigo: [79, 70, 229],
  cyan: [6, 182, 212],
  ink: [15, 23, 42],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  line: [226, 232, 240],
  soft: [238, 242, 255],
  zebra: [248, 249, 255],
};

let logoPromise = null;

/** Loads /logo.png once as a data URL with its aspect ratio. Resolves to null if unavailable. */
export function loadLogo() {
  if (!logoPromise) {
    logoPromise = fetch('/logo.png')
      .then(r => { if (!r.ok) throw new Error('logo'); return r.blob(); })
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve({ dataUrl: reader.result, ratio: img.naturalWidth / img.naturalHeight });
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .catch(() => null);
  }
  return logoPromise;
}

/** Horizontal indigo → cyan bar. */
export function gradientBar(doc, x, y, w, h) {
  const steps = 90;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    doc.setFillColor(...BRAND.indigo.map((v, k) => Math.round(v + (BRAND.cyan[k] - v) * t)));
    doc.rect(x + stepW * i, y, stepW + 0.3, h, 'F');
  }
}

/** Full first-page header. Returns the Y where content can start. */
export function drawBrandHeader(doc, logo, { reportLabel, meta = [] }) {
  const pageW = doc.internal.pageSize.getWidth();
  gradientBar(doc, 0, 0, pageW, 3);

  let textX = 14;
  if (logo) {
    const h = 14;
    const w = h * logo.ratio;
    doc.addImage(logo.dataUrl, 'PNG', 14, 8.5, w, h);
    textX = 14 + w + 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.ink);
  doc.text('Sma Lab Stock', textX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.muted);
  doc.text('Sistema de Gestión de Activos de TI', textX, 20.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.indigo);
  doc.text(reportLabel.toUpperCase(), pageW - 14, 12, { align: 'right', charSpace: 0.4 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  meta.forEach((line, i) => doc.text(line, pageW - 14, 17.5 + i * 4.3, { align: 'right' }));

  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.3);
  doc.line(14, 27.5, pageW - 14, 27.5);
  return 27.5;
}

/** Compact header for continuation pages. Returns the Y where content can start. */
export function drawCompactHeader(doc, logo, { title, right }) {
  const pageW = doc.internal.pageSize.getWidth();
  gradientBar(doc, 0, 0, pageW, 2);

  let textX = 14;
  if (logo) {
    const h = 8;
    const w = h * logo.ratio;
    doc.addImage(logo.dataUrl, 'PNG', 14, 5, w, h);
    textX = 14 + w + 3;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.ink);
  doc.text(title, textX, 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.muted);
  doc.text(right, pageW - 14, 10.5, { align: 'right' });

  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.3);
  doc.line(14, 15, pageW - 14, 15);
  return 15;
}

/** Footer on every page: confidentiality note, date and "Página x de y". */
export function drawFooters(doc, { note, dateStr }) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 11, pageW - 14, pageH - 11);
    gradientBar(doc, 0, pageH - 1.2, pageW, 1.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.faint);
    doc.text(note, 14, pageH - 6);
    doc.text(dateStr, pageW / 2, pageH - 6, { align: 'center' });
    doc.setTextColor(...BRAND.muted);
    doc.text(`Página ${p} de ${total}`, pageW - 14, pageH - 6, { align: 'right' });
  }
}
