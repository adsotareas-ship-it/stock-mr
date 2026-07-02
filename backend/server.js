import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-secret-key-123456789';

// Rate Limiter to prevent Brute-Force Attacks on Login
const loginAttempts = new Map();
const loginRateLimit = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 5; // 5 attempts per window
  
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }
  
  const attempts = loginAttempts.get(ip).filter(timestamp => now - timestamp < windowMs);
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  
  if (attempts.length > maxAttempts) {
    return res.status(429).json({ error: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 5 minutos.' });
  }
  next();
};

// Authentication Middleware to protect routes
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor, vuelva a iniciar sesión.' });
  }
};

// Endpoint: Login
app.post('/api/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.getUser();
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (email === user.email && isMatch) {
      const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token, user: { name: user.name, email: user.email } });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas. Por favor, verifique su correo y contraseña.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints: User config
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const user = await db.getUser();
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user', requireAuth, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const updates = {};
    if (email) updates.email = email;
    if (password) updates.password = password;
    if (name) updates.name = name;
    
    const updated = await db.updateUser(updates);
    
    // Save audit log
    await db.saveLog({
      id: `LOG-${Math.floor(80000 + Math.random() * 10000)}`,
      user: updated.name,
      email: updated.email,
      action: 'Modificación',
      detail: `Configuración de perfil/credenciales del administrador actualizada.`,
      time: 'Hace unos instantes',
      icon: 'manage_accounts',
      iconColor: '#0d9488',
      iconBg: 'rgba(13,148,136,0.08)'
    });
    
    res.json({ name: updated.name, email: updated.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints: Assets
app.get('/api/assets', requireAuth, async (req, res) => {
  try {
    const assets = await db.getAssets();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/assets/:id', requireAuth, async (req, res) => {
  try {
    const asset = await db.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assets', requireAuth, async (req, res) => {
  try {
    const { id, name, sub, category, location, value, serial, purchaseDate, warrantyYears } = req.body;

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
      time: 'Hace unos instantes',
      icon: 'add_box',
      iconColor: '#7c3aed',
      iconBg: 'rgba(124,58,237,0.08)'
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
      time: 'Hace unos instantes',
      icon: 'delete',
      iconColor: '#dc2626',
      iconBg: 'rgba(220,38,38,0.08)'
    });
    
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints: Tickets
app.get('/api/tickets', requireAuth, async (req, res) => {
  try {
    const tickets = await db.getTickets();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      time: 'Hace unos instantes',
      icon: 'build',
      iconColor: '#d97706',
      iconBg: 'rgba(217,119,6,0.08)'
    });

    res.status(201).json(savedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints: Logs
app.get('/api/logs', requireAuth, async (req, res) => {
  try {
    const logs = await db.getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      time: 'Hace unos instantes',
      icon: icon || 'info',
      iconColor: iconColor || '#64748b',
      iconBg: iconBg || 'rgba(100,116,139,0.08)'
    };
    const saved = await db.saveLog(newLog);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints: Audit Sessions
app.get('/api/audit-sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await db.getAuditSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      time: 'Hace unos instantes',
      icon: 'fact_check',
      iconColor: '#2563eb',
      iconBg: 'rgba(37,99,235,0.08)'
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
