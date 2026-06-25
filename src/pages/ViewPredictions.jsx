import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatchPredictions } from '../lib/api'
import { useSession } from '../context/SessionContext'

const CAT_CLASS = { exacto: 'cat-exacto', ganador: 'cat-ganador', inverso: 'cat-inverso', fallo: 'cat-fallo' }

export default function ViewPredictions() {
  const { matchId } = useParams()
  const { token } = useSession()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMatchPredictions(token, matchId)
      .then(setData)
      .catch((err) => {
        if (err.message === 'NOT_CLOSED') setError('Los pronósticos se revelan 1 hora antes del partido.')
        else setError('Error al cargar pronósticos.')
      })
      .finally(() => setLoading(false))
  }, [matchId, token])

  if (loading) return <div className="text-center py-5 text-muted"><span className="spinner-border me-2"></span>Cargando...</div>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary mb-4">
        <i className="bi bi-arrow-left me-1"></i>Volver
      </button>

      {error ? (
        <div className="text-center py-5">
          <i className="bi bi-lock" style={{ fontSize: '2.5rem', color: 'var(--muted)', display: 'block', marginBottom: 12 }}></i>
          <p className="text-muted">{error}</p>
        </div>
      ) : (
        <>
          <h2 className="font-display text-gold mb-1" style={{ fontSize: '2rem' }}>PRONÓSTICOS</h2>
          {data?.match && (
            <p className="text-muted mb-1">{data.match.home_team} vs {data.match.away_team}</p>
          )}
          {data?.match?.home_result != null && (
            <div className="mb-4 d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Resultado final:</span>
              <span className="font-display text-gold" style={{ fontSize: '1.6rem' }}>
                {data.match.home_result} - {data.match.away_result}
              </span>
            </div>
          )}

          <div className="table-responsive mt-3">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th className="text-center">Pronóstico</th>
                  <th className="text-center">Resultado</th>
                  <th className="text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {(data?.predictions || []).map((p, i) => (
                  <tr key={i}>
                    <td className="fw-medium">{p.name}</td>
                    <td className="text-center font-display" style={{ fontSize: '1.2rem' }}>{p.home_pred} - {p.away_pred}</td>
                    <td className="text-center">
                      {p.category
                        ? <span className={`badge border ${CAT_CLASS[p.category]}`} style={{ background: 'transparent' }}>{p.category}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-center fw-bold">{p.points ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
