import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMatches, getMyPredictions, savePrediction } from '../lib/api'
import { useSession } from '../context/SessionContext'

const CAT_CLASS = { exacto: 'cat-exacto', ganador: 'cat-ganador', inverso: 'cat-inverso', fallo: 'cat-fallo' }

function isClosed(kickoff) { return new Date(kickoff) - new Date() <= 60 * 60 * 1000 }

function Flag({ code, size = 28 }) {
  if (!code) return <span style={{ width: size, height: size * .75, display: 'inline-block' }} />
  return (
    <img src={`https://flagcdn.com/${size}x${Math.round(size * .75)}/${code}.png`} alt={code}
      style={{ borderRadius: 3, objectFit: 'cover', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,.4)' }}
      onError={(e) => { e.target.style.display = 'none' }} />
  )
}

function formatDateHeader(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function Matches() {
  const { token } = useSession()
  const [matches, setMatches] = useState([])
  const [inputs, setInputs] = useState({})
  const [saving, setSaving] = useState({})
  const [savedOk, setSavedOk] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [ms, preds] = await Promise.all([getMatches(), getMyPredictions(token)])
      const predMap = {}
      preds.forEach((p) => { predMap[p.match_id] = p })
      setMatches(ms)
      const init = {}
      ms.forEach((m) => {
        const p = predMap[m.id]
        init[m.id] = { home: p ? String(p.home_pred) : '', away: p ? String(p.away_pred) : '', dirty: false, hasSaved: !!p, category: p?.category, points: p?.points }
      })
      setInputs(init)
    } catch { setError('Error al cargar partidos.') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  function setField(id, field, value) {
    setInputs((p) => ({ ...p, [id]: { ...p[id], [field]: value, dirty: true } }))
    setSavedOk((p) => ({ ...p, [id]: false }))
  }

  async function saveOne(matchId) {
    const inp = inputs[matchId]
    const h = parseInt(inp.home, 10), a = parseInt(inp.away, 10)
    if (isNaN(h) || isNaN(a)) return
    setSaving((p) => ({ ...p, [matchId]: true }))
    try {
      await savePrediction(token, matchId, h, a)
      setSavedOk((p) => ({ ...p, [matchId]: true }))
      setInputs((p) => ({ ...p, [matchId]: { ...p[matchId], dirty: false, hasSaved: true } }))
    } catch {}
    finally { setSaving((p) => ({ ...p, [matchId]: false })) }
  }

  const open = matches.filter((m) => !isClosed(m.kickoff) && m.home_result == null)
  const closed = matches.filter((m) => isClosed(m.kickoff) || m.home_result != null)

  const byDate = {}
  open.forEach((m) => {
    const key = new Date(m.kickoff).toLocaleDateString('es-AR')
    byDate[key] = byDate[key] || { label: formatDateHeader(m.kickoff), matches: [] }
    byDate[key].matches.push(m)
  })

  const pendingIds = open.map((m) => m.id).filter((id) => {
    const inp = inputs[id]
    return inp?.dirty && inp.home !== '' && inp.away !== ''
  })

  async function saveAll() { await Promise.all(pendingIds.map(saveOne)) }

  if (loading) return <div className="text-center py-5 text-muted"><span className="spinner-border me-2"></span>Cargando partidos...</div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div style={{ paddingBottom: pendingIds.length ? 80 : 0 }}>
      {/* Partidos abiertos */}
      {Object.keys(byDate).map((key) => (
        <section key={key} className="mb-4">
          <h5 className="text-capitalize fw-semibold mb-3" style={{ color: 'var(--gold)', textTransform: 'capitalize !important' }}>
            <i className="bi bi-calendar-event me-2" style={{ color: 'var(--green)' }}></i>
            {byDate[key].label}
          </h5>
          <div className="d-flex flex-column gap-3">
            {byDate[key].matches.map((m) => {
              const inp = inputs[m.id] || { home: '', away: '', dirty: false, hasSaved: false }
              const isSaving = saving[m.id]
              const isOk = savedOk[m.id]
              const canSave = inp.home !== '' && inp.away !== ''
              return (
                <div key={m.id} className="match-card">
                  {/* Top row */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      <i className="bi bi-clock me-1"></i>{formatTime(m.kickoff)}
                    </span>
                    <span className="badge badge-open">● ABIERTO</span>
                  </div>

                  {/* Teams + inputs */}
                  <div className="d-flex align-items-center mb-2" style={{ gap: 0 }}>
                    {/* Local */}
                    <div className="d-flex align-items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                      <Flag code={m.home_flag} size={32} />
                      <span className="fw-bold" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.home_team}</span>
                    </div>

                    {/* Score — fixed width, centered */}
                    <div className="d-flex align-items-center justify-content-center gap-2 flex-shrink-0" style={{ width: 160 }}>
                      <input className="score-input" type="number" min="0" max="99"
                        value={inp.home} onChange={(e) => setField(m.id, 'home', e.target.value)}
                        inputMode="numeric" placeholder="–" />
                      <span className="font-display text-muted" style={{ fontSize: '1.4rem' }}>:</span>
                      <input className="score-input" type="number" min="0" max="99"
                        value={inp.away} onChange={(e) => setField(m.id, 'away', e.target.value)}
                        inputMode="numeric" placeholder="–" />
                    </div>

                    {/* Visitante */}
                    <div className="d-flex align-items-center gap-2 justify-content-end" style={{ flex: 1, minWidth: 0 }}>
                      <span className="fw-bold text-end" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.away_team}</span>
                      <Flag code={m.away_flag} size={32} />
                    </div>
                  </div>


                  {/* Info partido */}
                  <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                    <span>
                      📅 {new Date(m.kickoff).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      &nbsp;&nbsp;🕐 {formatTime(m.kickoff)}
                    </span>
                    {(m.stadium || m.city) && (
                      <span>
                        🏟 {m.stadium && <span>{m.stadium}</span>}
                        {m.city && <span>&nbsp;&nbsp;📍 {m.city}{m.country ? `, ${m.country}` : ''}</span>}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="d-flex align-items-center gap-2">
                      {isOk ? (
                        <span className="text-green" style={{ fontSize: '0.8rem' }}><i className="bi bi-check-circle-fill me-1"></i>Guardado</span>
                      ) : inp.hasSaved && inp.category ? (
                        <span className={`badge border ${CAT_CLASS[inp.category]}`} style={{ background: 'transparent' }}>
                          {inp.category} · {inp.points ?? 0} pts
                        </span>
                      ) : inp.hasSaved ? (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}><i className="bi bi-check2 me-1"></i>Guardado</span>
                      ) : null}
                    </div>
                    <button onClick={() => saveOne(m.id)} disabled={!canSave || isSaving}
                      className={`btn btn-sm ${isOk ? 'btn-success' : 'btn-primary'}`}
                      style={{ minWidth: 100, fontWeight: 700 }}>
                      {isSaving ? <span className="spinner-border spinner-border-sm"></span>
                        : isOk ? <><i className="bi bi-check2 me-1"></i>Guardado</>
                        : inp.hasSaved ? <><i className="bi bi-arrow-repeat me-1"></i>Actualizar</>
                        : <><i className="bi bi-floppy me-1"></i>Guardar</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {open.length === 0 && (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-calendar-x" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>
          No hay partidos abiertos para pronosticar.
        </div>
      )}

      {/* Partidos cerrados */}
      {closed.length > 0 && (
        <section className="mt-4">
          <h5 className="fw-semibold mb-3" style={{ color: 'var(--muted)' }}>
            <i className="bi bi-lock me-2"></i>Partidos cerrados
          </h5>
          <div className="d-flex flex-column gap-2">
            {closed.map((m) => {
              const inp = inputs[m.id]
              const finished = m.home_result != null
              return (
                <div key={m.id} className="match-card closed-card">
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    {/* Teams */}
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <Flag code={m.home_flag} size={24} />
                      <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{m.home_team}</span>

                      {finished ? (
                        <span className="font-display mx-2" style={{ fontSize: '1.4rem', color: 'var(--gold)' }}>
                          {m.home_result} - {m.away_result}
                        </span>
                      ) : (
                        <span className="badge badge-live mx-2">EN JUEGO</span>
                      )}

                      <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{m.away_team}</span>
                      <Flag code={m.away_flag} size={24} />
                    </div>

                    {/* Mi pronóstico */}
                    {inp?.hasSaved && (
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Mi pronóstico</span>
                        <span className="font-display" style={{ fontSize: '1.1rem' }}>{inp.home}-{inp.away}</span>
                        {inp.category && (
                          <span className={`badge border ${CAT_CLASS[inp.category]}`} style={{ background: 'transparent', fontSize: '0.7rem' }}>
                            {inp.category} {inp.points != null ? `· ${inp.points}pts` : ''}
                          </span>
                        )}
                      </div>
                    )}

                    <Link to={`/partidos/${m.id}/ver`} className="btn btn-sm btn-outline-warning" style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      <i className="bi bi-people me-1"></i>Ver pronósticos
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Save bar */}
      {pendingIds.length > 0 && (
        <div className="save-bar">
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-exclamation-circle me-2 text-gold"></i>
            {pendingIds.length} pronóstico{pendingIds.length > 1 ? 's' : ''} sin guardar
          </span>
          <button onClick={saveAll} className="btn btn-success fw-bold px-4">
            <i className="bi bi-floppy me-2"></i>Guardar todos
          </button>
        </div>
      )}
    </div>
  )
}
