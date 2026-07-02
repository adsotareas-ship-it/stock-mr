import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';

const routeNames = {
  '/':            'Panel Principal',
  '/assets':      'Inventario de Activos',
  '/loans':       'Préstamos de Clase',
  '/maintenance': 'Mantenimiento',
  '/audit':       'Registro de Auditoría',
  '/support':     'Ayuda y Soporte',
};

export default function Header({ onMenuToggle }) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [profile, setProfile] = useState({ name: 'Administrador', email: 'admin@enterprise.com' });

  const loadProfile = async () => {
    try {
      const data = await api.getUser();
      setProfile(data);
    } catch (err) {
      console.error("Error loading user profile in header:", err);
    }
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener('profile-updated', loadProfile);
    return () => window.removeEventListener('profile-updated', loadProfile);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const location = useLocation();
  const pageName = routeNames[location.pathname] || 'Resumen';
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const date = new Date().toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });



  return (
    <header
      className="fixed right-0 top-0 z-20 flex items-center justify-between px-6 bg-[var(--bg-header)] border-b border-[var(--border-light)] transition-colors duration-300"
      style={{
        left: '260px',
        height: '64px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden md:block">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>home</span>
            <span>Miguel Stock</span>
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>chevron_right</span>
            <span className="text-slate-500">{pageName}</span>
          </div>
          <h1 className="text-[15px] font-bold text-slate-800 leading-none tracking-tight">{pageName}</h1>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm mx-6 hidden md:block">
        <div className="relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
            style={{ fontSize: '16px', color: isSearchFocused ? '#7c3aed' : '#94a3b8' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Buscar activos, incidentes, usuarios…"
            className="input-premium w-full pl-10 pr-4 py-2 text-[13px] bg-[var(--bg-base)]"
            style={{ height: '36px' }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-white border border-slate-200 font-mono">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Date & Time */}
        <div className="hidden lg:flex flex-col items-end mr-2">
          <span className="text-[11px] font-semibold text-slate-700 font-mono">{time}</span>
          <span className="text-[10px] text-slate-400">{date}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
          title={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>



        {/* Settings */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-user-settings-modal'))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
        </button>

        {/* User Avatar */}
        <div
          onClick={() => window.dispatchEvent(new CustomEvent('open-user-settings-modal'))}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ml-1 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
            boxShadow: '0 2px 8px rgba(124, 58, 237,0.3)',
          }}
        >
          <span className="text-white font-bold text-[11px]">{getInitials(profile.name)}</span>
        </div>
      </div>
    </header>
  );
}
