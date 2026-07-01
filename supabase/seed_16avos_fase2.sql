-- ============================================================
-- RONDA DE 32 (16avos) — Resto de partidos
-- Continuación de seed_16avos_fase1.sql (después de Francia vs Suecia)
-- Fuente: Yahoo Sports / FIFA — bracket confirmado
-- ============================================================
-- Todos los kickoff están en UTC.
-- Hora Guatemala (UTC-6) indicada en comentarios.
-- ET = EDT (UTC-4) en estas fechas → Guatemala = ET - 2h
-- ============================================================

insert into matches (stage, home_team, home_flag, away_team, away_flag, stadium, city, country, kickoff)
values

-- Martes 30 de junio
-- 19:00 Guatemala | 21:00 ET | 01:00 UTC (1 jul)
(
  '16vos', 'México', 'mx', 'Ecuador', 'ec',
  'Estadio Azteca', 'Ciudad de México', 'México',
  '2026-07-01T01:00:00+00:00'
),

-- Miércoles 1 de julio
-- 10:00 Guatemala | 12:00 ET | 16:00 UTC
(
  '16vos', 'Inglaterra', 'gb-eng', 'Congo RD', 'cd',
  'Mercedes-Benz Stadium', 'Atlanta', 'USA',
  '2026-07-01T16:00:00+00:00'
),

-- 14:00 Guatemala | 16:00 ET | 20:00 UTC
(
  '16vos', 'Bélgica', 'be', 'Senegal', 'sn',
  'Lumen Field', 'Seattle', 'USA',
  '2026-07-01T20:00:00+00:00'
),

-- 18:00 Guatemala | 20:00 ET | 00:00 UTC (2 jul)
(
  '16vos', 'Estados Unidos', 'us', 'Bosnia y Herzegovina', 'ba',
  'Levi''s Stadium', 'San Francisco Bay Area', 'USA',
  '2026-07-02T00:00:00+00:00'
),

-- Jueves 2 de julio
-- 13:00 Guatemala | 15:00 ET | 19:00 UTC
(
  '16vos', 'España', 'es', 'Austria', 'at',
  'SoFi Stadium', 'Los Ángeles', 'USA',
  '2026-07-02T19:00:00+00:00'
),

-- 17:00 Guatemala | 19:00 ET | 23:00 UTC
(
  '16vos', 'Portugal', 'pt', 'Croacia', 'hr',
  'BMO Field', 'Toronto', 'Canadá',
  '2026-07-02T23:00:00+00:00'
),

-- 21:00 Guatemala | 23:00 ET | 03:00 UTC (3 jul)
(
  '16vos', 'Suiza', 'ch', 'Argelia', 'dz',
  'BC Place', 'Vancouver', 'Canadá',
  '2026-07-03T03:00:00+00:00'
),

-- Viernes 3 de julio
-- 12:00 Guatemala | 14:00 ET | 18:00 UTC
(
  '16vos', 'Australia', 'au', 'Egipto', 'eg',
  'AT&T Stadium', 'Dallas', 'USA',
  '2026-07-03T18:00:00+00:00'
),

-- 16:00 Guatemala | 18:00 ET | 22:00 UTC
(
  '16vos', 'Argentina', 'ar', 'Cabo Verde', 'cv',
  'Hard Rock Stadium', 'Miami', 'USA',
  '2026-07-03T22:00:00+00:00'
),

-- 19:30 Guatemala | 21:30 ET | 01:30 UTC (4 jul)
(
  '16vos', 'Colombia', 'co', 'Ghana', 'gh',
  'Arrowhead Stadium', 'Kansas City', 'USA',
  '2026-07-04T01:30:00+00:00'
);
