import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import EditAssetModal from '../components/EditAssetModal';

const STATUS_COLORS = {
  Assigned:    { text: '#2563eb', bg: 'rgba(37,99,235,0.08)',    border: 'rgba(37,99,235,0.25)' },
  Available:   { text: '#047857', bg: 'rgba(5,150,105,0.08)',    border: 'rgba(5,150,105,0.25)' },
  Maintenance: { text: '#b45309', bg: 'rgba(217,119,6,0.08)',    border: 'rgba(217,119,6,0.25)' },
  Deployed:    { text: '#6d28d9', bg: 'rgba(124,58,237,0.08)',   border: 'rgba(124,58,237,0.25)' },
  Lent:        { text: '#2563eb', bg: 'rgba(37,99,235,0.08)',    border: 'rgba(37,99,235,0.25)' },
  Active:      { text: '#047857', bg: 'rgba(5,150,105,0.08)',    border: 'rgba(5,150,105,0.25)' },
  Expired:     { text: '#b91c1c', bg: 'rgba(220,38,38,0.08)',    border: 'rgba(220,38,38,0.25)' },
};

const STATUS_LABELS = {
  Assigned:    'Prestado',
  Available:   'Disponible',
  Maintenance: 'Mantenimiento',
  Deployed:    'Desplegado',
  Lent:        'Prestado',
  Active:      'Activa',
  Expired:     'Expirada',
  Pending:     'Pendiente',
  Resolved:    'Resuelto',
  Completed:   'Completado',
  'In Progress': 'En Proceso',
};

const CATEGORY_LABELS = {
  Laptop:     'Laptop',
  Display:    'Pantalla',
  Networking: 'Redes',
  Server:     'Servidor',
  Tablet:     'Tablet',
  Mobile:     'Móvil',
};

const TAB_LABELS = {
  specs:       'Especificaciones',
  assignment:  'Asignación',
  maintenance: 'Mantenimiento',
  financial:   'Finanzas',
};

const HIST_COLORS = {
  assign: '#7c3aed', return: '#0e7490', provision: '#7c3aed', maintenance: '#d97706',
};

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('specs');
  
  // Modals state
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [repairType, setRepairType] = useState('');
  const [repairSeverity, setRepairSeverity] = useState('Media');
  const [repairTech, setRepairTech] = useState('');
  const [repairCost, setRepairCost] = useState('');

  // Loan states
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  // Return checklist states
  const [resetChecked, setResetChecked] = useState(false);
  const [cablesChecked, setCablesChecked] = useState(false);
  const [damageChecked, setDamageChecked] = useState(false);
  const [returnError, setReturnError] = useState('');

  const loadAssetData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAssetById(id);
      setAsset(data);
      setStudentName(data.assignee || '');
      setStudentId(data.borrowerId || '');
      setTableNumber(data.tableNumber || '');
    } catch (err) {
      console.error('Error al cargar detalle del activo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssetData();
  }, [id]);

  const handleCreateRepair = async (e) => {
    e.preventDefault();
    try {
      await api.createTicket({
        assetId: asset.id,
        assetName: asset.name,
        type: repairType,
        severity: repairSeverity,
        tech: repairTech || 'Por asignar',
        cost: repairCost || '0',
      });
      setShowRepairModal(false);
      setRepairType('');
      setRepairTech('');
      setRepairCost('');
      loadAssetData(); // Reload asset info
    } catch (err) {
      alert('Error al registrar reparación: ' + err.message);
    }
  };

  const handleLoan = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !tableNumber.trim()) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    try {
      const updates = {
        status: 'Lent',
        assignee: studentName.trim(),
        borrowerId: studentId.trim(),
        tableNumber: tableNumber.trim(),
        loanDate: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      updates.history = [
        { action: `Prestado a ${studentName.trim()} (Mesa ${tableNumber.trim()})`, date: currentDate, by: 'Profesor de Redes', type: 'assign' },
        ...(asset.history || [])
      ];

      await api.updateAsset(asset.id, updates);

      await api.createLog({
        user: 'Profesor de Redes',
        email: 'admin@enterprise.com',
        action: 'Asignación',
        detail: `Equipo ${asset.id} (${asset.name}) prestado a ${studentName.trim()} (Mesa ${tableNumber.trim()}).`,
        icon: 'assignment_turned_in',
        iconColor: '#2563eb',
        iconBg: 'rgba(37,99,235,0.08)',
      });

      setShowLoanModal(false);
      loadAssetData();
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert('Error al registrar préstamo: ' + err.message);
    }
  };

  const handleReturn = async () => {
    if (!resetChecked && !cablesChecked && !damageChecked) {
      setReturnError('Marca al menos un punto del checklist antes de confirmar.');
      return;
    }
    try {
      const updates = {
        status: 'Available',
        assignee: null,
        borrowerId: null,
        tableNumber: null,
        loanDate: null,
      };

      const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      updates.history = [
        { action: 'Devuelto de clase / Reintegrado a Stock', date: currentDate, by: 'Profesor de Redes', type: 'return' },
        ...(asset.history || [])
      ];

      await api.updateAsset(asset.id, updates);

      await api.createLog({
        user: 'Profesor de Redes',
        email: 'admin@enterprise.com',
        action: 'Devolución',
        detail: `Equipo ${asset.id} (${asset.name}) devuelto y restablecido por el profesor.`,
        icon: 'check_circle',
        iconColor: '#0e7490',
        iconBg: 'rgba(5,150,105,0.08)',
      });

      setShowReturnModal(false);
      loadAssetData();
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      setReturnError(err.message || 'Error al devolver el activo.');
    }
  };



  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3 animate-fade-in">
        <div className="w-8 h-8 border-2 border-violet-600/20 border-t-violet-700 rounded-full animate-spin" />
        <span>Cargando detalles de equipo...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-8 text-center text-slate-500 animate-fade-in">
        <span className="material-symbols-outlined text-red-500" style={{ fontSize: '48px' }}>error</span>
        <p className="mt-2 text-[14px]">No se pudo encontrar el activo solicitado.</p>
        <Link to="/assets" className="text-violet-700 hover:text-violet-800 transition-colors mt-4 inline-block font-semibold">Volver al Inventario</Link>
      </div>
    );
  }

  const getSpecsList = () => {
    if (!asset) return [];
    if (asset.sub) {
      const parts = asset.sub.split(/[·,|;]/);
      const parsed = parts
        .map(part => part.trim())
        .filter(Boolean)
        .map((part, index) => {
          let icon = 'info';
          let label = 'Detalle';
          
          const lower = part.toLowerCase();
          if (lower.includes('ram') || lower.includes('memoria') || lower.includes('ddr')) {
            icon = 'memory';
            label = 'Memoria RAM';
          } else if (lower.includes('ssd') || lower.includes('hdd') || lower.includes('nvme') || lower.includes('disco') || lower.includes('almacenamiento') || lower.includes('tb') || (lower.includes('gb') && !lower.includes('ram'))) {
            icon = 'hard_drive';
            label = 'Almacenamiento';
          } else if (lower.includes('pro') || lower.includes('core') || lower.includes('intel') || lower.includes('amd') || lower.includes('m1') || lower.includes('m2') || lower.includes('m3') || lower.includes('procesador') || lower.includes('cpu') || lower.includes('xeon') || lower.includes('snapdragon')) {
            icon = 'developer_board';
            label = 'Procesador';
          } else if (lower.includes('antena') || lower.includes('puerto') || lower.includes('rj45') || lower.includes('switch') || lower.includes('router') || lower.includes('cisco') || lower.includes('red') || lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('ap')) {
            icon = 'router';
            label = 'Red / Conectividad';
          } else if (lower.includes('pantalla') || lower.includes('display') || lower.includes('resolución') || lower.includes('4k') || lower.includes('hz') || lower.includes('ips') || lower.includes('oled')) {
            icon = 'monitor';
            label = 'Pantalla';
          } else if (lower.includes('batería') || lower.includes('battery') || lower.includes('mah')) {
            icon = 'battery_charging_full';
            label = 'Batería';
          }
          
          return {
            icon,
            label,
            value: part
          };
        });
        
      if (parsed.length > 0) {
        return parsed;
      }
    }
    return asset.specs || [];
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const updates = { status: newStatus };
      const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      
      let actionText = '';
      let logAction = 'Modificación';
      let icon = 'sync';
      let iconColor = '#2563eb';
      let iconBg = 'rgba(37,99,235,0.08)';

      if (newStatus === 'Available') {
        if (asset.status === 'Maintenance') {
          actionText = 'Mantenimiento finalizado / Retornado a Stock';
          logAction = 'Mantenimiento';
          icon = 'check_circle';
          iconColor = '#0e7490';
          iconBg = 'rgba(5,150,105,0.08)';
          
          if (asset.maintenance) {
            updates.maintenance = asset.maintenance.map(m => 
              m.status === 'Pending' ? { ...m, status: 'Resolved' } : m
            );
          }
        } else if (asset.status === 'Deployed') {
          actionText = 'Retirado de producción / Retornado a Stock';
          icon = 'settings_backup_restore';
          iconColor = '#64748b';
          iconBg = 'rgba(100,116,139,0.08)';
        } else {
          actionText = 'Equipo marcado como Disponible';
        }
      } else if (newStatus === 'Deployed') {
        actionText = 'Equipo desplegado en infraestructura de aula';
        logAction = 'Modificación';
        icon = 'publish';
        iconColor = '#6d28d9';
        iconBg = 'rgba(124,58,237,0.08)';
      }

      updates.history = [
        { action: actionText, date: currentDate, by: 'Profesor de Redes', type: 'info' },
        ...(asset.history || [])
      ];

      await api.updateAsset(asset.id, updates);

      await api.createLog({
        user: 'Profesor de Redes',
        email: 'admin@enterprise.com',
        action: logAction,
        detail: `Equipo ${asset.id} (${asset.name}): ${actionText.toLowerCase()}.`,
        icon,
        iconColor,
        iconBg,
      });

      loadAssetData();
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const sc = STATUS_COLORS[asset.status] || STATUS_COLORS.Available;

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-5 animate-fade-in max-w-[1400px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <Link to="/" className="hover:text-slate-600 transition-colors">Panel Principal</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>chevron_right</span>
        <Link to="/assets" className="hover:text-slate-600 transition-colors">Activos</Link>
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>chevron_right</span>
        <span className="text-violet-700 font-semibold">{asset.id}</span>
      </div>

      {/* Hero Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden bg-[var(--bg-card)] border border-[var(--border-light)]"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
          background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #a78bfa)',
        }} />
        <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at right center, rgba(124, 58, 237,0.07) 0%, transparent 70%)',
        }} />

        <div className="relative flex flex-col md:flex-row justify-between gap-5">
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237,0.12) 0%, rgba(20,184,166,0.08) 100%)',
                border: '1px solid rgba(124, 58, 237,0.2)',
                boxShadow: '0 4px 16px rgba(124, 58, 237,0.1)',
              }}
            >
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: '32px', color: '#7c3aed' }}>
                {asset.category === 'Laptop' ? 'laptop' : asset.category === 'Display' ? 'monitor' : asset.category === 'Networking' ? 'router' : 'devices'}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.text }} />
                  {STATUS_LABELS[asset.status] || asset.status}
                </span>
                <span className="badge" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid rgba(15,23,42,0.1)' }}>
                  {CATEGORY_LABELS[asset.category] || asset.category}
                </span>
              </div>
              <h2 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">{asset.name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>tag</span>
                  <span className="font-mono font-medium">N/S: {asset.serial}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calendar_today</span>
                  <span>Adquirido: {asset.purchaseDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:self-start">
            <button 
              onClick={() => setShowEditModal(true)}
              className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
              Editar
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
              Eliminar
            </button>
            <button 
              onClick={() => setShowRepairModal(true)}
              className="btn-ghost flex items-center gap-1.5 text-[12px]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>build_circle</span>
              Registrar Reparación
            </button>
            {/* Context-aware lending and status actions */}
            {(asset.status === 'Lent' || asset.status === 'Assigned') ? (
              <button 
                onClick={() => {
                  setResetChecked(false);
                  setCablesChecked(false);
                  setDamageChecked(false);
                  setReturnError('');
                  setShowReturnModal(true);
                }}
                className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>assignment_return</span>
                Devolver Equipo
              </button>
            ) : asset.status === 'Available' ? (
              <>
                <button 
                  onClick={() => setShowLoanModal(true)}
                  className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>send_to_mobile</span>
                  Prestar Equipo
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Deployed')}
                  className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>publish</span>
                  Desplegar en Aula
                </button>
              </>
            ) : asset.status === 'Maintenance' ? (
              <button 
                onClick={() => handleUpdateStatus('Available')}
                className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                Marcar como Disponible (Reparado)
              </button>
            ) : asset.status === 'Deployed' ? (
              <button 
                onClick={() => handleUpdateStatus('Available')}
                className="btn-ghost flex items-center gap-1.5 text-[12px] hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>settings_backup_restore</span>
                Retirar de Producción (Disponible)
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Repair Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRepairModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-[15px] font-bold text-slate-800">Registrar Mantenimiento / Falla</h3>
              <button onClick={() => setShowRepairModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleCreateRepair} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Detalle del Problema</label>
                <input
                  type="text"
                  placeholder="Ej. Pantalla estrellada, reinstalación de SO"
                  className="input-premium py-2 text-[12px] px-3"
                  value={repairType}
                  onChange={e => setRepairType(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Criticidad</label>
                <select
                  className="input-premium py-2 text-[12px] px-3 appearance-none cursor-pointer"
                  value={repairSeverity}
                  onChange={e => setRepairSeverity(e.target.value)}
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
                  placeholder="Ej. Soporte Lenovo, Carlos G."
                  className="input-premium py-2 text-[12px] px-3"
                  value={repairTech}
                  onChange={e => setRepairTech(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Costo Estimado (COP)</label>
                <input
                  type="number"
                  placeholder="Ej. 100"
                  className="input-premium py-2 text-[12px] px-3"
                  value={repairCost}
                  onChange={e => setRepairCost(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowRepairModal(false)}
                  className="px-4 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-electric px-5 py-2 text-[12px]">
                  Guardar y Mover a Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLoanModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-light)] shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-light)]">
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '18px' }}>send_to_mobile</span>
                Prestar Equipo a Alumno
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleLoan} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nombre Completo del Alumno</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  className="input-premium py-2 px-3 text-[12px]"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Matrícula / ID</label>
                <input
                  type="text"
                  placeholder="Ej. 2026-0429"
                  className="input-premium py-2 px-3 text-[12px]"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mesa / Puesto</label>
                <input
                  type="text"
                  placeholder="Ej. Mesa 4"
                  className="input-premium py-2 px-3 text-[12px]"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors bg-transparent"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-electric px-5 py-2 text-[12px]">
                  Registrar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Checklist Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReturnModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden border border-[var(--border-light)] animate-fade-in">
            <div className="h-[3px] bg-gradient-to-r from-violet-600 to-cyan-500" />
            <div className="px-6 py-4 border-b border-[var(--border-light)] flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '18px' }}>task_alt</span>
                Retorno Seguro: {asset.id}
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
                Para reintegrar el equipo <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.name}</span> al stock disponible, complete la lista de verificación:
              </p>
              {returnError && (
                <div className="text-[12px] text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 rounded-lg">
                  {returnError}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)] cursor-pointer hover:bg-slate-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetChecked}
                    onChange={e => setResetChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-violet-700 border-slate-300 rounded focus:ring-violet-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">Restablecimiento de Sistema</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">La configuración previa o consola del switch/router ha sido borrada (Factory Reset).</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)] cursor-pointer hover:bg-slate-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={cablesChecked}
                    onChange={e => setCablesChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-violet-700 border-slate-300 rounded focus:ring-violet-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">Cables y Accesorios</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Se han recibido los cables de alimentación, cable de consola (si aplica) y adaptadores.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)] cursor-pointer hover:bg-slate-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={damageChecked}
                    onChange={e => setDamageChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-violet-700 border-slate-300 rounded focus:ring-violet-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">Inspección Física</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">El equipo no presenta daños físicos visibles, golpes o puertos dañados en la sesión.</div>
                  </div>
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--border-light)] pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReturn}
                  className="btn-electric px-5 py-2 text-[12px] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
                  Confirmar Retorno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl self-start bg-[var(--bg-card)] border border-[var(--border-light)]"
      >
        {['specs', 'assignment', 'maintenance', 'financial'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg capitalize text-[13px] font-medium transition-all duration-200"
            style={activeTab === tab
              ? { background: 'rgba(124, 58, 237,0.08)', color: '#15803d', border: '1px solid rgba(124, 58, 237,0.2)' }
              : { color: '#94a3b8', border: '1px solid transparent' }
            }
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* === SPECS TAB === */}
      {activeTab === 'specs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 card" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Especificaciones Técnicas</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getSpecsList().map((spec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)]"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(124, 58, 237,0.08)', border: '1px solid rgba(124, 58, 237,0.15)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7c3aed' }}>{spec.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{spec.label}</div>
                    {spec.mono
                      ? <div className="text-[12px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded inline-block">{spec.value}</div>
                      : <div className="text-[13px] text-slate-700 dark:text-slate-200 leading-snug">{spec.value}</div>
                    }
                    {spec.detail && <div className="text-[11px] text-slate-400 mt-1">{spec.detail}</div>}
                    {spec.pct != null && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Utilización</span>
                          <span className="text-violet-700 font-semibold">{spec.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${spec.pct}%`,
                              background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                              boxShadow: '0 0 6px rgba(124, 58, 237,0.3)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Warranty */}
            {asset.warranty && (
              <div className="card" style={{ padding: '22px' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Garantía</span>
                  <span
                    className="badge text-[10px]"
                    style={{
                      background: STATUS_COLORS[asset.warranty.status]?.bg || 'rgba(100,116,139,0.08)',
                      color: STATUS_COLORS[asset.warranty.status]?.text || '#64748b',
                      border: `1px solid ${STATUS_COLORS[asset.warranty.status]?.border || 'rgba(100,116,139,0.2)'}`,
                    }}
                  >
                    {STATUS_LABELS[asset.warranty.status] || asset.warranty.status}
                  </span>
                </div>

                <div className="flex items-end gap-2 mb-1">
                  <span
                    className="text-[36px] font-bold leading-none"
                    style={{ color: asset.warranty.days > 0 ? '#15803d' : '#b91c1c' }}
                  >
                    {asset.warranty.days}
                  </span>
                  <span className="text-[13px] text-slate-400 pb-1">días restantes</span>
                </div>
                <p className="text-[12px] text-slate-500 mb-4">{asset.warranty.label}</p>

                {asset.warranty.days > 0 && (
                  <>
                    <div className="h-2 rounded-full overflow-hidden mb-2 bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${asset.warranty.pct}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                          boxShadow: '0 0 6px rgba(124, 58, 237,0.3)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{asset.warranty.start}</span>
                      <span>{asset.warranty.end}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Financial */}
            {asset.financial && (
              <div className="card" style={{ padding: '22px' }}>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-4">Valor del Activo</span>

                {[
                  { label: 'Precio de Compra', value: asset.financial.purchase, color: '#0f172a' },
                  { label: 'Valor Contable',    value: asset.financial.book,     color: '#15803d' },
                  { label: 'Depreciación',    value: asset.financial.depreciation, color: '#b45309' },
                  { label: 'Adquisición',     value: asset.financial.acquired,  color: '#64748b' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2.5"
                    style={{ borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}
                  >
                    <span className="text-[12px] text-slate-500">{row.label}</span>
                    <span className="text-[13px] font-semibold font-mono" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === ASSIGNMENT TAB === */}
      {activeTab === 'assignment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-slate-800">Asignación Actual</h3>
              {asset.assigneeDetail && (
                <span className="badge" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid rgba(15,23,42,0.1)' }}>
                  Depto: {asset.assigneeDetail.dept}
                </span>
              )}
            </div>

            {asset.status === 'Lent' ? (
              <div
                className="flex items-center gap-4 p-4 rounded-xl mb-5"
                style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
                >
                  <span className="text-white font-bold text-[16px]">{asset.assignee ? asset.assignee[0] : 'A'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{asset.assignee}</div>
                  <div className="text-[12px] text-slate-500">Alumno • Mesa/Laboratorio: {asset.tableNumber || 'N/A'}</div>
                  <div className="text-[11px] text-blue-600 mt-1">Matrícula: {asset.borrowerId || 'N/A'}</div>
                </div>
              </div>
            ) : asset.assigneeDetail ? (
              <div
                className="flex items-center gap-4 p-4 rounded-xl mb-5"
                style={{ background: 'rgba(124, 58, 237,0.04)', border: '1px solid rgba(124, 58, 237,0.12)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 4px 12px rgba(124, 58, 237,0.25)' }}
                >
                  <span className="text-white font-bold text-[16px]">{asset.assigneeDetail.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-800">{asset.assigneeDetail.name}</div>
                  <div className="text-[12px] text-slate-500">{asset.assigneeDetail.role}</div>
                  <div className="text-[11px] text-violet-700 mt-1">{asset.assigneeDetail.email}</div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-400 text-[13px] mb-5">
                Este equipo se encuentra en Stock disponible y no está asignado.
              </div>
            )}

            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Línea de Tiempo de Asignación
            </div>

            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-100" />
              {(asset.history || []).map((h, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10"
                    style={{
                      background: i === 0 ? `${HIST_COLORS[h.type]}15` : '#f8fafc',
                      border: `1px solid ${i === 0 ? HIST_COLORS[h.type] + '40' : '#e2e8f0'}`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: HIST_COLORS[h.type] || '#94a3b8' }} />
                  </div>
                  <div style={{ opacity: i === 0 ? 1 : 0.5 }}>
                    <p className="text-[13px] font-semibold text-slate-700 leading-tight">{h.action}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{h.date} · {h.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card flex flex-col overflow-hidden" style={{ padding: '0' }}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7c3aed' }}>build</span>
                Resumen de Mantenimiento
              </h3>
            </div>
            <div className="divide-y divide-slate-50 overflow-auto flex-1 max-h-[360px]">
              {(asset.maintenance || []).length > 0 ? (asset.maintenance || []).map((m, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="text-[11px] font-mono text-slate-400 w-24 flex-shrink-0">{m.date}</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-slate-700">{m.type}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{m.cost}</div>
                  </div>
                  <span className="badge text-[10px]" style={{
                    background: m.status === 'Pending' ? 'rgba(217,119,6,0.08)' : 'rgba(5,150,105,0.08)',
                    color: m.status === 'Pending' ? '#b45309' : '#047857',
                    border: `1px solid ${m.status === 'Pending' ? 'rgba(217,119,6,0.2)' : 'rgba(5,150,105,0.2)'}`,
                  }}>
                    {STATUS_LABELS[m.status] || m.status}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 text-[12px]">
                  No hay incidencias registradas para este equipo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === MAINTENANCE TAB === */}
      {activeTab === 'maintenance' && (
        <div className="card overflow-hidden" style={{ padding: '0' }}>
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <h3 className="text-[15px] font-bold text-slate-800">Registro de Mantenimiento</h3>
            <button 
              onClick={() => setShowRepairModal(true)}
              className="btn-electric flex items-center gap-1.5 text-[12px]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
              Registrar Incidente
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Fecha', 'Tipo de Incidente', 'Estado', 'Costo'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(asset.maintenance || []).length > 0 ? (asset.maintenance || []).map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-[12px] font-mono text-slate-500">{m.date}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-700">{m.type}</td>
                  <td className="px-5 py-4">
                    <span className="badge text-[10px]" style={{
                      background: m.status === 'Pending' ? 'rgba(217,119,6,0.08)' : 'rgba(5,150,105,0.08)',
                      color: m.status === 'Pending' ? '#b45309' : '#047857',
                      border: `1px solid ${m.status === 'Pending' ? 'rgba(217,119,6,0.2)' : 'rgba(5,150,105,0.2)'}`,
                    }}>
                      {STATUS_LABELS[m.status] || m.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-mono text-slate-500">{m.cost}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 text-[13px]">
                    No hay incidencias registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* === FINANCIAL TAB === */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {asset.financial ? [
            { label: 'Precio de Compra', value: asset.financial.purchase,    icon: 'receipt',          color: '#15803d', bg: 'rgba(124, 58, 237,0.08)' },
            { label: 'Valor Contable',    value: asset.financial.book,         icon: 'account_balance',  color: '#047857', bg: 'rgba(5,150,105,0.08)' },
            { label: 'Depreciación',     value: asset.financial.depreciation, icon: 'trending_down',    color: '#b45309', bg: 'rgba(217,119,6,0.08)' },
          ].map((f, i) => (
            <div key={i} className="card" style={{ padding: '22px' }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{f.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: f.bg }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: f.color }}>{f.icon}</span>
                </div>
              </div>
              <div className="text-[28px] font-bold leading-none mb-1" style={{ color: f.color }}>{f.value}</div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: i === 2 ? '37%' : i === 1 ? '63%' : '100%', background: `linear-gradient(90deg, ${f.color}, ${i === 0 ? '#06b6d4' : f.color + 'aa'})` }} />
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center p-8 text-slate-400 text-[13px]">
              No hay datos financieros para este equipo.
            </div>
          )}
        </div>
      )}
      {/* Edit Asset Modal */}
      <EditAssetModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        asset={asset}
        onSave={(updatedAsset) => {
          setAsset(updatedAsset);
          window.dispatchEvent(new CustomEvent('inventory-updated'));
        }}
      />

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          {/* Modal Content */}
          <div 
            className="relative z-10 w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] p-6 shadow-2xl transition-all duration-300 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 dark:text-red-500 font-semibold" style={{ fontSize: '24px' }}>warning</span>
            </div>
            
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-2">Confirmar Baja del Activo</h3>
            
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              ¿Está seguro de que desea dar de baja y eliminar permanentemente el activo <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.id} ({asset.name})</span>? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-[var(--border-light)] bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  try {
                    setIsLoading(true);
                    await api.deleteAsset(asset.id);
                    window.dispatchEvent(new CustomEvent('inventory-updated'));
                    navigate('/assets');
                  } catch (err) {
                    alert('Error al eliminar el activo: ' + err.message);
                    setIsLoading(false);
                  }
                }}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
