import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as apiRegister } from '../lib/api'
import { useSession } from '../context/SessionContext'

const ERROR_MESSAGES = {
  INVALID_NAME: 'Nombre y apellido son obligatorios.',
  INVALID_PIN: 'El PIN debe tener entre 4 y 6 dígitos numéricos.',
  NAME_TAKEN: 'Esa combinación de nombre y apellidos ya existe.',
  SECOND_LASTNAME_REQUIRED: 'Ya existe alguien con ese nombre. Ingresá el segundo apellido.',
}

export default function Register() {
  const { login } = useSession()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', segundo_apellido: '', pin: '', pin2: '' })
  const [needSecond, setNeedSecond] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.pin !== form.pin2) { setError('Los PINs no coinciden.'); return }
    if (!/^\d{4,6}$/.test(form.pin)) { setError(ERROR_MESSAGES.INVALID_PIN); return }
    setLoading(true)
    try {
      const params = { p_nombre: form.nombre.trim(), p_apellido: form.apellido.trim(), p_pin: form.pin }
      if (form.segundo_apellido.trim()) params.p_segundo_apellido = form.segundo_apellido.trim()
      const data = await apiRegister(params)
      login({ name: data.name, is_admin: data.is_admin, id: data.participant_id }, data.token)
      navigate('/partidos')
    } catch (err) {
      const code = err.message
      if (code === 'SECOND_LASTNAME_REQUIRED') setNeedSecond(true)
      setError(ERROR_MESSAGES[code] || 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🏆</div>
          <h1 className="text-gold mt-2" style={{ fontSize: '2.2rem' }}>CREAR CUENTA</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Quiniela Mundial 2026</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label">Nombre</label>
              <input className="form-control" value={form.nombre} onChange={set('nombre')} placeholder="Juan" required />
            </div>
            <div className="col-6">
              <label className="form-label">Primer apellido</label>
              <input className="form-control" value={form.apellido} onChange={set('apellido')} placeholder="García" required />
            </div>
          </div>
          {needSecond && (
            <div className="mb-3">
              <label className="form-label">Segundo apellido</label>
              <input className="form-control" value={form.segundo_apellido} onChange={set('segundo_apellido')} placeholder="López" />
            </div>
          )}
          <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label">PIN (4–6 dígitos)</label>
              <input className="form-control" type="password" inputMode="numeric" maxLength={6}
                value={form.pin} onChange={set('pin')} placeholder="••••" required />
            </div>
            <div className="col-6">
              <label className="form-label">Confirmar PIN</label>
              <input className="form-control" type="password" inputMode="numeric" maxLength={6}
                value={form.pin2} onChange={set('pin2')} placeholder="••••" required />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Registrando...</> : <><i className="bi bi-person-plus me-2"></i>Crear cuenta</>}
          </button>
        </form>

        <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-gold fw-semibold" style={{ textDecoration: 'none' }}>Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
