import React, { useState, useRef } from 'react';
import { api } from '../utils/api';
import CategoryCombobox from './CategoryCombobox';

export default function NewAssetModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serial, setSerial] = useState('');
  const [value, setValue] = useState('');
  const [location, setLocation] = useState('Laboratorio');
  const [sub, setSub] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [warrantyYears, setWarrantyYears] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const valueInputRef = useRef(null);

  if (!isOpen) return null;

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
        purchaseDate,
        warrantyYears,
      };

      const saved = await api.createAsset(assetData);
      if (onSave) onSave(saved);
      onClose();
      
      // Reset form
      setName('');
      setCategory('Laptop');
      setSerial('');
      setValue('');
      setLocation('Laboratorio');
      setSub('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setWarrantyYears('1');
    } catch (err) {
      setError(err.message || 'Error al guardar el activo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-slate-100">
        {/* Top Accent Line */}
        <div className="h-[3px] bg-gradient-to-r from-green-500 to-teal-500" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600" style={{ fontSize: '18px' }}>inventory_2</span>
            Registrar Nuevo Activo
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nombre del Equipo / Modelo</label>
              <input
                type="text"
                className="input-premium w-full px-3 py-2 text-[13px]"
                placeholder="Ej. MacBook Pro 16 o Dell Monitor 27"
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
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ubicación Inicial</label>
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
                placeholder="Ej. Intel Core i5 · 16GB RAM · 512GB SSD"
                value={sub}
                onChange={e => setSub(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Número de Serie (S/N)</label>
              <input
                type="text"
                className="input-premium w-full px-3 py-2 text-[13px] font-mono"
                placeholder="Ej. C02FG492Q05D  (escanea o escribe)"
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
                placeholder="0 (dejar vacío = $0)"
                min="0"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fecha de Compra</label>
              <input
                type="date"
                className="input-premium w-full px-3 py-2 text-[13px]"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Período de Garantía</label>
              <div className="relative">
                <select
                  className="input-premium w-full px-3 py-2 text-[13px] appearance-none cursor-pointer"
                  value={warrantyYears}
                  onChange={e => setWarrantyYears(e.target.value)}
                >
                  <option value="0">Sin garantía</option>
                  <option value="0.5">6 meses</option>
                  <option value="1">1 año</option>
                  <option value="2">2 años</option>
                  <option value="3">3 años</option>
                  <option value="5">5 años</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
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
                  <span>Guardar Activo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
