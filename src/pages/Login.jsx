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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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
            <span 
              onClick={() => setShowPrivacyModal(true)} 
              className="text-violet-700 hover:text-violet-800 cursor-pointer font-medium underline underline-offset-2 transition-colors"
            >
              Política de Privacidad
            </span>
          </p>
        </div>
      </div>

      {/* Privacy and Security Modal */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
        >
          {/* Modal Content Card */}
          <div 
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-scale-up"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)' }}
                >
                  <span className="material-symbols-outlined font-bold text-violet-700" style={{ fontSize: '18px' }}>shield</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Política de Privacidad y Seguridad</h3>
                  <p className="text-[10.5px] text-slate-400">Protección de Datos Sma Latb Stock</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Info Body */}
            <div className="flex flex-col gap-4 text-[12.5px] text-slate-500 leading-relaxed">
              <p>
                Este sistema ha sido diseñado con estrictos estándares de seguridad tecnológica para la administración del inventario de TI de su organización.
              </p>

              {/* Point 1: Encryption */}
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-violet-600 mt-0.5 flex-shrink-0" style={{ fontSize: '18px' }}>vpn_key</span>
                <div>
                  <h4 className="font-bold text-slate-700 text-[13px] mb-0.5">Cifrado de Credenciales y Sesiones</h4>
                  <p>
                    Las contraseñas de los usuarios administradores se almacenan de forma irreversible utilizando el algoritmo hash <strong>bcryptjs</strong>. Las sesiones activas de administración se validan mediante tokens <strong>JSON Web Tokens (JWT)</strong> firmados digitalmente.
                  </p>
                </div>
              </div>

              {/* Point 2: Data Protection */}
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-teal-600 mt-0.5 flex-shrink-0" style={{ fontSize: '18px' }}>lock</span>
                <div>
                  <h4 className="font-bold text-slate-700 text-[13px] mb-0.5">Cumplimiento de Protección de Datos (Habeas Data)</h4>
                  <p>
                    En concordancia con la <strong>Ley 1581</strong> de protección de datos personales, la información de los usuarios (nombres, correos electrónicos corporativos, auditorías asignadas) se recolecta exclusivamente para fines administrativos de la empresa. No se comparte con terceros ni se transfiere fuera del servidor de la organización.
                  </p>
                </div>
              </div>

              {/* Point 3: Log Audits */}
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-600 mt-0.5 flex-shrink-0" style={{ fontSize: '18px' }}>history</span>
                <div>
                  <h4 className="font-bold text-slate-700 text-[13px] mb-0.5">Trazabilidad y Bitácora</h4>
                  <p>
                    Para garantizar la transparencia y seguridad de los activos de la compañía, cada modificación, baja, asignación o mantenimiento queda registrada en una bitácora de auditoría histórica inalterable que asocia la acción al correo del administrador responsable.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / Accept button */}
            <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="text-[10px] text-slate-400">Versión de seguridad: v3.2.1-prod</span>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="btn-electric py-1.5 px-4 text-[12px] font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-0 right-0 text-center text-[11px] text-slate-400">
        © 2024 Sma Latb Stock. Gestión de Activos IT · v3.2.1
      </div>
    </div>
  );
}
