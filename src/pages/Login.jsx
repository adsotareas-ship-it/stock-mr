import React, { useState } from 'react';
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

  const chip = (style, icon, color, title, sub, anim) => (
    <div
      className="absolute flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
      style={{
        ...style,
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 12px 32px rgba(79,70,229,0.16)',
        animation: anim,
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color, boxShadow: `0 6px 14px ${color}55` }}
      >
        <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: '19px' }}>{icon}</span>
      </span>
      <span className="leading-tight">
        <span className="block text-[12.5px] font-bold text-slate-800">{title}</span>
        <span className="block text-[10.5px] text-slate-500">{sub}</span>
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-card)]">
      <style>{`
        @keyframes lgFloatA { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes lgFloatB { 0%,100% { transform: translateY(0) } 50% { transform: translateY(12px) } }
        @keyframes lgDrift  { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(24px,-18px) scale(1.08) } }
        @keyframes lgRise   { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        .lg-rise { animation: lgRise .7s cubic-bezier(.2,.8,.2,1) both }
        .lg-field:focus { background: #fff !important; box-shadow: 0 0 0 4px rgba(99,102,241,0.14) !important; border-color: #6366f1 !important; }
      `}</style>

      {/* ───────── Left: illustration panel ───────── */}
      <aside
        className="hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col justify-between"
        style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #dbe7ff 42%, #e6dcfb 100%)' }}
      >
        {/* decorative orbs + dots */}
        <div className="absolute rounded-full pointer-events-none" style={{ width: 520, height: 520, left: -160, top: -140, background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 68%)', animation: 'lgDrift 14s ease-in-out infinite' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 460, height: 460, right: -120, bottom: -100, background: 'radial-gradient(circle, rgba(6,182,212,0.26), transparent 68%)', animation: 'lgDrift 17s ease-in-out infinite reverse' }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(79,70,229,0.18) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 78%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 78%)' }}
        />

        {/* brand */}
        <div className="relative z-10 flex items-center gap-3 px-12 pt-9">
          <img src="/logo.png" alt="Sma Technology" className="h-10 w-auto" />
          <span className="font-extrabold text-[18px] tracking-tight text-slate-800">
            Sma Lab<span className="text-gradient-electric"> Stock</span>
          </span>
        </div>

        {/* illustration + floating chips */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-10 pt-6">
          <div className="relative" style={{ width: 'min(100%, 500px)' }}>
            <div
              className="absolute inset-6 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)' }}
            />
            <img
              src="/login-illustration.png"
              alt="Seguridad y control de activos de TI"
              className="relative w-full h-auto select-none"
              style={{ animation: 'lgFloatA 7s ease-in-out infinite', filter: 'drop-shadow(0 28px 36px rgba(79,70,229,0.22))' }}
              draggable={false}
            />
            {chip({ left: '-6%', top: '14%' }, 'verified_user', '#6366f1', 'Cifrado bcrypt', 'Contraseñas protegidas', 'lgFloatB 6s ease-in-out infinite')}
            {chip({ right: '-8%', top: '34%' }, 'key', '#06b6d4', 'Sesión con JWT', 'Acceso firmado y seguro', 'lgFloatA 8s ease-in-out infinite')}
            {chip({ left: '4%', bottom: '4%' }, 'monitoring', '#8b5cf6', 'Auditoría en vivo', 'Cada cambio queda registrado', 'lgFloatB 9s ease-in-out infinite')}
          </div>
        </div>

        {/* headline */}
        <div className="relative z-10 px-12 pb-12 max-w-[640px]">
          <h2 className="text-[34px] leading-[1.1] font-extrabold tracking-tight text-slate-900">
            Todo tu inventario de TI,{' '}
            <span className="text-gradient-electric">bajo control.</span>
          </h2>
          <p className="mt-3 text-[14.5px] text-slate-600 leading-relaxed">
            Registra, presta y audita tus equipos desde un solo lugar, con trazabilidad completa y reportes en un clic.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {[['inventory_2', 'Inventario'], ['swap_horiz', 'Préstamos'], ['build', 'Mantenimiento'], ['fact_check', 'Auditoría']].map(([ic, label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-indigo-700"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(99,102,241,0.18)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{ic}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ───────── Right: form ───────── */}
      <main className="flex-1 relative flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-500" />
        <div className="absolute rounded-full pointer-events-none lg:hidden" style={{ width: 380, height: 380, right: -160, top: -140, background: 'radial-gradient(circle, rgba(99,102,241,0.16), transparent 68%)' }} />

        <div className="w-full lg-rise" style={{ maxWidth: '420px' }}>
          {/* mobile brand */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <img src="/logo.png" alt="Sma Technology" className="h-9 w-auto" />
            <span className="font-extrabold text-[17px] text-slate-800">Sma Lab<span className="text-gradient-electric"> Stock</span></span>
          </div>

          <h1 className="text-[34px] sm:text-[38px] font-extrabold tracking-tight leading-[1.05] text-slate-900">
            Tu inventario <span className="text-gradient-electric">te espera</span>
          </h1>
          <p className="mt-2.5 text-[14.5px] text-slate-500 leading-relaxed">
            Ingresa tus credenciales para registrar equipos, controlar préstamos y llevar al día cada auditoría.
          </p>

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-slate-700">
                Correo electrónico <span className="text-indigo-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="lg-field input-premium w-full pl-4 pr-11 py-3.5 text-[14px] rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.07)', borderColor: 'rgba(99,102,241,0.18)' }}
                  placeholder="admin@enterprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  maxLength={254}
                  required
                />
                <span
                  className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ fontSize: '19px', color: email ? '#6366f1' : '#94a3b8' }}
                >
                  person
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-slate-700">
                Contraseña <span className="text-indigo-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="lg-field input-premium w-full pl-4 pr-12 py-3.5 text-[14px] rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.07)', borderColor: 'rgba(99,102,241,0.18)' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                    {showPwd ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-[13px] text-indigo-600 hover:text-indigo-800 transition-colors font-semibold">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <p className="text-[12px] text-slate-400 leading-relaxed -mt-1">
              Al continuar aceptas la{' '}
              <span
                onClick={() => setShowPrivacyModal(true)}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-semibold"
              >
                Política de Privacidad y Seguridad
              </span>{' '}
              de este sistema.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="py-4 rounded-xl flex items-center justify-center gap-2.5 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #06b6d4 100%)',
                boxShadow: '0 14px 30px rgba(79,70,229,0.38)',
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Autenticando…</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[11.5px] text-slate-400">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
            Protegido por cifrado de nivel empresarial
          </div>
        </div>

        <div className="absolute bottom-5 left-0 right-0 text-center text-[11px] text-slate-400 px-4">
          © 2026 Sma Lab Stock. Desarrollado por Samuel Rodríguez · v3.2.1
        </div>
      </main>

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
                  <p className="text-[10.5px] text-slate-400">Protección de Datos Sma Lab Stock</p>
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

    </div>
  );
}
