import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { getAssetImage } from '../utils/images';
import { productKey } from '../utils/products';

const STATUS_CONFIG = {
  Available:   { color: '#047857', bg: 'rgba(5,150,105,0.08)',    border: 'rgba(5,150,105,0.2)',    dot: '#0e7490' },
  Lent:        { color: '#2563eb', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)',   dot: '#2563eb' },
};

const CATEGORY_LABELS = {
  Laptop:     'Laptop',
  Display:    'Pantalla',
  Networking: 'Redes',
  Server:     'Servidor',
  Tablet:     'Tablet',
  Mobile:     'Móvil',
};

const CATEGORY_ICONS = {
  Laptop: 'laptop', Display: 'monitor', Networking: 'router', Server: 'dns',
  Tablet: 'tablet', Mobile: 'smartphone', default: 'devices',
};

export default function Loans() {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Checkout Form States
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [loanQty, setLoanQty] = useState(1);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loansSearch, setLoansSearch] = useState('');

  // Return Modal States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [unitsToReturn, setUnitsToReturn] = useState([]);
  const [isReturning, setIsReturning] = useState(false);
  const [resetChecked, setResetChecked] = useState(false);
  const [cablesChecked, setCablesChecked] = useState(false);
  const [damageChecked, setDamageChecked] = useState(false);
  const [returnError, setReturnError] = useState('');

  // Class Session Timer States
  const [durationInput, setDurationInput] = useState(120); // default 2h
  const [timerRemaining, setTimerRemaining] = useState(null); // in seconds
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef(null);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Error cargando activos para préstamos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();

    // Load timer state from localStorage
    const savedEndTime = localStorage.getItem('class_timer_end');
    const savedActive = localStorage.getItem('class_timer_active') === 'true';
    if (savedEndTime && savedActive) {
      const remaining = Math.round((parseInt(savedEndTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setTimerRemaining(remaining);
        setTimerActive(true);
      } else {
        localStorage.removeItem('class_timer_end');
        localStorage.removeItem('class_timer_active');
      }
    }

    // Event listener for auto-refresh
    const handleUpdate = () => loadAssets();
    window.addEventListener('inventory-updated', handleUpdate);
    return () => {
      window.removeEventListener('inventory-updated', handleUpdate);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer Tick Hook
  useEffect(() => {
    if (timerActive && timerRemaining !== null) {
      intervalRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerActive(false);
            localStorage.removeItem('class_timer_active');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);

  const handleStartTimer = (e) => {
    e.preventDefault();
    const totalSeconds = durationInput * 60;
    const endTime = Date.now() + totalSeconds * 1000;
    localStorage.setItem('class_timer_end', String(endTime));
    localStorage.setItem('class_timer_active', 'true');
    setTimerRemaining(totalSeconds);
    setTimerActive(true);
  };

  const handleStopTimer = () => {
    localStorage.removeItem('class_timer_end');
    localStorage.setItem('class_timer_active', 'false');
    setTimerActive(false);
    setTimerRemaining(null);
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds < 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    const group = availableGroups.find(g => g.key === selectedGroupKey);
    if (!group) {
      setFormError('Por favor seleccione un equipo de la lista.');
      return;
    }
    if (!studentName.trim() || !studentId.trim() || !tableNumber.trim()) {
      setFormError('Todos los campos del alumno y de mesa son obligatorios.');
      return;
    }

    const qty = Math.min(group.units.length, Math.max(1, Math.floor(Number(loanQty)) || 1));
    const units = group.units.slice(0, qty);

    setIsSubmitting(true);
    try {
      await api.createLoan({
        assetIds: units.map(u => u.id),
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        tableNumber: tableNumber.trim(),
        loanDate: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      });

      setFormSuccess(
        qty === 1
          ? `¡Equipo ${units[0].id} asignado con éxito a ${studentName.trim()}!`
          : `¡${qty} unidades de ${group.name} asignadas con éxito a ${studentName.trim()}!`
      );
      setSelectedGroupKey('');
      setLoanQty(1);
      setStudentName('');
      setStudentId('');
      setTableNumber('');
      loadAssets();

      // Dispatch global event for inventory lists
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      setFormError(err.message || 'Error al procesar el préstamo.');
      loadAssets(); // the list may be stale (e.g. a unit was lent meanwhile)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReturnModal = (units) => {
    setUnitsToReturn(units);
    setResetChecked(false);
    setCablesChecked(false);
    setDamageChecked(false);
    setReturnError('');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    if (!resetChecked && !cablesChecked && !damageChecked) {
      setReturnError('Marca al menos un punto del checklist antes de confirmar.');
      return;
    }

    setIsReturning(true);
    try {
      await api.returnLoans(unitsToReturn.map(u => u.id));

      setShowReturnModal(false);
      setUnitsToReturn([]);
      loadAssets();

      // Dispatch global event
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      setReturnError(err.message || 'Error al procesar la devolución.');
      loadAssets(); // the list may be stale
    } finally {
      setIsReturning(false);
    }
  };

  const availableAssets = assets.filter(a => a.status === 'Available');

  // Identical units (same name, category and description) are offered as one product with a count.
  const availableGroups = (() => {
    const map = new Map();
    for (const a of [...availableAssets].sort((x, y) => x.id.localeCompare(y.id))) {
      const key = productKey(a);
      if (!map.has(key)) map.set(key, { key, name: a.name, category: a.category, units: [] });
      map.get(key).units.push(a);
    }
    return [...map.values()].sort((x, y) => x.name.localeCompare(y.name));
  })();
  const selectedGroup = availableGroups.find(g => g.key === selectedGroupKey);
  const maxQty = selectedGroup ? selectedGroup.units.length : 1;
  const qtyValue = Math.min(maxQty, Math.max(1, Math.floor(Number(loanQty)) || 1));
  const lentAssets = assets.filter(a => a.status === 'Lent' || a.status === 'Assigned');

  // All units currently lent to the same student (used by "Devolver todo").
  const studentKey = (a) => `${String(a.assignee ?? '').trim().toLowerCase()}|${String(a.borrowerId ?? '').trim().toLowerCase()}`;
  const lentByStudent = new Map();
  for (const a of lentAssets) {
    const k = studentKey(a);
    if (!lentByStudent.has(k)) lentByStudent.set(k, []);
    lentByStudent.get(k).push(a);
  }

  const filteredLentAssets = lentAssets.filter(asset => {
    const q = loansSearch.toLowerCase();
    return !q ||
      asset.id.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      (asset.assignee || '').toLowerCase().includes(q) ||
      (asset.borrowerId || '').toLowerCase().includes(q) ||
      (asset.tableNumber || '').toLowerCase().includes(q);
  });

  // Timer visual colors based on state
  const isTimeCritical = timerRemaining !== null && timerRemaining <= 900; // Less than 15 minutes
  const isTimeExpired = timerRemaining === 0;

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-widest mb-1">Sesión de Laboratorio</p>
          <h2 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 leading-tight">Préstamos de Clase</h2>
          <p className="text-[13px] text-slate-500 mt-1">Lending ágil de hardware de redes e informática para alumnos durante las sesiones de clase</p>
        </div>
      </div>

      {/* Overview Cards & Session Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-3 gap-3">
          <div className="rounded-xl px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm">
            <div className="text-[22px] font-bold text-slate-700 dark:text-slate-200">{assets.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Equipos Totales</div>
          </div>
          <div className="rounded-xl px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm">
            <div className="text-[22px] font-bold text-violet-700">{availableAssets.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Disponibles en Armario</div>
          </div>
          <div className="rounded-xl px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm">
            <div className="text-[22px] font-bold text-blue-600">{lentAssets.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Prestados en Clase</div>
          </div>
        </div>

        {/* Timer Card */}
        <div className="lg:col-span-5 card flex flex-col justify-between animate-fade-in" style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '16px' }}>timer</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cronómetro de Clase</span>
            </div>
            {timerActive && (
              <span className={`w-2 h-2 rounded-full ${isTimeCritical ? 'bg-red-500 animate-ping' : 'bg-violet-600 animate-pulse'}`} />
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            {timerActive ? (
              <div className="flex-1 flex items-center justify-between">
                <div 
                  className={`text-[26px] font-mono font-bold leading-none tracking-tight ${
                    isTimeExpired ? 'text-red-600 dark:text-red-500' : isTimeCritical ? 'text-amber-500 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {formatTime(timerRemaining)}
                </div>
                <button
                  onClick={handleStopTimer}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors border border-red-200/30"
                >
                  Finalizar Clase
                </button>
              </div>
            ) : (
              <form onSubmit={handleStartTimer} className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    className="input-premium py-1.5 pl-3 pr-8 text-[12px] w-full appearance-none cursor-pointer"
                    value={durationInput}
                    onChange={e => setDurationInput(parseInt(e.target.value))}
                  >
                    <option value={45}>45 Minutos</option>
                    <option value={90}>90 Minutos</option>
                    <option value={120}>2 Horas (120 min)</option>
                    <option value={180}>3 Horas (180 min)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '14px' }}>expand_more</span>
                </div>
                <button
                  type="submit"
                  className="btn-electric py-1.5 px-4 text-[12px] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>
                  Iniciar
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Left Side: Checkout / Form */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '18px' }}>send_to_mobile</span>
              Prestar Equipo a Alumno
            </h3>

            <form onSubmit={handleCheckout} className="flex flex-col gap-4">
              {formError && (
                <div className="text-[12px] text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="text-[12px] text-violet-700 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 p-2.5 rounded-lg">
                  {formSuccess}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-medium">Dispositivo de Laboratorio</label>
                <div className="relative">
                  <select
                    className="input-premium w-full py-2 pl-3 pr-8 text-[12px] appearance-none cursor-pointer font-medium"
                    value={selectedGroupKey}
                    onChange={e => { setSelectedGroupKey(e.target.value); setLoanQty(1); }}
                    required
                  >
                    <option value="">-- Seleccionar Equipo Disponible --</option>
                    {availableGroups.map(g => (
                      <option key={g.key} value={g.key}>
                        {g.units.length === 1
                          ? `[${g.units[0].id}] ${g.name} — ${CATEGORY_LABELS[g.category] || g.category}`
                          : `${g.name} — ${CATEGORY_LABELS[g.category] || g.category} (${g.units.length} disponibles)`}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '16px' }}>expand_more</span>
                </div>
              </div>

              {selectedGroup && selectedGroup.units.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-medium">Unidades a prestar</label>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-stretch rounded-xl border border-slate-200 overflow-hidden bg-[var(--bg-card)]">
                      <button
                        type="button"
                        onClick={() => setLoanQty(Math.max(1, qtyValue - 1))}
                        disabled={qtyValue <= 1}
                        aria-label="Menos unidades"
                        className="w-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>remove</span>
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max={maxQty}
                        value={loanQty}
                        onChange={e => setLoanQty(e.target.value === '' ? '' : Math.min(maxQty, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
                        onBlur={() => setLoanQty(qtyValue)}
                        onFocus={e => e.target.select()}
                        aria-label="Unidades a prestar"
                        className="w-14 text-center text-[13px] font-bold text-slate-800 dark:text-slate-100 bg-transparent border-x border-slate-200 outline-none py-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setLoanQty(Math.min(maxQty, qtyValue + 1))}
                        disabled={qtyValue >= maxQty}
                        aria-label="Más unidades"
                        className="w-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>add</span>
                      </button>
                    </div>
                    <p className="text-[11.5px] text-slate-400 leading-snug flex-1">
                      de <span className="font-semibold text-slate-600">{maxQty}</span> disponibles. Se asignan {qtyValue === 1 ? 'la primera unidad' : `las ${qtyValue} primeras unidades`} al mismo alumno.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-medium font-medium">Nombre Completo del Alumno</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  className="input-premium py-2 px-3 text-[12px]"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-medium">Matrícula / ID</label>
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
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-medium">Mesa / Puesto</label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa 4"
                    className="input-premium py-2 px-3 text-[12px]"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || availableAssets.length === 0}
                className="btn-electric w-full py-2.5 text-[12px] flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmitting ? 'Procesando...' : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>assignment_ind</span>
                    <span>{qtyValue > 1 ? `Prestar ${qtyValue} Unidades` : 'Registrar Salida'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Active Loans List */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="card" style={{ padding: '0' }}>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-light)] bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 animate-pulse" style={{ fontSize: '18px' }}>clinical_notes</span>
                  Monitoreo de Préstamos Activos
                </h3>
                <span className="badge text-[11px]" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }}>
                  {lentAssets.length}
                </span>
              </div>
              <div className="relative w-full sm:w-60">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style={{ fontSize: '15px' }}>search</span>
                <input
                  type="text"
                  placeholder="Filtrar por alumno, mesa, ID..."
                  className="input-premium w-full pl-8 pr-3 py-1 text-[12px] bg-[var(--bg-base)]"
                  style={{ height: '30px' }}
                  value={loansSearch}
                  onChange={e => setLoansSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30">
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[100px]">ID Equipo</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hardware</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alumno</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estación</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">Salida</th>
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[110px] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[12px] text-slate-400">
                        Cargando préstamos...
                      </td>
                    </tr>
                  ) : filteredLentAssets.length > 0 ? (
                    filteredLentAssets.map((asset) => {
                      const catIcon = CATEGORY_ICONS[asset.category] || CATEGORY_ICONS.default;
                      return (
                        <tr key={asset.id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[12px] font-bold text-violet-700 font-mono">{asset.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 bg-white">
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
                              <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{asset.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{asset.assignee}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{asset.borrowerId}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{asset.tableNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] text-slate-400 font-mono">{asset.loanDate || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex flex-col items-end gap-1">
                              <button
                                onClick={() => handleOpenReturnModal([asset])}
                                className="px-2.5 py-1 rounded bg-violet-50 dark:bg-violet-950/20 text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-950/40 border border-violet-200/30 text-[11px] font-bold transition-all"
                              >
                                Devolver
                              </button>
                              {(lentByStudent.get(studentKey(asset))?.length ?? 0) > 1 && (
                                <button
                                  onClick={() => handleOpenReturnModal(lentByStudent.get(studentKey(asset)))}
                                  title={`Devolver todos los equipos de ${asset.assignee}`}
                                  className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-950/40 border border-blue-200/40 text-[11px] font-bold transition-all whitespace-nowrap"
                                >
                                  Devolver todo ({lentByStudent.get(studentKey(asset)).length})
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-16 text-center">
                        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>search_off</span>
                        <p className="text-[13px] text-slate-400">
                          {lentAssets.length > 0 ? 'No se encontraron préstamos para la búsqueda' : 'Sin préstamos activos en esta sesión'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Return & Checklist Modal */}
      {showReturnModal && unitsToReturn.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReturnModal(false)} />

          <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden border border-[var(--border-light)] animate-fade-in">
            <div className="h-[3px] bg-gradient-to-r from-violet-600 to-cyan-500" />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-light)] flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '18px' }}>task_alt</span>
                {unitsToReturn.length === 1 ? `Retorno Seguro: ${unitsToReturn[0].id}` : `Retorno Seguro: ${unitsToReturn.length} equipos`}
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4">
              {unitsToReturn.length === 1 ? (
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
                  Para reintegrar el equipo <span className="font-semibold text-slate-700 dark:text-slate-200">{unitsToReturn[0].name}</span> al stock disponible, complete la lista de verificación:
                </p>
              ) : (
                <div className="mb-1">
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Se reintegrarán al stock los <span className="font-semibold text-slate-700 dark:text-slate-200">{unitsToReturn.length} equipos</span> prestados a{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{unitsToReturn[0].assignee}</span>. La lista de verificación aplica a todos:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-24 overflow-y-auto">
                    {unitsToReturn.map(u => (
                      <span key={u.id} title={u.name} className="text-[10.5px] font-mono font-bold text-violet-700 bg-violet-50 dark:bg-violet-950/20 border border-violet-200/40 px-2 py-0.5 rounded-full">
                        {u.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {returnError && (
                <div className="text-[12px] text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 rounded-lg">
                  {returnError}
                </div>
              )}

              {/* Checklist list */}
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)] cursor-pointer hover:bg-slate-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetChecked}
                    onChange={e => setResetChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-violet-700 border-slate-300 rounded focus:ring-violet-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 font-semibold">Restablecimiento de Sistema</div>
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
                    <div className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 font-semibold">Cables y Accesorios</div>
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
                    <div className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 font-semibold">Inspección Física</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">El equipo no presenta daños físicos visibles, golpes o puertos dañados en la sesión.</div>
                  </div>
                </label>
              </div>

              {/* Actions */}
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
                  onClick={handleConfirmReturn}
                  disabled={isReturning}
                  className="btn-electric px-5 py-2 text-[12px] flex items-center gap-1 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
                  {isReturning ? 'Procesando...' : (unitsToReturn.length > 1 ? `Confirmar Retorno de ${unitsToReturn.length}` : 'Confirmar Retorno')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
