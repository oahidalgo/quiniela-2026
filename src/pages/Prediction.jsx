import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatch, savePrediction } from '../lib/api'
import { useSession } from '../context/SessionContext'

export default function Prediction() {
  const { matchId } = useParams()
  const { token } = useSession()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getMatch(matchId)
      .then((m) => {
        setMatch(m)
        if (m.my_home != null) setHome(String(m.my_home))
        if (m.my_away != null) setAway(String(m.my_away))
      })
      .catch(() => setError('Partido no encontrado.'))
      .finally(() => setLoading(false))
  }, [matchId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || h > 99 || a < 0 || a > 99) {
      setError('Los goles deben ser un número entre 0 y 99.')
      return
    }
    setSaving(true)
    try {
      await savePrediction(token, matchId, h, a)
      setSuccess(true)
      setTimeout(() => navigate('/partidos'), 1200)
    } catch (err) {
      const msgs = { CLOSED: 'El partido ya cerró.', SESSION_INVALID: 'Sesión inválida.' }
      setError(msgs[err.message] || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={styles.center}>Cargando...</p>
  if (!match) return <p style={{ ...styles.center, color: 'var(--fallo)' }}>{error}</p>

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.back}>← Volver</button>
      <h2 style={styles.title}>PRONÓSTICO</h2>
      <div style={styles.matchInfo}>
        <span>{match.home_team}</span>
        <span style={{ color: 'var(--text-muted)' }}>vs</span>
        <span>{match.away_team}</span>
      </div>
      <p style={styles.time}>{formatDate(match.kickoff)}</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.scoreRow}>
          <div style={styles.scoreField}>
            <label style={styles.label}>{match.home_team}</label>
            <input
              style={styles.scoreInput}
              type="number" min="0" max="99"
              value={home} onChange={(e) => setHome(e.target.value)}
              placeholder="0" required
            />
          </div>
          <span style={styles.dash}>–</span>
          <div style={styles.scoreField}>
            <label style={styles.label}>{match.away_team}</label>
            <input
              style={styles.scoreInput}
              type="number" min="0" max="99"
              value={away} onChange={(e) => setAway(e.target.value)}
              placeholder="0" required
            />
          </div>
        </div>
        <p style={styles.hint}>Resultado de los 90 minutos (sin prórroga ni penales)</p>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.successMsg}>✓ Guardado</p>}
        <button type="submit" style={styles.btn} disabled={saving || success}>
          {saving ? 'Guardando...' : success ? '✓ Guardado' : 'Guardar pronóstico'}
        </button>
      </form>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const styles = {
  page: { maxWidth: 480, margin: '0 auto' },
  back: { background: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, padding: 0 },
  title: { fontSize: '2rem', color: 'var(--gold)', marginBottom: 8 },
  matchInfo: { display: 'flex', gap: 12, alignItems: 'center', fontSize: '1.2rem', fontWeight: 600, marginBottom: 4 },
  time: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  scoreRow: { display: 'flex', alignItems: 'flex-end', gap: 16, justifyContent: 'center' },
  scoreField: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  label: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  scoreInput: { width: 80, textAlign: 'center', fontSize: '2.5rem', fontFamily: "'Bebas Neue', sans-serif", background: 'var(--bg3)', border: '2px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '8px', MozAppearance: 'textfield' },
  dash: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: 'var(--text-muted)', paddingBottom: 8 },
  hint: { textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' },
  error: { color: 'var(--fallo)', fontSize: '0.85rem', background: '#2d1010', padding: '8px 12px', borderRadius: 'var(--radius-sm)' },
  successMsg: { color: 'var(--ganador)', textAlign: 'center', fontWeight: 600 },
  btn: { padding: '14px', background: 'var(--mexico)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '1rem', fontWeight: 600 },
  center: { textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' },
}
