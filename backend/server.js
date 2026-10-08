import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { db } from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DUMMY_HASH, loginGuard, validatePassword, isDefaultPassword,
  passwordVersion, newLogId, sleep,
} from './security.js';

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

app.set('trust proxy', 1); // behind Nginx: real client IP for rate limiting

// Security headers. `upgradeInsecureRequests` stays off until the site is served over HTTPS.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 15552000, includeSubDomains: false },
  referrerPolicy: { policy: 'no-referrer' },
}));
// Same-origin in production; only local dev servers may call the API cross-origin.
if (!IS_PROD) app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

if (IS_PROD && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
// In dev without JWT_SECRET, a random secret per process (sessions end on restart).
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
const JWT_OPTS = { algorithm: 'HS256', issuer: 'sma-stock', audience: 'sma-stock-admin' };

const serverError = (res, err) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
};

const issueToken = (user) =>
  jwt.sign({ email: user.email, pv: passwordVersion(user.password) }, JWT_SECRET, { ...JWT_OPTS, expiresIn: '8h' });

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const getFormattedTime = () => {
  const now = new Date();
  const datePart = now.toLocaleDateString('es-CO', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    timeZone: 'America/Bogota'
  });
  const timePart = now.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'America/Bogota'
  });
  return `${datePart}, ${timePart.toUpperCase()}`;
};


const clientIp = (req) => req.ip || req.socket.remoteAddress || 'unknown';

const auditSecurity = (email, action, detail, icon = 'shield', color = '#4f46e5') =>
  db.saveLog({
    id: newLogId(),
    user: 'Seguridad',
    email: email || 'desconocido',
    action,
    detail,
    time: getFormattedTime(),
    icon,
    iconColor: color,
    iconBg: 'rgba(79,70,229,0.08)',
  }).catch(err => console.error('[audit]', err.message));

// Authentication middleware: verifies the JWT (pinned algorithm/issuer/audience) and that it
// still matches the current account, so a password or e-mail change invalidates old tokens.
const requireAuth = async (req, res, next) => {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET, { algorithms: [JWT_OPTS.algorithm], issuer: JWT_OPTS.issuer, audience: JWT_OPTS.audience });
    const user = await db.getUser();
    if (!user || !safeEqual(decoded.email, user.email) || !safeEqual(decoded.pv, passwordVersion(user.password))) {
      throw new Error('stale token');
    }
    req.user = { email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor, vuelva a iniciar sesión.' });
  }
};

// Endpoint: Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Solicitud inválida.' });
    }

    const ip = clientIp(req);
    const wait = loginGuard.check(ip, email);
    if (wait) {
      res.set('Retry-After', String(wait));
      return res.status(429).json({ error: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(wait / 60)} minuto(s).` });
    }

    const user = await db.getUser();
    const emailOk = !!user && email.trim().toLowerCase() === String(user.email).toLowerCase();
    // Always run bcrypt, even for an unknown e-mail, to keep response times uniform.
    const passOk = await bcrypt.compare(password, emailOk ? user.password : DUMMY_HASH);

    if (emailOk && passOk) {
      if (IS_PROD && isDefaultPassword(password)) {
        return res.status(403).json({ error: 'La contraseña por defecto está deshabilitada. Define una nueva en el servidor con scripts/set-admin.js.' });
      }
      loginGuard.success(ip, email);
      auditSecurity(user.email, 'Acceso', `Inicio de sesión correcto desde ${ip}.`, 'login', '#16a34a');
      return res.json({ token: issueToken(user), user: { name: user.name, email: user.email } });
    }

    const locked = loginGuard.fail(ip, email);
    console.warn(`[security] login fallido ip=${ip}${locked ? ' (bloqueado)' : ''}`);
    if (locked) {
      auditSecurity(email.slice(0, 120), 'Bloqueo', `Demasiados intentos fallidos desde ${ip}; acceso bloqueado 15 minutos.`, 'gpp_bad', '#dc2626');
    }
    await sleep(350 + Math.random() * 250);
    res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
  } catch (err) {
    serverError(res, err);
  }
});

// Endpoints: User config
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const user = await db.getUser();
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    serverError(res, err);
  }
});

app.put('/api/user', requireAuth, async (req, res) => {
  try {
    const { email, password, name, currentPassword } = req.body ?? {};
    const user = await db.getUser();
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.length > 100) {
        return res.status(400).json({ error: 'El nombre no es válido.' });
      }
      updates.name = name.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'El correo no es válido.' });
      }
      if (email.trim().toLowerCase() !== String(user.email).toLowerCase()) updates.email = email.trim();
    }
    if (password) {
      const pwError = validatePassword(password, updates.email ?? user.email);
      if (pwError) return res.status(400).json({ error: pwError });
      updates.password = password;
    }

    // Changing the e-mail or password requires proving knowledge of the current password.
    if (updates.email || updates.password) {
      const ip = clientIp(req);
      const wait = loginGuard.check(ip, user.email);
      if (wait) {
        res.set('Retry-After', String(wait));
        return res.status(429).json({ error: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(wait / 60)} minuto(s).` });
      }
      const ok = typeof currentPassword === 'string' && currentPassword.length <= 128 && await bcrypt.compare(currentPassword, user.password);
      if (!ok) {
        loginGuard.fail(ip, user.email);
        await sleep(400);
        return res.status(403).json({ error: 'La contraseña actual es incorrecta.' });
      }
      loginGuard.success(ip, user.email);
    }

    const updated = await db.updateUser(updates);
    await db.saveLog({
      id: newLogId(),
      user: updated.name,
      email: updated.email,
      action: 'Modificación',
      detail: updates.password ? 'Contraseña del administrador actualizada.' : 'Perfil del administrador actualizado.',
      time: getFormattedTime(),
      icon: 'manage_accounts',
      iconColor: '#0d9488',
      iconBg: 'rgba(13,148,136,0.08)'
    });

    // Fresh token, since the old one is tied to the previous e-mail / password.
    res.json({ name: updated.name, email: updated.email, token: issueToken(updated) });
  } catch (err) {
    serverError(res, err);
  }
});

// Endpoints: Assets
app.get('/api/assets', requireAuth, async (req, res) => {
  try {
    const assets = await db.getAssets();
    res.json(assets);
  } catch (err) {
    serverError(res, err);
  }
});

app.get('/api/assets/:id', requireAuth, async (req, res) => {
  try {
    const asset = await db.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    serverError(res, err);
  }
});

app.post('/api/assets', requireAuth, async (req, res) => {
  try {
    const { id, name, sub, category, location, value, serial, purchaseDate, warrantyYears, imageUrl } = req.body;

    // --- Warranty calculation from real input ---
    const purchaseDateObj = purchaseDate ? new Date(purchaseDate) : new Date();
    const warrantyPeriodYears = parseFloat(warrantyYears ?? 1);
    const warrantyEndDate = new Date(purchaseDateObj);
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + Math.floor(warrantyPeriodYears));
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + Math.round((warrantyPeriodYears % 1) * 12));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = Math.round((warrantyEndDate - purchaseDateObj) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.round((warrantyEndDate - today) / (1000 * 60 * 60 * 24)));
    const warrantyPct = totalDays > 0 ? Math.round((daysRemaining / totalDays) * 100) : 0;
    const warrantyStatus = daysRemaining > 0 ? 'Active' : 'Expired';

    const fmtDate = d => d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    const warrantyLabel = warrantyPeriodYears === 0
      ? 'Sin Garantía'
      : warrantyPeriodYears < 1
        ? `Garantía de ${Math.round(warrantyPeriodYears * 12)} meses`
        : `Garantía de ${warrantyPeriodYears} ${warrantyPeriodYears === 1 ? 'año' : 'años'}`;

    const purchaseDateFmt = purchaseDateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatValue = v => v && v !== '0'
      ? (v.startsWith('$') ? v : `$${parseFloat(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)
      : '$0';

    
    // Set default structure matching the rich specs of the layout
    const newAsset = {
      id: id || `AST-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      sub: sub || 'Nuevo Dispositivo',
      category: category || 'Laptop',
      status: 'Available',
      assignee: null,
      assigneeDetail: null,
      location: location || 'Laboratorio',
      value: formatValue(value),
      lastAudit: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      serial: serial || 'S/N-UNKNOWN',
      purchaseDate: purchaseDateFmt,
      imageUrl: imageUrl || undefined,
      specs: [
        { icon: 'developer_board', label: 'Procesador', value: 'Configuración estándar' },
        { icon: 'memory',          label: 'Memoria',    value: '16 GB RAM', pct: 100 },
        { icon: 'hard_drive',      label: 'Almacenamiento',   value: '512 GB SSD', pct: 10 },
      ],
      warranty: { days: daysRemaining, pct: warrantyPct, label: warrantyLabel, start: fmtDate(purchaseDateObj), end: fmtDate(warrantyEndDate), status: warrantyStatus },
      financial: {
        purchase: formatValue(value),
        book: formatValue(value),
        depreciation: '0%',
        acquired: 'Adquisición de TI'
      },
      history: [
        { action: 'Ingreso al Catálogo', date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }), by: 'Admin de Sistema', type: 'provision' }
      ],
      maintenance: []
    };

    const saved = await db.saveAsset(newAsset);

    // Save audit log
    await db.saveLog({
      id: `LOG-${Math.floor(80000 + Math.random() * 10000)}`,
      user: 'Admin del Sistema',
      email: 'admin@enterprise.com',
      action: 'Registro',
      detail: `Equipo AST- ${newAsset.id} (${newAsset.name}) registrado e importado al catálogo.`,
      time: getFormattedTime(),
      icon: 'add_box',
      iconColor: '#7c3aed',
      iconBg: 'rgba(124,58,237,0.08)'
    });

    res.status(201).json(saved);
  } catch (err) {
    serverError(res, err);
  }
});

app.put('/api/assets/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If value is being updated, sync financial block too
    if (updates.value !== undefined) {
      const rawVal = updates.value;
      const fmtVal = rawVal && rawVal !== '0' && rawVal !== '$0'
        ? (String(rawVal).startsWith('$')
            ? rawVal
            : `$${parseFloat(rawVal).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)
        : '$0';
      updates.value = fmtVal;
      updates.financial = {
        ...(updates.financial || {}),
        purchase: fmtVal,
        book: fmtVal,
        depreciation: updates.financial?.depreciation || '0%',
        acquired: updates.financial?.acquired || 'Adquisición de TI',
      };
    }

    const updated = await db.updateAsset(id, updates);
    if (!updated) return res.status(404).json({ error: 'Asset not found' });
    res.json(updated);
  } catch (err) {
    serverError(res, err);
  }
});

app.delete('/api/assets/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteAsset(id);
    if (!deleted) return res.status(404).json({ error: 'Asset not found' });
    
    // Save audit log
    await db.saveLog({
      id: `LOG-${Math.floor(80000 + Math.random() * 10000)}`,
      user: 'Admin del Sistema',
      email: 'admin@enterprise.com',
      action: 'Baja',
      detail: `Equipo ${deleted.id} (${deleted.name}) fue dado de baja y eliminado del catálogo.`,
      time: getFormattedTime(),
      icon: 'delete',
      iconColor: '#dc2626',
      iconBg: 'rgba(220,38,38,0.08)'
    });
    
    res.json(deleted);
  } catch (err) {
    serverError(res, err);
  }
});

// Endpoints: Tickets
app.get('/api/tickets', requireAuth, async (req, res) => {
  try {
    const tickets = await db.getTickets();
    res.json(tickets);
  } catch (err) {
    serverError(res, err);
  }
});

app.post('/api/tickets', requireAuth, async (req, res) => {
  try {
    const { assetId, assetName, type, severity, tech, cost } = req.body;
    
    const newTicket = {
      id: `TKT-${Math.floor(8900 + Math.random() * 1000)}`,
      assetId,
      assetName,
      type,
      severity: severity || 'Media',
      tech: tech || 'Por asignar',
      cost: cost 
        ? (cost.startsWith('$') ? cost : (cost === '0' || cost === '0.00' ? '$0 (Garantía)' : `$${parseFloat(cost).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)) 
        : 'N/A',
      status: 'Pending',
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const savedTicket = await db.saveTicket(newTicket);

    // Update asset status to 'Maintenance'
    const asset = await db.getAssetById(assetId);
    if (asset) {
      // Add incident to asset maintenance history list
      const updatedMaintenance = [
        { date: newTicket.date, type: newTicket.type, status: 'Pending', cost: newTicket.cost },
        ...(asset.maintenance || [])
      ];

      // Add to asset history timeline
      const updatedHistory = [
        { action: 'Movido al Grupo de Mantenimiento', date: newTicket.date, by: 'Soporte de TI', type: 'maintenance' },
        ...(asset.history || [])
      ];

      await db.updateAsset(assetId, { 
        status: 'Maintenance',
        maintenance: updatedMaintenance,
        history: updatedHistory
      });
    }

    // Save audit log
    await db.saveLog({
      id: `LOG-${Math.floor(80000 + Math.random() * 10000)}`,
      user: 'Soporte de TI',
      email: 'it@enterprise.com',
      action: 'Mantenimiento',
      detail: `Activo ${assetId} (${assetName}) movido a mantenimiento por: ${type}.`,
      time: getFormattedTime(),
      icon: 'build',
      iconColor: '#d97706',
      iconBg: 'rgba(217,119,6,0.08)'
    });

    res.status(201).json(savedTicket);
  } catch (err) {
    serverError(res, err);
  }
});

app.delete('/api/tickets/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await db.deleteTicket(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ticket no encontrado.' });

    // Undo the side effects of opening the ticket on its asset.
    const asset = await db.getAssetById(deleted.assetId);
    if (asset) {
      const remaining = await db.getTickets();
      const stillOpen = remaining.some(t => t.assetId === deleted.assetId && t.status !== 'Resolved');

      const maintenance = [...(asset.maintenance || [])];
      const mIdx = maintenance.findIndex(m => m.type === deleted.type && m.date === deleted.date && m.cost === deleted.cost);
      if (mIdx !== -1) maintenance.splice(mIdx, 1);

      const updates = { maintenance };
      if (asset.status === 'Maintenance' && !stillOpen) updates.status = 'Available';
      await db.updateAsset(deleted.assetId, updates);
    }

    await db.saveLog({
      id: newLogId(),
      user: 'Soporte de TI',
      email: req.user.email,
      action: 'Mantenimiento',
      detail: `Incidente ${deleted.id} (${deleted.assetName}: ${deleted.type}) eliminado.`,
      time: getFormattedTime(),
      icon: 'delete',
      iconColor: '#dc2626',
      iconBg: 'rgba(220,38,38,0.08)'
    });

    res.json({ success: true, id: deleted.id });
  } catch (err) {
    serverError(res, err);
  }
});

// Endpoints: Logs
app.get('/api/logs', requireAuth, async (req, res) => {
  try {
    const logs = await db.getLogs();
    res.json(logs);
  } catch (err) {
    serverError(res, err);
  }
});

app.post('/api/logs', requireAuth, async (req, res) => {
  try {
    const { user, email, action, detail, icon, iconColor, iconBg } = req.body;
    const newLog = {
      id: `LOG-${Math.floor(80000 + Math.random() * 10000)}`,
      user: user || 'Sistema',
      email: email || 'system@enterprise.com',
      action: action || 'Auditoría',
      detail,
      time: getFormattedTime(),
      icon: icon || 'info',
      iconColor: iconColor || '#64748b',
      iconBg: iconBg || 'rgba(100,116,139,0.08)'
    };
    const saved = await db.saveLog(newLog);
    res.status(201).json(saved);
  } catch (err) {
    serverError(res, err);
  }
});

// Endpoints: Audit Sessions
app.get('/api/audit-sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await db.getAuditSessions();
    res.json(sessions);
  } catch (err) {
    serverError(res, err);
  }
});

app.post('/api/audit-sessions', requireAuth, async (req, res) => {
  try {
    const { name, totalChecked, compliance } = req.body;
    const newSession = {
      id: `AUD-2026-${String.fromCharCode(68 + Math.floor(Math.random() * 20))}`, // Generates AUD-2026-D, AUD-2026-E etc.
      name,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      totalChecked: totalChecked || 100,
      compliance: compliance || '100%',
      status: 'Completado'
    };
    const saved = await db.saveAuditSession(newSession);

    // Save audit log
    await db.saveLog({
      id: `LOG-${Math.floor(80000 + Math.random() * 10000)}`,
      user: 'Auditor Externo',
      email: 'auditor@audit.com',
      action: 'Auditoría',
      detail: `Auditoría física "${name}" completada con ${compliance} de conciliación.`,
      time: getFormattedTime(),
      icon: 'fact_check',
      iconColor: '#2563eb',
      iconBg: 'rgba(37,99,235,0.08)'
    });

    res.status(201).json(saved);
  } catch (err) {
    serverError(res, err);
  }
});

// Last-resort error handler: never leak internals to the client.
app.use((err, req, res, _next) => {
  if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
    return res.status(err.status || 400).json({ error: 'Solicitud inválida.' });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
