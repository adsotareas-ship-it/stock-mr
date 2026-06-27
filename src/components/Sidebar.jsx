import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const navItems = [
  { name: 'Panel Principal', icon: 'dashboard',      path: '/',            exact: true },
  { name: 'Activos',          icon: 'inventory_2',     path: '/assets' },
  { name: 'Préstamos de Clase', icon: 'assignment_return', path: '/loans' },
  { name: 'Mantenimiento',   icon: 'build',           path: '/maintenance' },
  { name: 'Auditoría',       icon: 'fact_check',      path: '/audit' },
];

export default function Sidebar({ onNewAssetClick }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: 'Administrador', email: 'admin@enterprise.com' });
  const [assetsCount, setAssetsCount] = useState(0);

  const loadProfile = async () => {
    try {
      const data = await api.getUser();
      setProfile(data);
    } catch (err) {
      console.error("Error loading user profile in sidebar:", err);
    }
  };

  const loadAssetsCount = async () => {
    try {
      const data = await api.getAssets();
      setAssetsCount(data.length);
    } catch (err) {
      console.error("Error loading assets count in sidebar:", err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAssetsCount();
    window.addEventListener('profile-updated', loadProfile);
    window.addEventListener('inventory-updated', loadAssetsCount);
    return () => {
      window.removeEventListener('profile-updated', loadProfile);
      window.removeEventListener('inventory-updated', loadAssetsCount);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside
      style={{ width: '260px' }}
      className="fixed left-0 top-0 h-screen z-30 flex flex-col"
    >
      {/* Theme-aware background with subtle border */}
      <div className="absolute inset-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-light)] transition-colors duration-300" style={{ boxShadow: '1px 0 0 rgba(0, 0, 0, 0.04)' }} />

      {/* Top green accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-500 via-teal-500 to-green-600 rounded-none" />

      <div className="relative flex flex-col h-full z-10">
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-5">
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #14b8a6 100%)',
                boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              }}
            >
              <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: '18px' }}>
                inventory_2
              </span>
            </div>
            <div>
              <span className="font-bold text-[15px] tracking-tight leading-none block text-slate-800">
                Miguel<span className="text-gradient-electric"> Stock</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase leading-none">
                Gestión de Activos
              </span>
            </div>
          </Link>

          <div className="mt-5 h-px bg-slate-100" />
        </div>

        {/* Add Asset Button */}
        <div className="px-4 mb-4">
          <button 
            onClick={onNewAssetClick}
            className="btn-electric w-full flex items-center justify-center gap-2 text-[13px]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Nuevo Activo
          </button>
        </div>

        {/* Nav Label */}
        <div className="px-6 mb-2">
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Navegación</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                isActive
                  ? 'nav-item-active flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200'
                  : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 text-[13px] font-medium hover:text-slate-700 hover:bg-slate-50 transition-all duration-200'
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined transition-all duration-200"
                    style={{
                      fontSize: '18px',
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      color: isActive ? '#16a34a' : undefined,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: '#16a34a', boxShadow: '0 0 6px rgba(22,163,74,0.6)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-6 my-3 h-px bg-slate-100" />

        {/* Bottom section */}
        <div className="px-3 pb-5 space-y-0.5">
          {/* System status */}
          <div
            className="px-3 py-2.5 mb-3 rounded-lg"
            style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <span className="dot-pulse" style={{ color: '#16a34a', background: '#16a34a' }} />
              <span className="text-[11px] text-green-700 font-semibold">Sistemas Funcionando</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 ml-[17px]">
              {assetsCount.toLocaleString()} {assetsCount === 1 ? 'activo rastreado' : 'activos rastreados'}
            </div>
          </div>

          <Link
            to="/support"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 text-[13px] font-medium hover:text-slate-700 hover:bg-slate-50 transition-all duration-200"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help_outline</span>
            <span>Ayuda y Soporte</span>
          </Link>

          {/* User Profile */}
          <div 
            onClick={() => window.dispatchEvent(new CustomEvent('open-user-settings-modal'))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14b8a6 100%)' }}
            >
              <span className="text-white font-bold text-[10px]">{getInitials(profile.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{profile.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{profile.email}</div>
            </div>
            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '16px' }}>more_vert</span>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 text-[12px] hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
