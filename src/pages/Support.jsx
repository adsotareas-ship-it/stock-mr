import React from 'react';

export default function Support() {
  const sections = [
    {
      title: '🌐 Acceso en Producción',
      icon: 'public',
      desc: 'El sistema está desplegado en la nube y accesible desde cualquier dispositivo.',
      bullets: [
        'URL de producción: https://stock-mr-rho.vercel.app — Accede desde cualquier navegador, celular o computadora sin necesidad de instalar nada.',
        'Todos los datos del inventario se almacenan de forma permanente en una base de datos PostgreSQL en la nube de Supabase.',
        'El servidor backend corre en Vercel Serverless Functions. No necesitas tener encendida ninguna computadora para que el sistema funcione.',
        'Si compartes el enlace con otros profesores o directivos, verán los mismos datos en tiempo real.'
      ]
    },
    {
      title: '🔐 Control de Acceso y Seguridad',
      icon: 'security',
      desc: 'El sistema cuenta con un control estricto de inicio de sesión para el administrador.',
      bullets: [
        'Las credenciales de acceso son admin@enterprise.com y admin123.',
        'Tiene un protector contra ataques de fuerza bruta: tras 5 intentos fallidos, el sistema bloqueará el inicio de sesión durante 5 minutos.',
        'Las contraseñas se almacenan encriptadas con Bcrypt. Nadie — ni el desarrollador — puede leer tu contraseña en texto plano.',
        'Puedes cambiar tus credenciales en cualquier momento haciendo clic en tu perfil en la barra lateral inferior o en el icono de Ajustes (⚙️) en el encabezado.'
      ]
    },
    {
      title: '📦 Registro e Inventario de Activos',
      icon: 'inventory_2',
      desc: 'Gestiona switches, routers, laptops y servidores de tu laboratorio.',
      bullets: [
        'Usa el botón "+ Nuevo Activo" de la barra lateral para agregar hardware al inventario.',
        'La ubicación predeterminada es "Laboratorio", pero puedes escribir de forma libre el estante, armario o aula.',
        'Los valores de los equipos se registran en Pesos Colombianos (COP) con separación de miles por puntos.',
        'Cada activo guardado queda almacenado inmediatamente en Supabase y es visible para cualquier sesión activa.'
      ]
    },
    {
      title: '🔄 Flujo de Préstamo de Aula',
      icon: 'assignment_return',
      desc: 'El módulo principal diseñado específicamente para tus clases.',
      bullets: [
        'Temporizador de Clase: Configura la duración de tu sesión (ej. 120 min). El cronómetro cambiará a color rojo de alerta cuando resten menos de 15 minutos.',
        'Salida Rápida: Registra el préstamo de cualquier equipo en stock seleccionando el dispositivo e ingresando el nombre del alumno, matrícula y número de mesa.',
        'Buscador de Clase: Filtra y encuentra alumnos, mesas o equipos prestados al instante usando la barra de búsqueda en el monitoreo de préstamos.'
      ]
    },
    {
      title: '✅ Devolución Segura (Checklist)',
      icon: 'fact_check',
      desc: 'Protege la integridad física y lógica de los equipos al recibirlos de vuelta.',
      bullets: [
        'Al presionar "Devolver" en cualquier pantalla, se activará el protocolo de retorno seguro.',
        'Debes validar obligatoriamente 3 puntos: Restablecimiento de fábrica (Factory reset de consola), Devolución de cables y accesorios, e Inspección física libre de golpes o daños.',
        'Hasta que no verifiques los 3 puntos, el sistema no reintegrará el equipo al stock disponible.'
      ]
    },
    {
      title: '🔧 Mantenimiento y Despliegues',
      icon: 'build',
      desc: 'Acciones rápidas directamente desde el detalle de cada equipo.',
      bullets: [
        'Marcar como Disponible (Reparado): Si el equipo estaba en Mantenimiento, este botón lo reintegra a stock y resuelve automáticamente todos los tickets pendientes.',
        'Desplegar en Aula: Úsalo para routers/switches instalados fijamente que no se van a prestar individualmente a los alumnos.',
        'Retirar de Producción: Devuelve un equipo desplegado fijamente al stock general de préstamos.',
        'Registrar Incidente: Envía de inmediato un equipo a Mantenimiento si detectas una falla física o lógica.'
      ]
    },
    {
      title: '📝 Bitácora de Eventos de Auditoría',
      icon: 'history',
      desc: 'Una memoria de auditoría automática de todas tus acciones.',
      bullets: [
        'El sistema registra de forma automática cada alta, baja, préstamo, devolución o reparación en la base de datos de Supabase.',
        'Si no recuerdas cuándo prestaste un switch o quién reportó una falla, ingresa a "Auditoría" y busca el ID del activo o el nombre del alumno para reconstruir el historial.',
        'Los registros persisten de forma permanente en la nube, independientemente de si reinicias tu computadora o no.'
      ]
    }
  ];

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in max-w-[1200px]">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-widest mb-1">Guía del Sistema</p>
        <h2 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 leading-tight">Ayuda y Manual de Usuario</h2>
        <p className="text-[13px] text-slate-500 mt-1">Conoce las funciones principales y los flujos de trabajo recomendados para el control de tu laboratorio de redes</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, i) => (
          <div
            key={i}
            className="card flex flex-col gap-3.5 hover:border-[var(--color-electric)] transition-all duration-300 relative group"
            style={{ padding: '24px' }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124, 58, 237,0.06)', border: '1px solid rgba(124, 58, 237,0.15)' }}
              >
                <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '20px' }}>{sec.icon}</span>
              </div>
              <div>
                <h3 className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{sec.title}</h3>
                <p className="text-[11.5px] text-slate-400 mt-0.5">{sec.desc}</p>
              </div>
            </div>
            <div className="h-px bg-slate-50 dark:bg-slate-800/40 my-1" />
            <ul className="flex flex-col gap-2">
              {sec.bullets.map((b, idx) => (
                <li key={idx} className="flex gap-2 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="text-violet-600 flex-shrink-0 mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm"
        style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237,0.02) 0%, rgba(20,184,166,0.02) 100%)' }}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-violet-700" style={{ fontSize: '32px' }}>cloud_done</span>
          <div className="text-center sm:text-left">
            <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Sistema desplegado en la nube</h4>
            <p className="text-[11px] text-slate-400">Los datos persisten en Supabase PostgreSQL. Acceso desde cualquier dispositivo con internet.</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-center sm:items-end">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Sma Latb Stock v1.1.0</span>
          <span className="text-[11px] text-violet-700 font-semibold mt-0.5 flex items-center gap-1">
            <span className="dot-pulse" style={{ width: '6px', height: '6px', color: '#7c3aed', background: '#7c3aed' }} />
            En Producción — Vercel + Supabase
          </span>
        </div>
      </div>
    </div>
  );
}
