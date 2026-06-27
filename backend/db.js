import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/\/$/, '') : null;
const supabaseKey = process.env.SUPABASE_KEY;
const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const DEFAULT_ASSETS = [
  {
    id: 'AST-1042',
    name: 'MacBook Pro 16" M2 Max',
    sub: 'Apple M2 Max · 64GB RAM',
    category: 'Laptop',
    status: 'Lent',
    assignee: 'Sarah Jenkins',
    borrowerId: '2026-0081',
    tableNumber: 'Mesa 2',
    loanDate: '10:15 AM',
    location: 'Laboratorio',
    value: '$3,899',
    lastAudit: '12 oct 2023',
    serial: 'C02FG492Q05D',
    purchaseDate: '12 ene 2023',
    specs: [
      { icon: 'developer_board', label: 'Procesador', value: 'Apple M2 Max · CPU de 12 núcleos · GPU de 38 núcleos' },
      { icon: 'memory',          label: 'Memoria',    value: '64 GB de Memoria Unificada', pct: 100 },
      { icon: 'hard_drive',      label: 'Almacenamiento',   value: 'SSD NVMe de 2 TB', pct: 42, detail: 'Usado: 840 GB' },
      { icon: 'wifi_tethering',  label: 'Dirección MAC', value: '00:1A:2B:3C:4D:5E', mono: true },
    ],
    warranty: { days: 412, pct: 65, label: 'AppleCare+ Enterprise L2', start: 'ene 2023', end: 'ene 2026', status: 'Active' },
    financial: { purchase: '$3,899', book: '$2,450', depreciation: '37.2%', acquired: 'Compra Directa' },
    history: [
      { action: 'Asignado a Sarah Jenkins', date: '12 oct 2023', by: 'Admin del Sistema',  type: 'assign' },
      { action: 'Devuelto de Mantenimiento',  date: '10 oct 2023', by: 'Departamento de TI', type: 'return' },
      { action: 'Aprovisionamiento Inicial',       date: '05 ene 2023', by: 'Despliegue Automático',   type: 'provision' },
    ],
    maintenance: [
      { date: '08 oct 2023', type: 'Reemplazo de Batería', status: 'Resolved',  cost: '$0 (Garantía)' },
      { date: '15 jun 2023', type: 'Actualización de Imagen de SO',     status: 'Completed', cost: 'N/A' },
      { date: '20 feb 2023', type: 'Calibración de Pantalla',  status: 'Completed', cost: 'N/A' },
    ]
  },
  {
    id: 'AST-2099',
    name: 'Dell UltraSharp 32" 4K',
    sub: 'U3223QE · 4K USB-C Hub',
    category: 'Display',
    status: 'Available',
    assignee: null,
    assigneeDetail: null,
    location: 'Laboratorio',
    value: '$999',
    lastAudit: '01 nov 2023',
    serial: 'DELL-32-US-4K',
    purchaseDate: '01 nov 2023',
    specs: [
      { icon: 'monitor',         label: 'Pantalla', value: '31.5" IPS Black · 4K UHD (3840 x 2160)' },
      { icon: 'settings_input_hdmi', label: 'Conectividad', value: 'USB-C Hub · HDMI 2.0 · DisplayPort 1.4' },
      { icon: 'contrast',        label: 'Contraste', value: '2000:1 · 400 nits' },
    ],
    warranty: { days: 512, pct: 75, label: 'Garantía Estándar Dell Premium', start: 'nov 2023', end: 'nov 2026', status: 'Active' },
    financial: { purchase: '$999', book: '$720', depreciation: '27.9%', acquired: 'Adquisición de TI' },
    history: [
      { action: 'Registrado en Inventario', date: '01 nov 2023', by: 'Admin de Adquisiciones', type: 'provision' }
    ],
    maintenance: []
  },
  {
    id: 'AST-0854',
    name: 'ThinkPad X1 Carbon Gen 10',
    sub: 'Gen 10 · i7 · 32GB RAM',
    category: 'Laptop',
    status: 'Maintenance',
    assignee: 'Depto de TI',
    assigneeDetail: { name: 'Departamento de TI', role: 'Grupo de Reparación Técnica', dept: 'Ops de TI', since: '28 sep 2023', email: 'it@enterprise.com' },
    location: 'Laboratorio',
    value: '$2,199',
    lastAudit: '28 sep 2023',
    serial: 'PF-4X1CARB-G10',
    purchaseDate: '10 sep 2021',
    specs: [
      { icon: 'developer_board', label: 'Procesador',   value: 'Intel Core i7-1260P · 12 núcleos' },
      { icon: 'memory',          label: 'Memoria',      value: '32 GB de RAM LPDDR5', pct: 75 },
      { icon: 'hard_drive',      label: 'Almacenamiento',     value: '1 TB NVMe PCIe Gen4', pct: 41, detail: 'Usado: 410 GB' },
      { icon: 'wifi_tethering',  label: 'Dirección MAC', value: 'E8:2A:44:BC:D5:18', mono: true },
    ],
    warranty: { days: 0, pct: 0, label: 'Soporte Lenovo Depot (Expirado)', start: 'sep 2021', end: 'sep 2023', status: 'Expired' },
    financial: { purchase: '$2,199', book: '$1,150', depreciation: '47.7%', acquired: 'Compra Directa' },
    history: [
      { action: 'Movido al Grupo de Mantenimiento', date: '28 sep 2023', by: 'Sarah J.',   type: 'maintenance' },
      { action: 'Asignado a Sarah Jenkins', date: '02 may 2022', by: 'Soporte de TI', type: 'assign' },
    ],
    maintenance: [
      { date: '29 sep 2023', type: 'Reparación de Teclado', status: 'Pending', cost: '$120.00' },
    ]
  },
  {
    id: 'AST-3102',
    name: 'Cisco Meraki MR46 AP',
    sub: 'Wi-Fi 6 · Cloud Managed',
    category: 'Networking',
    status: 'Deployed',
    assignee: 'Piso 3 — Sec. A',
    assigneeDetail: { name: 'Piso 3 — Sector A', role: 'Redes de Instalaciones', dept: 'Instalaciones', since: '15 ago 2023', email: 'facilities@enterprise.com' },
    location: 'Laboratorio',
    value: '$1,499',
    lastAudit: '15 ago 2023',
    serial: 'Q2JD-MR46-AP',
    purchaseDate: '01 ago 2023',
    specs: [
      { icon: 'router',          label: 'Tipo',        value: 'Punto de Acceso Administrado en la Nube Wi-Fi 6' },
      { icon: 'memory',          label: 'Memoria',      value: '1 GB de RAM · 2 GB de Flash' },
      { icon: 'wifi_tethering',  label: 'Dirección MAC', value: '00:18:0A:4F:9C:50', mono: true },
      { icon: 'signal_wifi_4_bar', label: 'Estándar', value: '802.11ax · 2.4 + 5 + 6 GHz' },
    ],
    warranty: { days: 890, pct: 90, label: 'Garantía de Hardware Meraki de por Vida', start: 'ago 2023', end: 'De por Vida', status: 'Active' },
    financial: { purchase: '$1,499', book: '$1,200', depreciation: '19.9%', acquired: 'Adquisición de TI' },
    history: [
      { action: 'Desplegado en el Piso 3', date: '15 ago 2023', by: 'Equipo de Red', type: 'provision' },
    ],
    maintenance: [
      { date: '15 ago 2023', type: 'Aprovisionamiento de Firmware', status: 'Completed', cost: 'N/A' },
    ]
  },
  {
    id: 'AST-4021',
    name: 'iPad Pro 12.9"',
    sub: 'Apple M2 · 256GB · Wi-Fi',
    category: 'Tablet',
    status: 'Available',
    assignee: null,
    assigneeDetail: null,
    location: 'Laboratorio',
    value: '$1,099',
    lastAudit: '05 dic 2023',
    serial: 'IPAD-M2-129',
    purchaseDate: '05 dic 2023',
    specs: [
      { icon: 'tablet', label: 'Pantalla', value: 'Liquid Retina XDR de 12.9 pulgadas' },
      { icon: 'developer_board', label: 'Procesador', value: 'Chip Apple M2 de 8 núcleos' },
      { icon: 'hard_drive', label: 'Almacenamiento', value: '256 GB de memoria Flash' },
    ],
    warranty: { days: 220, pct: 40, label: 'Garantía Estándar Apple de 1 año', start: 'dic 2023', end: 'dic 2024', status: 'Active' },
    financial: { purchase: '$1,099', book: '$850', depreciation: '22.6%', acquired: 'Compra Directa' },
    history: [
      { action: 'Registrado en Catálogo', date: '05 dic 2023', by: 'Admin de Sistema', type: 'provision' }
    ],
    maintenance: []
  },
  {
    id: 'AST-5182',
    name: 'iPhone 15 Pro',
    sub: '128GB · Space Black',
    category: 'Mobile',
    status: 'Lent',
    assignee: 'John Doe',
    borrowerId: '2026-0044',
    tableNumber: 'Mesa 5',
    loanDate: '09:30 AM',
    location: 'Laboratorio',
    value: '$999',
    lastAudit: '20 nov 2023',
    serial: 'IPH-15P-128',
    purchaseDate: '20 nov 2023',
    specs: [
      { icon: 'smartphone', label: 'Pantalla', value: 'Super Retina XDR de 6.1" OLED' },
      { icon: 'developer_board', label: 'Procesador', value: 'A17 Pro Bionic' },
    ],
    warranty: { days: 190, pct: 35, label: 'Garantía AppleCare+', start: 'nov 2023', end: 'nov 2025', status: 'Active' },
    financial: { purchase: '$999', book: '$780', depreciation: '21.9%', acquired: 'Compra Directa' },
    history: [
      { action: 'Asignado a John D.', date: '20 nov 2023', by: 'IT Support', type: 'assign' }
    ],
    maintenance: []
  },
  {
    id: 'AST-6029',
    name: 'Dell Precision 7960',
    sub: 'Intel Xeon · 128GB RAM',
    category: 'Server',
    status: 'Deployed',
    assignee: 'Sala de Servidores A',
    assigneeDetail: { name: 'Sala de Servidores A', role: 'Servidor de Desarrollo Central', dept: 'Operaciones', since: '10 dic 2023', email: 'ops@enterprise.com' },
    location: 'Laboratorio',
    value: '$6,299',
    lastAudit: '10 dic 2023',
    serial: 'DE-PREC-7960',
    purchaseDate: '10 dic 2023',
    specs: [
      { icon: 'dns', label: 'Procesador', value: 'Intel Xeon W5-3435 (16 núcleos, 32 hilos)' },
      { icon: 'memory', label: 'Memoria', value: '128GB ECC DDR5 RDIMM' },
      { icon: 'hard_drive', label: 'Almacenamiento', value: '2TB NVMe SSD + 10TB HDD Enterprise' },
    ],
    warranty: { days: 600, pct: 80, label: 'Soporte ProSupport Plus Dell de 3 años', start: 'dic 2023', end: 'dic 2026', status: 'Active' },
    financial: { purchase: '$6,299', book: '$4,900', depreciation: '22.2%', acquired: 'Adquisición de TI' },
    history: [
      { action: 'Desplegado en Servidor Central', date: '10 dic 2023', by: 'Admin de Red', type: 'provision' }
    ],
    maintenance: []
  }
];

const DEFAULT_TICKETS = [
  { id: 'TKT-8902', assetId: 'AST-0854', assetName: 'ThinkPad X1 Carbon', type: 'Reparación de Teclado', severity: 'Media', tech: 'Juan Pérez', cost: '$120.00', status: 'Pending', date: '25 jun 2026' },
  { id: 'TKT-8891', assetId: 'AST-1042', assetName: 'MacBook Pro 16" M2 Max', type: 'Reemplazo de Batería', severity: 'Alta', tech: 'Carlos Gómez', cost: '$0 (Garantía)', status: 'Resolved', date: '20 jun 2026' },
  { id: 'TKT-8874', assetId: 'AST-3102', assetName: 'Cisco Meraki MR46 AP', type: 'Fallo de Conexión / Firmware', severity: 'Crítica', tech: 'Equipo de Red', cost: 'N/A', status: 'Resolved', date: '15 jun 2026' },
  { id: 'TKT-8910', assetId: 'AST-6029', assetName: 'Dell Precision 7960', type: 'Fallo de Fuente de Poder', severity: 'Crítica', tech: 'Marta Rivas', cost: '$450.00', status: 'In Progress', date: '26 jun 2026' },
  { id: 'TKT-8912', assetId: 'AST-5182', assetName: 'iPhone 15 Pro', type: 'Pantalla Rota', severity: 'Baja', tech: 'Soporte Externo', cost: '$250.00', status: 'Pending', date: '26 jun 2026' },
];

const DEFAULT_LOGS = [
  { id: 'LOG-80491', user: 'Sarah Jenkins', email: 's.jenkins@enterprise.com', action: 'Asignación', detail: 'Laptop AST-1042 (MacBook Pro) fue asignada correctamente.', time: 'Hace 2m', icon: 'person_add', iconColor: '#16a34a', iconBg: 'rgba(22,163,74,0.08)' },
  { id: 'LOG-80490', user: 'Soporte de TI', email: 'it@enterprise.com', action: 'Mantenimiento', detail: 'AST-0854 (ThinkPad X1) movido al grupo de reparación por falla de teclado.', time: 'Hace 1h', icon: 'build', iconColor: '#d97706', iconBg: 'rgba(217,119,6,0.08)' },
  { id: 'LOG-80489', user: 'Admin del Sistema', email: 'admin@enterprise.com', action: 'Registro', detail: 'Nuevo activo AST-6029 (Dell Precision 7960) registrado e importado al catálogo.', time: 'Hace 3h', icon: 'add_box', iconColor: '#7c3aed', iconBg: 'rgba(124,58,237,0.08)' },
  { id: 'LOG-80488', user: 'Equipo de Red', email: 'netops@enterprise.com', action: 'Modificación', detail: 'Se actualizaron las MAC y la versión de firmware para AST-3102 Cisco Meraki AP.', time: 'Ayer', icon: 'edit', iconColor: '#0d9488', iconBg: 'rgba(13,148,136,0.08)' },
  { id: 'LOG-80487', user: 'Auditor Externo', email: 'auditor@audit.com', action: 'Auditoría', detail: 'Escaneo QR exitoso y verificación de ubicación remota para AST-4021 iPad Pro.', time: 'Hace 2 días', icon: 'fact_check', iconColor: '#2563eb', iconBg: 'rgba(37,99,235,0.08)' },
  { id: 'LOG-80486', user: 'Soporte de TI', email: 'it@enterprise.com', action: 'Baja', detail: 'AST-1011 (ThinkPad X270) fue dado de baja por obsolescencia tecnológica (chatarra).', time: 'Hace 4 días', icon: 'delete', iconColor: '#dc2626', iconBg: 'rgba(220,38,38,0.08)' },
];

const DEFAULT_AUDIT_SESSIONS = [
  { id: 'AUD-2026-A', name: 'Auditoría Anual Sede New York', date: '15 may 2026', totalChecked: 8520, compliance: '99.8%', status: 'Completado' },
  { id: 'AUD-2026-B', name: 'Conciliación Sucursal San Francisco', date: '10 jun 2026', totalChecked: 3120, compliance: '99.2%', status: 'Completado' },
  { id: 'AUD-2026-C', name: 'Monitoreo General de Equipos Remotos', date: 'En curso', totalChecked: 1456, compliance: '97.5%', status: 'En Progreso' },
];

const DEFAULT_USER = {
  email: "admin@enterprise.com",
  password: "admin123",
  name: "Administrador"
};

async function initDb() {
  try {
    await fs.access(DB_FILE);
  } catch {
    // If db.json does not exist, create it with default data
    const initialData = {
      assets: DEFAULT_ASSETS,
      tickets: DEFAULT_TICKETS,
      logs: DEFAULT_LOGS,
      auditSessions: DEFAULT_AUDIT_SESSIONS,
      user: DEFAULT_USER
    };
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

async function readDb() {
  await initDb();
  const data = await fs.readFile(DB_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  
  // Auto-migrate plaintext password to hashed format
  if (parsed.user && parsed.user.password && !parsed.user.password.startsWith('$2a$') && !parsed.user.password.startsWith('$2b$')) {
    parsed.user.password = bcrypt.hashSync(parsed.user.password, 10);
    await writeDb(parsed);
  }
  return parsed;
}

async function writeDb(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  getAssets: async () => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
    const data = await readDb();
    return data.assets;
  },
  getAssetById: async (id) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('assets').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    return data.assets.find(a => a.id === id);
  },
  saveAsset: async (asset) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('assets').insert(asset).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    data.assets.push(asset);
    await writeDb(data);
    return asset;
  },
  updateAsset: async (id, updates) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    const idx = data.assets.findIndex(a => a.id === id);
    if (idx !== -1) {
      data.assets[idx] = { ...data.assets[idx], ...updates };
      await writeDb(data);
      return data.assets[idx];
    }
    return null;
  },
  deleteAsset: async (id) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('assets').delete().eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    const idx = data.assets.findIndex(a => a.id === id);
    if (idx !== -1) {
      const deleted = data.assets.splice(idx, 1)[0];
      await writeDb(data);
      return deleted;
    }
    return null;
  },
  getTickets: async () => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('tickets').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
    const data = await readDb();
    return data.tickets;
  },
  saveTicket: async (ticket) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('tickets').insert(ticket).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    data.tickets.push(ticket);
    await writeDb(data);
    return ticket;
  },
  updateTicket: async (id, updates) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    const idx = data.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      data.tickets[idx] = { ...data.tickets[idx], ...updates };
      await writeDb(data);
      return data.tickets[idx];
    }
    return null;
  },
  getLogs: async () => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    const data = await readDb();
    return data.logs;
  },
  saveLog: async (log) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('logs').insert(log).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    data.logs.unshift(log);
    await writeDb(data);
    return log;
  },
  getAuditSessions: async () => {
    if (isSupabaseEnabled) {
      return [];
    }
    const data = await readDb();
    return data.auditSessions || [];
  },
  saveAuditSession: async (session) => {
    if (isSupabaseEnabled) {
      return session;
    }
    const data = await readDb();
    data.auditSessions = data.auditSessions || [];
    data.auditSessions.push(session);
    await writeDb(data);
    return session;
  },
  getUser: async () => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw new Error(error.message);
      if (data && data.length > 0) {
        return data[0];
      }
      const defaultUserObj = {
        email: DEFAULT_USER.email,
        password: bcrypt.hashSync(DEFAULT_USER.password, 10),
        name: DEFAULT_USER.name
      };
      const { data: inserted, error: insErr } = await supabase.from('users').insert(defaultUserObj).select().single();
      if (insErr) throw new Error(insErr.message);
      return inserted;
    }
    const data = await readDb();
    if (!data.user) {
      data.user = DEFAULT_USER;
      await writeDb(data);
    }
    return data.user;
  },
  updateUser: async (userUpdates) => {
    if (isSupabaseEnabled) {
      const updates = { ...userUpdates };
      if (updates.password) {
        updates.password = bcrypt.hashSync(updates.password, 10);
      }
      const { data: userList } = await supabase.from('users').select('email');
      const userEmail = (userList && userList.length > 0) ? userList[0].email : DEFAULT_USER.email;
      
      const { data, error } = await supabase.from('users').update(updates).eq('email', userEmail).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const data = await readDb();
    if (!data.user) {
      data.user = DEFAULT_USER;
    }
    if (userUpdates.password) {
      userUpdates.password = bcrypt.hashSync(userUpdates.password, 10);
    }
    data.user = { ...data.user, ...userUpdates };
    await writeDb(data);
    return data.user;
  }
};
