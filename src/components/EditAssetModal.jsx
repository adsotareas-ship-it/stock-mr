import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import CategoryCombobox from './CategoryCombobox';

export default function EditAssetModal({ isOpen, onClose, asset, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serial, setSerial] = useState('');
  const [value, setValue] = useState('');
  const [location, setLocation] = useState('Sede — NY');
  const [sub, setSub] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const valueInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && asset) {
      setName(asset.name || '');
      setCategory(asset.category || 'Laptop');
      setSerial(asset.serial || '');
      setValue(asset.value ? asset.value.replace(/[^0-9]/g, '') : '');
      setLocation(asset.location || 'Sede — NY');
      setSub(asset.sub || '');
      setImageUrl(asset.imageUrl || '');
      setError('');
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const assetData = {
        name,
        category,
        sub: sub || `${category} Corporativo`,
        serial: serial || undefined,
        value: value !== '' ? value : '0',
        location,
        imageUrl: imageUrl || undefined,
      };

      const updated = await api.updateAsset(asset.id, assetData);

      // Save system audit log
      await api.createLog({
        user: 'Admin del Sistema',
        email: 'admin@enterprise.com',
        action: 'Modificación',
        detail: `Equipo ${asset.id} (${name}) fue modificado en el catálogo.`,
        icon: 'edit',
        iconColor: '#0d9488',
        iconBg: 'rgba(13,148,136,0.08)',
      });

      if (onSave) onSave(updated);
      onClose();
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-[var(--border-light)]">
        {/* Top Accent Line */}
        <div className="h-[3px] bg-gradient-to-r from-violet-600 to-cyan-500" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex justify-between items-center">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '18px' }}>edit</span>
            Editar Activo {asset.id}
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nombre del Equipo / Modelo</label>
              <input
                type="text"
                className="input-premium w-full px-3 py-2 text-[13px]"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Categoría</label>
              <CategoryCombobox value={category} onChange={setCategory} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ubicación</label>
              <input
                type="text"
                className="input-premium w-full px-3 py-2 text-[13px]"
                placeholder="Ej. Laboratorio"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Descripción Breve / Especificaciones básicas</label>
              <input
                type="text"
                className="input-premium w-full px-3 py-2 text-[13px]"
                value={sub}
                onChange={e => setSub(e.target.value)}
              />
            </div>

             <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Número de Serie (S/N)</label>
              <input
                type="text"
                className="input-premium w-full px-3 py-2 text-[13px] font-mono"
                value={serial}
                onChange={e => setSerial(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    valueInputRef.current?.focus();
                  }
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Costo de Adquisición (COP)</label>
              <input
                ref={valueInputRef}
                type="number"
                className="input-premium w-full px-3 py-2 text-[13px]"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">URL de Imagen del Producto (Opcional)</label>
              <input
                type="url"
                className="input-premium w-full px-3 py-2 text-[13px]"
                placeholder="Ej. https://url-de-la-imagen.png"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 border-t border-[var(--border-light)] pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-electric px-5 py-2 text-[13px] flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>save</span>
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
