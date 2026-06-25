import { useState, useEffect } from 'react'
import { getStandings } from '../lib/api'
import { useSession } from '../context/SessionContext'

const RANK_MEDALS = { 1: '🏆' }

export default function Standings() {
  const { user } = useSession()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStandings()
      .then(setRows)
      .catch(() => setError('Error al cargar la tabla.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-5 text-muted"><span className="spinner-border me-2"></span>Cargando tabla...</div>
  if (error) return <div className="alert alert-danger">{error}</div>

  const leader = rows[0]

  return (
    <div>
      <h2 className="font-display text-gold mb-1" style={{ fontSize: '2.2rem' }}>
        <i className="bi bi-trophy-fill me-2" style={{ color: 'var(--gold)' }}></i>TABLA DE POSICIONES
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Desempate por marcadores exactos · Premio se divide si persiste el empate</p>

      {/* Líder destacado */}
      {leader && (
        <div className="mb-4 p-3 rounded-3 d-flex align-items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,.08) 0%, rgba(255,215,0,.02) 100%)', border: '1px solid rgba(255,215,0,.2)' }}>
          <span style={{ fontSize: '2.5rem' }}>🏆</span>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.07em' }}>Líder actual</div>
            <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{leader.name}</div>
          </div>
          <div className="ms-auto text-end">
            <div className="font-display text-gold" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{leader.total_points}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>puntos</div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Participante</th>
              <th className="text-center">Pts</th>
              <th className="text-center" style={{ color: 'var(--exacto)' }}>Exactos</th>
              <th className="text-center" style={{ color: 'var(--ganador)' }}>Ganador</th>
              <th className="text-center" style={{ color: 'var(--inverso)' }}>Inverso</th>
              <th className="text-center text-muted">Pronósticos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isMe = r.name === user?.name
              const rankClass = r.lugar <= 3 ? `rank-${r.lugar}` : ''
              const myClass = isMe ? 'my-row' : ''
              return (
                <tr key={i} className={`${rankClass} ${myClass}`}>
                  <td>
                    <span className="font-display" style={{ fontSize: '1.1rem' }}>
                      {RANK_MEDALS[r.lugar] || r.lugar}
                    </span>
                  </td>
                  <td>
                    <span className={isMe ? 'fw-bold' : ''}>{r.name}</span>
                    {isMe && <span className="badge ms-2" style={{ background: 'var(--green)', fontSize: '0.65rem' }}>Yo</span>}
                  </td>
                  <td className="text-center">
                    <span className="font-display" style={{ fontSize: '1.3rem', color: r.lugar === 1 ? 'var(--gold)' : 'var(--text)' }}>
                      {r.total_points}
                    </span>
                  </td>
                  <td className="text-center fw-semibold" style={{ color: 'var(--exacto)' }}>{r.exact_count}</td>
                  <td className="text-center fw-semibold" style={{ color: 'var(--ganador)' }}>{r.winner_count}</td>
                  <td className="text-center fw-semibold" style={{ color: 'var(--inverso)' }}>{r.inverse_count}</td>
                  <td className="text-center text-muted">{r.predicted_count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
