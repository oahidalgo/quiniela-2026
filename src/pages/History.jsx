import { useState, useEffect } from 'react';
import { getMyPredictions, getMatchPredictions } from '../lib/api';
import { useSession } from '../context/SessionContext';

const CAT_CLASS = {
  exacto: 'cat-exacto',
  ganador: 'cat-ganador',
  inverso: 'cat-inverso',
  fallo: 'cat-fallo',
};
const CAT_ICON = {
  exacto: 'bi-bullseye',
  ganador: 'bi-check-circle',
  inverso: 'bi-arrow-left-right',
  fallo: 'bi-x-circle',
};

const STAGE_LABELS = {
  grupos: 'Fase de Grupos',
  '16vos': 'Dieciseisavos',
  '8vos': 'Octavos',
  '4tos': 'Cuartos',
  semifinal: 'Semifinales',
  '3erlugar': 'Tercer lugar',
  final: 'Final',
};

function Flag({ code, size = 28 }) {
  if (!code) return <span style={{ width: size, display: 'inline-block' }} />;
  return (
    <img
      src={`https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code}.png`}
      alt={code}
      style={{
        borderRadius: 3,
        objectFit: 'cover',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,.4)',
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
function formatDateFull(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function History() {
  const { token } = useSession();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyPredictions(token)
      .then(setPredictions)
      .catch(() => setError('Error al cargar historial.'))
      .finally(() => setLoading(false));
  }, [token]);

  const totalPoints = predictions.reduce((s, p) => s + (p.points || 0), 0);
  const counts = { exacto: 0, ganador: 0, inverso: 0, fallo: 0 };
  predictions.forEach((p) => {
    if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
  });

  if (loading)
    return (
      <div className='text-center py-5 text-muted'>
        <span className='spinner-border me-2'></span>Cargando historial...
      </div>
    );
  if (error) return <div className='alert alert-danger'>{error}</div>;

  return (
    <div>
      <div className='d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4'>
        <h2
          className='font-display text-gold mb-0'
          style={{ fontSize: '2.2rem' }}
        >
          MI HISTORIAL
        </h2>
        <div
          className='stat-card'
          style={{
            '--card-accent': 'var(--gold)',
            flex: '0 0 auto',
            minWidth: 120,
          }}
        >
          <div className='stat-value' style={{ color: 'var(--gold)' }}>
            {totalPoints}
          </div>
          <div className='stat-label'>Puntos</div>
        </div>
      </div>
      {/* Stats */}
      <div className='d-flex gap-2 flex-wrap mb-4'>
        <StatCard
          label='Exacto'
          value={counts.exacto}
          color='var(--exacto)'
          icon='bi-bullseye'
        />
        <StatCard
          label='Gan/Emp'
          value={counts.ganador}
          color='var(--ganador)'
          icon='bi-check-circle'
        />
        <StatCard
          label='Inverso'
          value={counts.inverso}
          color='var(--inverso)'
          icon='bi-arrow-left-right'
        />
        <StatCard
          label='Fallo'
          value={counts.fallo}
          color='var(--fallo)'
          icon='bi-x-circle'
        />
      </div>

      {predictions.length === 0 ? (
        <div className='text-center py-5 text-muted'>
          <i
            className='bi bi-inbox'
            style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}
          ></i>
          Todavía no hiciste pronósticos.
        </div>
      ) : (
        <div className='d-flex flex-column gap-3'>
          {predictions.map((p) => (
            <PredCard key={p.match_id} p={p} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredCard({ p, token }) {
  const [open, setOpen] = useState(false);
  const [others, setOthers] = useState(null);
  const [loadingOthers, setLoadingOthers] = useState(false);
  const [othersError, setOthersError] = useState('');

  const finished = p.home_result != null;
  const cat = p.category;

  async function toggleOthers() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (others !== null) return;
    setLoadingOthers(true);
    setOthersError('');
    try {
      const data = await getMatchPredictions(token, p.match_id);
      setOthers(data.predictions || []);
    } catch (err) {
      setOthersError(
        err.message === 'NOT_CLOSED'
          ? 'Los pronósticos se revelan 1 hora antes del partido.'
          : 'Error al cargar pronósticos.',
      );
    } finally {
      setLoadingOthers(false);
    }
  }

  return (
    <div
      className='match-card'
      style={{ '--card-accent': cat ? `var(--${cat})` : 'transparent' }}
    >
      {/* Encabezado: etapa + categoría */}
      <div className='d-flex justify-content-between align-items-start mb-3'>
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            color: 'var(--muted)',
          }}
        >
          {STAGE_LABELS[p.stage] || p.stage}
        </span>
        {cat && (
          <div className='text-end'>
            <span
              className={`badge border ${CAT_CLASS[cat]}`}
              style={{ background: 'transparent' }}
            >
              <i className={`bi ${CAT_ICON[cat]} me-1`}></i>
              {cat}
            </span>
            <div className='fw-bold mt-1' style={{ fontSize: '1rem' }}>
              {p.points ?? 0} pts
            </div>
          </div>
        )}
      </div>

      {/* Equipos con banderas — mismo layout responsive que Pronosticar */}
      <div className='match-body mb-2'>
        {/* Local */}
        <div className='team team-home'>
          <Flag code={p.home_flag} size={28} />
          <span className='team-name'>{p.home_team}</span>
        </div>

        {/* vs (solo móvil) */}
        <span className='vs-mobile'>vs</span>

        {/* Marcadores */}
        <div className='hist-score'>
          {/* Mi pronóstico */}
          <div className='text-center'>
            <div
              style={{
                fontSize: '0.62rem',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--muted)',
                marginBottom: 4,
              }}
            >
              Mi pronóstico
            </div>
            <div className='pred-bubble'>
              <span className='pred-score'>{p.home_pred}</span>
              <span className='pred-sep'>-</span>
              <span className='pred-score'>{p.away_pred}</span>
            </div>
          </div>

          {/* Resultado real */}
          <div className='text-center'>
            <div
              style={{
                fontSize: '0.62rem',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--muted)',
                marginBottom: 4,
              }}
            >
              Real
            </div>
            {finished ? (
              <div className='pred-bubble real'>
                <span className='pred-score' style={{ color: 'var(--gold)' }}>
                  {p.home_result}
                </span>
                <span className='pred-sep'>-</span>
                <span className='pred-score' style={{ color: 'var(--gold)' }}>
                  {p.away_result}
                </span>
              </div>
            ) : (
              <div
                className='pred-bubble'
                style={{
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                }}
              >
                <span className='pred-sep' style={{ fontSize: '1rem' }}>
                  ? - ?
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visitante */}
        <div className='team team-away'>
          <span className='team-name'>{p.away_team}</span>
          <Flag code={p.away_flag} size={28} />
        </div>
      </div>

      {/* Info partido */}
      <div
        className='d-flex flex-column gap-1 mb-3'
        style={{ fontSize: '0.75rem', color: 'var(--muted)' }}
      >
        <span>
          📅 {formatDateFull(p.kickoff)}&nbsp;&nbsp;🕐 {formatTime(p.kickoff)}
        </span>
        {(p.stadium || p.city) && (
          <span>
            🏟 {p.stadium}
            {p.city && (
              <span>
                &nbsp;&nbsp;📍 {p.city}
                {p.country ? `, ${p.country}` : ''}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Ver pronósticos de los demás */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button
          onClick={toggleOthers}
          className='btn btn-sm btn-outline-secondary'
          style={{ fontSize: '0.82rem' }}
        >
          <i className={`bi ${open ? 'bi-chevron-up' : 'bi-people'} me-2`}></i>
          {open ? 'Ocultar' : 'Ver pronósticos de los demás'}
        </button>

        {open && (
          <div
            className='mt-3 rounded-3 p-3'
            style={{ background: 'var(--bg3)' }}
          >
            {loadingOthers && (
              <div className='text-center text-muted py-2'>
                <span className='spinner-border spinner-border-sm me-2'></span>
                Cargando...
              </div>
            )}
            {othersError && (
              <div
                className='text-muted text-center py-2'
                style={{ fontSize: '0.85rem' }}
              >
                <i className='bi bi-lock me-1'></i>
                {othersError}
              </div>
            )}
            {others && others.length === 0 && (
              <p
                className='text-muted text-center mb-0'
                style={{ fontSize: '0.85rem' }}
              >
                Nadie más pronosticó este partido.
              </p>
            )}
            {others && others.length > 0 && (
              <table
                className='table table-sm mb-0'
                style={{ fontSize: '0.88rem' }}
              >
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th className='text-center'>Pron.</th>
                    <th className='text-center'>Res.</th>
                    <th className='text-center'>Pts.</th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((o, i) => (
                    <tr key={i}>
                      <td className='fw-medium'>{o.name}</td>
                      <td
                        className='text-center font-display'
                        style={{ fontSize: '1.1rem' }}
                      >
                        {o.home_pred}-{o.away_pred}
                      </td>
                      <td className='text-center'>
                        {o.category ? (
                          <span
                            className={`badge border ${CAT_CLASS[o.category]}`}
                            style={{
                              background: 'transparent',
                              fontSize: '0.7rem',
                            }}
                          >
                            {o.category}
                          </span>
                        ) : (
                          <span className='text-muted'>—</span>
                        )}
                      </td>
                      <td className='text-center fw-bold'>{o.points ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className='stat-card' style={{ '--card-accent': color }}>
      <i className={`bi ${icon} mb-1`} style={{ color, fontSize: '1rem' }}></i>
      <div className='stat-value' style={{ color }}>
        {value}
      </div>
      <div className='stat-label'>{label}</div>
    </div>
  );
}
