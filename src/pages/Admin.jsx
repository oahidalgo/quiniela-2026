import { useState, useEffect } from 'react'
import {
  adminSetResult, adminCreateMatch, adminUpdateMatch, adminDeleteMatch,
  adminListParticipants, adminDeleteParticipant, adminRecalculate, adminReset,
  getMatches,
} from '../lib/api'
import { useSession } from '../context/SessionContext'

const STAGES = ['16vos', '8vos', '4tos', 'semifinal', '3erlugar', 'final']
const STAGE_LABELS = {
  '16vos': 'Dieciseisavos', '8vos': 'Octavos', '4tos': 'Cuartos',
  semifinal: 'Semifinales', '3erlugar': 'Tercer lugar', final: 'Final',
}

export default function Admin() {
  const { token } = useSession()
  const [tab, setTab] = useState('resultados')

  return (
    <div>
      <h2 style={styles.pageTitle}>PANEL ADMIN</h2>
      <div style={styles.tabs}>
        {['resultados', 'partidos', 'participantes', 'avanzado'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'resultados' && <TabResultados token={token} />}
      {tab === 'partidos' && <TabPartidos token={token} />}
      {tab === 'participantes' && <TabParticipantes token={token} />}
      {tab === 'avanzado' && <TabAvanzado token={token} />}
    </div>
  )
}

function TabResultados({ token }) {
  const [matches, setMatches] = useState([])
  const [results, setResults] = useState({})
  const [msgs, setMsgs] = useState({})

  useEffect(() => {
    getMatches().then(setMatches)
  }, [])

  function setResult(id, field, val) {
    setResults((r) => ({ ...r, [id]: { ...r[id], [field]: val } }))
  }

  async function submit(matchId) {
    const r = results[matchId] || {}
    const h = parseInt(r.home, 10)
    const a = parseInt(r.away, 10)
    if (isNaN(h) || isNaN(a)) { setMsgs((m) => ({ ...m, [matchId]: 'Ingresá ambos goles.' })); return }
    try {
      await adminSetResult(token, matchId, h, a)
      setMsgs((m) => ({ ...m, [matchId]: '✓ Guardado y recalculado' }))
      getMatches().then(setMatches)
    } catch (err) {
      setMsgs((m) => ({ ...m, [matchId]: err.message || 'Error' }))
    }
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Cargar / corregir resultados</h3>
      {matches.map((m) => (
        <div key={m.id} style={styles.resultRow}>
          <span style={styles.matchLabel}>{m.home_team} vs {m.away_team}</span>
          {m.home_result != null && (
            <span style={styles.currentResult}>({m.home_result}–{m.away_result})</span>
          )}
          <input type="number" min="0" max="99" placeholder="L"
            value={results[m.id]?.home ?? ''} onChange={(e) => setResult(m.id, 'home', e.target.value)}
            style={styles.goalInput} />
          <span>–</span>
          <input type="number" min="0" max="99" placeholder="V"
            value={results[m.id]?.away ?? ''} onChange={(e) => setResult(m.id, 'away', e.target.value)}
            style={styles.goalInput} />
          <button onClick={() => submit(m.id)} style={styles.btnSm}>Guardar</button>
          {msgs[m.id] && <span style={styles.inlineMsg}>{msgs[m.id]}</span>}
        </div>
      ))}
    </div>
  )
}

const EMPTY_MATCH = { home_team: '', away_team: '', home_flag: '', away_flag: '', stadium: '', city: '', country: '', kickoff: '', stage: '16vos' }

function TabPartidos({ token }) {
  const [matches, setMatches] = useState([])
  const [form, setForm] = useState(EMPTY_MATCH)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { getMatches().then(setMatches) }, [])

  function setF(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (editing) {
        await adminUpdateMatch(token, editing, form)
        setMsg('✓ Partido actualizado')
        setEditing(null)
      } else {
        await adminCreateMatch(token, form)
        setMsg('✓ Partido creado')
      }
      setForm(EMPTY_MATCH)
      getMatches().then(setMatches)
    } catch (err) { setMsg(err.message || 'Error') }
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar partido?')) return
    try { await adminDeleteMatch(token, id); getMatches().then(setMatches) }
    catch (err) { setMsg(err.message || 'Error al borrar') }
  }

  function startEdit(m) {
    setEditing(m.id)
    setForm({ home_team: m.home_team, away_team: m.away_team, home_flag: m.home_flag || '', away_flag: m.away_flag || '', stadium: m.stadium || '', city: m.city || '', country: m.country || '', kickoff: m.kickoff?.slice(0, 16) || '', stage: m.stage })
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{editing ? 'Editar partido' : 'Crear partido'}</h3>
      <form onSubmit={handleSubmit} style={styles.matchForm}>
        <div style={styles.formRow}>
          <FInput label="Equipo local" value={form.home_team} onChange={setF('home_team')} required />
          <FInput label="Bandera local (ej: ar)" value={form.home_flag} onChange={setF('home_flag')} />
        </div>
        <div style={styles.formRow}>
          <FInput label="Equipo visitante" value={form.away_team} onChange={setF('away_team')} required />
          <FInput label="Bandera visitante" value={form.away_flag} onChange={setF('away_flag')} />
        </div>
        <div style={styles.formRow}>
          <FInput label="Estadio" value={form.stadium} onChange={setF('stadium')} />
          <FInput label="Ciudad" value={form.city} onChange={setF('city')} />
          <FInput label="País" value={form.country} onChange={setF('country')} />
        </div>
        <div style={styles.formRow}>
          <div>
            <label style={styles.label}>Etapa</label>
            <select value={form.stage} onChange={setF('stage')} style={styles.select}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          <FInput label="Fecha y hora (kickoff)" value={form.kickoff} onChange={setF('kickoff')} type="datetime-local" required />
        </div>
        {msg && <p style={styles.inlineMsg}>{msg}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={styles.btnPrimary}>{editing ? 'Actualizar' : 'Crear'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_MATCH) }} style={styles.btnSecondary}>Cancelar</button>}
        </div>
      </form>
      <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>Partidos existentes</h3>
      {matches.map((m) => (
        <div key={m.id} style={styles.resultRow}>
          <span style={styles.matchLabel}>{m.home_team} vs {m.away_team}</span>
          <span style={styles.currentResult}>{STAGE_LABELS[m.stage]}</span>
          <button onClick={() => startEdit(m)} style={styles.btnSm}>Editar</button>
          <button onClick={() => handleDelete(m.id)} style={{ ...styles.btnSm, background: 'var(--fallo)' }}>Borrar</button>
        </div>
      ))}
    </div>
  )
}

function TabParticipantes({ token }) {
  const [participants, setParticipants] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    adminListParticipants(token).then(setParticipants).catch(() => setMsg('Error al cargar'))
  }, [token])

  async function handleDelete(id, name) {
    if (!confirm(`¿Borrar a ${name}?`)) return
    try {
      await adminDeleteParticipant(token, id)
      setParticipants((p) => p.filter((x) => x.id !== id))
    } catch (err) { setMsg(err.message || 'Error') }
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Participantes ({participants.length})</h3>
      {msg && <p style={styles.inlineMsg}>{msg}</p>}
      {participants.map((p) => (
        <div key={p.id} style={styles.resultRow}>
          <span style={styles.matchLabel}>{p.name}</span>
          {p.is_admin && <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>admin</span>}
          <button onClick={() => handleDelete(p.id, p.name)} style={{ ...styles.btnSm, background: 'var(--fallo)', marginLeft: 'auto' }}>Borrar</button>
        </div>
      ))}
    </div>
  )
}

function TabAvanzado({ token }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(fn, confirmMsg) {
    if (!confirm(confirmMsg)) return
    setLoading(true); setMsg('')
    try { await fn(); setMsg('✓ Completado') }
    catch (err) { setMsg(err.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Operaciones avanzadas</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <DangerBtn
          label="Recalcular todo el torneo"
          desc="Recalcula puntos y categorías de todos los pronósticos con resultado."
          onClick={() => run(() => adminRecalculate(token), '¿Recalcular todo el torneo?')}
          disabled={loading}
        />
        <DangerBtn
          label="Reiniciar (conservar participantes)"
          desc="Borra resultados y pronósticos. Los participantes quedan."
          onClick={() => run(() => adminReset(token, false), '¿Reiniciar resultados y pronósticos?')}
          disabled={loading}
          danger
        />
        <DangerBtn
          label="Reiniciar todo (borrar participantes)"
          desc="Borra resultados, pronósticos Y participantes. Queda solo el admin."
          onClick={() => run(() => adminReset(token, true), '¿BORRAR TODO incluyendo participantes?')}
          disabled={loading}
          danger
        />
      </div>
      {msg && <p style={{ ...styles.inlineMsg, marginTop: 16 }}>{msg}</p>}
    </div>
  )
}

function DangerBtn({ label, desc, onClick, disabled, danger }) {
  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${danger ? 'var(--fallo)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>{desc}</p>
      <button onClick={onClick} disabled={disabled}
        style={{ ...styles.btnSm, background: danger ? 'var(--fallo)' : 'var(--mexico)' }}>
        Ejecutar
      </button>
    </div>
  )
}

function FInput({ label, ...props }) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} {...props} />
    </div>
  )
}

const styles = {
  pageTitle: { fontSize: '2rem', marginBottom: 20, color: 'var(--gold)' },
  tabs: { display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' },
  tab: { padding: '8px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.9rem' },
  tabActive: { background: 'var(--mexico)', color: '#fff', borderColor: 'var(--mexico)' },
  section: {},
  sectionTitle: { fontSize: '1.2rem', marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  resultRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
  matchLabel: { flex: 1, fontWeight: 500, minWidth: 160 },
  currentResult: { color: 'var(--text-muted)', fontSize: '0.85rem' },
  goalInput: { width: 52, textAlign: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px', color: 'var(--text)', fontSize: '1rem' },
  btnSm: { padding: '6px 14px', background: 'var(--mexico)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: 'none', cursor: 'pointer' },
  btnPrimary: { padding: '10px 24px', background: 'var(--mexico)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', border: 'none', cursor: 'pointer', fontWeight: 600 },
  btnSecondary: { padding: '10px 24px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', cursor: 'pointer' },
  inlineMsg: { fontSize: '0.85rem', color: 'var(--ganador)' },
  matchForm: { display: 'flex', flexDirection: 'column', gap: 12 },
  formRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  label: { display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text)', fontSize: '0.95rem' },
  select: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text)', fontSize: '0.95rem' },
}
