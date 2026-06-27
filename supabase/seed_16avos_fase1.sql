-- ============================================================
-- RONDA DE 32 — Partidos confirmados (hasta Francia vs Suecia)
-- Fuente: FIFA / NBC Sports / Olympics.com
-- ============================================================
-- Todos los kickoff están en UTC.
-- Hora Guatemala (UTC-6) indicada en comentarios para verificación.
-- ============================================================

insert into matches (stage, home_team, home_flag, away_team, away_flag, stadium, city, country, kickoff)
values

-- Domingo 28 de junio
-- 13:00 Guatemala | 19:00 UTC
(
  '16vos', 'Sudáfrica', 'za', 'Canadá', 'ca',
  'SoFi Stadium', 'Los Ángeles', 'USA',
  '2026-06-28T19:00:00+00:00'
),

-- Lunes 29 de junio
-- 11:00 Guatemala | 17:00 UTC
(
  '16vos', 'Brasil', 'br', 'Japón', 'jp',
  'NRG Stadium', 'Houston', 'USA',
  '2026-06-29T17:00:00+00:00'
),

-- 14:30 Guatemala | 20:30 UTC
(
  '16vos', 'Alemania', 'de', 'Paraguay', 'py',
  'Gillette Stadium', 'Boston', 'USA',
  '2026-06-29T20:30:00+00:00'
),

-- 19:00 Guatemala | 01:00 UTC (30 jun)
(
  '16vos', 'Países Bajos', 'nl', 'Marruecos', 'ma',
  'Estadio BBVA', 'Monterrey', 'México',
  '2026-06-30T01:00:00+00:00'
),

-- Martes 30 de junio
-- 11:00 Guatemala | 17:00 UTC
(
  '16vos', 'Costa de Marfil', 'ci', 'Noruega', 'no',
  'AT&T Stadium', 'Dallas', 'USA',
  '2026-06-30T17:00:00+00:00'
),

-- 15:00 Guatemala | 21:00 UTC
(
  '16vos', 'Francia', 'fr', 'Suecia', 'se',
  'MetLife Stadium', 'New York/New Jersey', 'USA',
  '2026-06-30T21:00:00+00:00'
);
