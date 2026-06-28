import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PROFILE_KEY = 'ope_quiz_profile'

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') }
  catch { return {} }
}

// ── Login form (magic link) ──────────────────────────────────────
function LoginPanel() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="login-sent">
        <p className="login-sent-title">Revisa tu email</p>
        <p>Hemos enviado un enlace a <strong>{email}</strong>.<br />Haz clic en él para acceder.</p>
        <button className="btn-link" onClick={() => setSent(false)}>Usar otro email</button>
      </div>
    )
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <p className="login-desc">
        Inicia sesión para sincronizar tu progreso entre dispositivos.
        No necesitas contraseña — te enviamos un enlace al email.
      </p>
      <label className="field-label">
        Email
        <input
          type="email"
          className="field-input"
          value={email}
          placeholder="tu@email.com"
          onChange={e => setEmail(e.target.value)}
          required
        />
      </label>
      {error && <p className="login-error">{error}</p>}
      <button
        type="submit"
        className="btn-primary btn-lg"
        disabled={loading || !email.trim()}
      >
        {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
      </button>
    </form>
  )
}

// ── Main Profile component ────────────────────────────────────────
export default function Profile({ user }) {
  const [profile, setProfile] = useState(loadProfile)
  const [saved, setSaved]     = useState(false)

  async function update(key, value) {
    const next = { ...profile, [key]: value }
    setProfile(next)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)

    if (supabase && user) {
      await supabase.from('profiles').upsert({
        id:           user.id,
        nombre:       next.nombre       ?? null,
        fecha_examen: next.fechaExamen  ?? null,
        meta_diaria:  next.metaDiaria   ?? null,
        updated_at:   new Date().toISOString(),
      })
    }
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
  }

  const examDate = profile.fechaExamen ? new Date(profile.fechaExamen) : null
  const daysLeft = examDate
    ? Math.ceil((examDate.getTime() - Date.now()) / 86400000)
    : null

  const countdownText = daysLeft === null ? null
    : daysLeft < 0  ? 'La fecha del examen ya ha pasado'
    : daysLeft === 0 ? '¡El examen es hoy!'
    : `Faltan ${daysLeft} día${daysLeft === 1 ? '' : 's'} para el examen`

  const countdownClass = daysLeft === null ? ''
    : daysLeft < 0    ? 'countdown-past'
    : daysLeft <= 30  ? 'countdown-urgent'
    : 'countdown-ok'

  return (
    <div className="page">
      <h2 className="page-title">Perfil</h2>

      {/* Auth section */}
      {supabase ? (
        user ? (
          <div className="auth-card auth-card-logged">
            <div className="auth-info">
              <span className="auth-badge">Sesión activa</span>
              <span className="auth-email">{user.email}</span>
              <span className="auth-sub">Tu progreso se sincroniza automáticamente</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        ) : (
          <div className="auth-card">
            <h3 className="auth-card-title">Sincronización entre dispositivos</h3>
            <LoginPanel />
          </div>
        )
      ) : (
        <div className="auth-card auth-card-disabled">
          <p>La sincronización no está configurada. Añade las variables de entorno de Supabase para activarla.</p>
        </div>
      )}

      {/* Personal data */}
      <div className="profile-card">
        <label className="field-label">
          Nombre
          <input
            type="text"
            className="field-input"
            value={profile.nombre || ''}
            placeholder="Tu nombre"
            onChange={e => update('nombre', e.target.value)}
          />
        </label>

        <label className="field-label">
          Fecha del examen
          <input
            type="date"
            className="field-input"
            value={profile.fechaExamen || ''}
            onChange={e => update('fechaExamen', e.target.value)}
          />
        </label>

        {countdownText && (
          <div className={`countdown ${countdownClass}`}>{countdownText}</div>
        )}

        <label className="field-label">
          Meta diaria (preguntas)
          <input
            type="number"
            className="field-input field-input-sm"
            min={1} max={200}
            value={profile.metaDiaria || ''}
            placeholder="Ej: 20"
            onChange={e => update('metaDiaria', Math.max(1, parseInt(e.target.value) || 1))}
          />
        </label>

        {saved && <p className="saved-toast">Guardado{user ? ' y sincronizado' : ''}</p>}
      </div>
    </div>
  )
}
