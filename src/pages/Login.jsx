import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as apiLogin } from '../lib/api'
import { useSession } from '../context/SessionContext'

const ERROR_MESSAGES = {
  BAD_CREDENTIALS: 'Nombre, apellido o PIN incorrecto.',
  SECOND_LASTNAME_REQUIRED: 'Hay más de una persona con ese nombre. Ingresá el segundo apellido.',
  NAME_TAKEN: 'Esa combinación ya está registrada.',
  SESSION_INVALID: 'Sesión inválida.',
}

export default function Login() {
  const { login } = useSession()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', segundo_apellido: '', pin: '' })
  const [needSecond, setNeedSecond] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const params = { p_nombre: form.nombre.trim(), p_apellido: form.apellido.trim(), p_pin: form.pin }
      if (needSecond) params.p_segundo_apellido = form.segundo_apellido.trim()
      const data = await apiLogin(params)
      login({ name: data.name, is_admin: data.is_admin, id: data.participant_id }, data.token)
      navigate('/partidos')
    } catch (err) {
      const code = err.message
      if (code === 'SECOND_LASTNAME_REQUIRED') setNeedSecond(true)
      setError(ERROR_MESSAGES[code] || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>⚽</div>
          <h1 className="text-gold mt-2" style={{ fontSize: '2.6rem' }}>MUNDIAL 2026</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Quiniela · Fase Final</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={form.nombre} onChange={set('nombre')} placeholder="Juan" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Primer apellido</label>
            <input className="form-control" value={form.apellido} onChange={set('apellido')} placeholder="García" required />
          </div>
          {needSecond && (
            <div className="mb-3">
              <label className="form-label">Segundo apellido</label>
              <input className="form-control" value={form.segundo_apellido} onChange={set('segundo_apellido')} placeholder="López" />
            </div>
          )}
          <div className="mb-4">
            <label className="form-label">PIN (4–6 dígitos)</label>
            <input className="form-control" type="password" inputMode="numeric" maxLength={6}
              value={form.pin} onChange={set('pin')} placeholder="••••" required />
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Ingresando...</> : <><i className="bi bi-box-arrow-in-right me-2"></i>Ingresar</>}
          </button>
        </form>

        <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="text-gold fw-semibold" style={{ textDecoration: 'none' }}>Registrarse</Link>
        </p>
      </div>
    </div>
  )
}
