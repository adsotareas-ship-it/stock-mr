import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('auth_token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-base)]"
    >
      {/* Soft background orbs */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: '700px', height: '700px',
          left: '-200px', top: '-200px',
          background: 'radial-gradient(circle, rgba(124, 58, 237,0.07) 0%, transparent 65%)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: '500px', height: '500px',
          right: '-100px', bottom: '-100px',
          background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 65%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(124, 58, 237,0.04) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(124, 58, 237,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-700" />
      <div className="absolute top-3 left-0 right-0 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)', boxShadow: '0 3px 10px rgba(124, 58, 237,0.25)' }}
          >
            <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: '14px' }}>inventory_2</span>
          </div>
          <span className="font-bold text-[14px] text-slate-800">Sma Latb<span className="text-gradient-electric"> Stock</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="dot-pulse" style={{ color: '#7c3aed', background: '#7c3aed' }} />
          <span className="text-[11px] text-violet-800 font-medium">Conexión Segura</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full mx-4 animate-fade-in" style={{ maxWidth: '420px' }}>
        {/* Card border glow */}
        <div
          className="absolute -inset-0.5 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237,0.2) 0%, rgba(20,184,166,0.12) 100%)',
            filter: 'blur(1px)',
          }}
        />

        <div
          className="relative rounded-2xl px-8 py-9 flex flex-col gap-7 bg-[var(--bg-card)] border border-[var(--border-light)] transition-colors duration-300"
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(124, 58, 237, 0.05)',
          }}
        >
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-[12.5px] text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              <span>{error}</span>
            </div>
          )}
          {/* Header */}
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237,0.12) 0%, rgba(20,184,166,0.08) 100%)',
                border: '1px solid rgba(124, 58, 237,0.2)',
                boxShadow: '0 4px 20px rgba(124, 58, 237,0.12)',
              }}
            >
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: '28px', color: '#7c3aed' }}>lock</span>
            </div>
            <h1 className="text-[22px] font-bold text-slate-800 leading-tight tracking-tight mb-1.5">
              Acceso Corporativo
            </h1>
            <p className="text-[13px] text-slate-500">
              Inicia sesión en tu cuenta de Sma Latb Stock
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-slate-600 tracking-wide">
                Correo Corporativo
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ fontSize: '16px', color: email ? '#7c3aed' : '#94a3b8' }}
                >
                  alternate_email
                </span>
                <input
                  type="email"
                  className="input-premium w-full pl-10 pr-4 py-3 text-[13px]"
                  placeholder="admin@enterprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label className="text-[12px] font-semibold text-slate-600 tracking-wide">Contraseña</label>
                <button type="button" className="text-[12px] text-violet-700 hover:text-violet-800 transition-colors font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ fontSize: '16px', color: password ? '#7c3aed' : '#94a3b8' }}
                >
                  key
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-premium w-full pl-10 pr-11 py-3 text-[13px]"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {showPwd ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-electric mt-1 py-3 flex items-center justify-center gap-2.5 text-[14px] font-semibold disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Autenticando…</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>


          <p className="text-center text-[11px] text-slate-400">
            Protegido por cifrado de nivel empresarial.{' '}
            <span className="text-violet-700 hover:text-violet-800 cursor-pointer transition-colors">Política de Privacidad</span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-5 left-0 right-0 text-center text-[11px] text-slate-400">
        © 2024 Sma Latb Stock. Gestión de Activos IT · v3.2.1
      </div>
    </div>
  );
}
