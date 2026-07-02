import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function UserSettingsModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      const fetchUser = async () => {
        try {
          const user = await api.getUser();
          setName(user.name);
          setEmail(user.email);
        } catch (err) {
          setError('Error al cargar datos del usuario.');
        }
      };
      fetchUser();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const updates = { name, email };
      if (password) {
        updates.password = password;
      }
      await api.updateUser(updates);
      setSuccess('Perfil actualizado correctamente.');
      setPassword('');
      setConfirmPassword('');
      // Notify other components
      window.dispatchEvent(new CustomEvent('profile-updated'));
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al guardar cambios.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] p-6 shadow-2xl transition-all duration-300 animate-fade-in"
      >
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-700 font-semibold">manage_accounts</span>
            <h3 className="text-[16px] font-bold text-slate-800">Ajustes de Perfil</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-[12px] text-red-600 dark:text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/30 rounded-xl text-[12px] text-violet-700 dark:text-violet-500 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Nombre Completo</label>
            <input
              type="text"
              className="input-premium px-3 py-2.5 text-[12.5px]"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Correo Electrónico</label>
            <input
              type="email"
              className="input-premium px-3 py-2.5 text-[12.5px]"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border-light)]">
            <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Cambiar Contraseña (Opcional)</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Dejar en blanco para no cambiar"
                className="input-premium w-full pl-3 pr-10 py-2.5 text-[12.5px]"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar nueva contraseña"
                className="input-premium w-full pl-3 pr-10 py-2.5 text-[12.5px]"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-light)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-electric px-5 py-2 text-[12px] font-semibold flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
