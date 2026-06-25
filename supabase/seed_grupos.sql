-- ============================================================
-- DATOS DE PRUEBA — Partidos restantes fase de grupos
-- Mundial 2026 · Jornada 3 (24–27 junio 2026)
-- Horarios en UTC (fuente: ESPN/FIFA, ET → UTC restando 4h)
-- Ejecutar en Supabase > SQL Editor DESPUÉS del schema.sql
-- ============================================================
-- Nota: stage = 'grupos' (solo para pruebas; al iniciar
-- la eliminatoria se reemplaza por los partidos reales).
-- ============================================================

insert into matches (stage, home_team, away_team, home_flag, away_flag, city, country, kickoff) values

-- ── MIÉRCOLES 24 JUNIO ─────────────────────────────────────

-- 3 PM ET = 19:00 UTC
('grupos', 'Suiza',    'Canadá',        'ch', 'ca', 'Los Ángeles',  'EE.UU.',  '2026-06-24T19:00:00Z'),
('grupos', 'Escocia',  'Brasil',         'gb-sct', 'br', 'Los Ángeles',  'EE.UU.',  '2026-06-24T19:00:00Z'),
('grupos', 'Marruecos','Haití',          'ma', 'ht', 'Kansas City', 'EE.UU.',  '2026-06-24T19:00:00Z'),

-- 9 PM ET = 01:00 UTC (madrugada del 25)
('grupos', 'Chequia',  'México',         'cz', 'mx', 'Ciudad de México', 'México', '2026-06-25T01:00:00Z'),
('grupos', 'Sudáfrica','Corea del Sur',  'za', 'kr', 'Monterrey',   'México',  '2026-06-25T01:00:00Z'),

-- ── JUEVES 25 JUNIO ────────────────────────────────────────

-- 4 PM ET = 20:00 UTC
('grupos', 'Ecuador',  'Alemania',       'ec', 'de', 'Boston',      'EE.UU.',  '2026-06-25T20:00:00Z'),
('grupos', 'Curazao',  'Costa de Marfil','cw', 'ci', 'Filadelfia',  'EE.UU.',  '2026-06-25T20:00:00Z'),

-- 7 PM ET = 23:00 UTC
('grupos', 'Japón',    'Suecia',         'jp', 'se', 'Dallas',      'EE.UU.',  '2026-06-25T23:00:00Z'),
('grupos', 'Túnez',    'Países Bajos',   'tn', 'nl', 'Atlanta',     'EE.UU.',  '2026-06-25T23:00:00Z'),

-- 10 PM ET = 02:00 UTC (madrugada del 26)
('grupos', 'Turquía',  'Estados Unidos', 'tr', 'us', 'Los Ángeles', 'EE.UU.',  '2026-06-26T02:00:00Z'),
('grupos', 'Paraguay', 'Australia',      'py', 'au', 'San Francisco','EE.UU.', '2026-06-26T02:00:00Z'),

-- ── VIERNES 26 JUNIO ───────────────────────────────────────

-- 3 PM ET = 19:00 UTC
('grupos', 'Noruega',  'Francia',        'no', 'fr', 'Boston',      'EE.UU.',  '2026-06-26T19:00:00Z'),
('grupos', 'Senegal',  'Irak',           'sn', 'iq', 'Toronto',     'Canadá',  '2026-06-26T19:00:00Z'),

-- 8 PM ET = 00:00 UTC (madrugada del 27)
('grupos', 'Cabo Verde','Arabia Saudita','cv', 'sa', 'Houston',     'EE.UU.',  '2026-06-27T00:00:00Z'),
('grupos', 'Uruguay',  'España',         'uy', 'es', 'Guadalajara', 'México',  '2026-06-27T00:00:00Z'),

-- 11 PM ET = 03:00 UTC (madrugada del 27)
('grupos', 'Egipto',   'Irán',           'eg', 'ir', 'Seattle',     'EE.UU.',  '2026-06-27T03:00:00Z'),
('grupos', 'Nueva Zelanda','Bélgica',    'nz', 'be', 'Vancouver',   'Canadá',  '2026-06-27T03:00:00Z'),

-- ── SÁBADO 27 JUNIO ────────────────────────────────────────

-- 5 PM ET = 21:00 UTC
('grupos', 'Panamá',   'Inglaterra',     'pa', 'gb-eng', 'Nueva York',  'EE.UU.',  '2026-06-27T21:00:00Z'),
('grupos', 'Croacia',  'Ghana',          'hr', 'gh', 'Miami',       'EE.UU.',  '2026-06-27T21:00:00Z'),

-- 7:30 PM ET = 23:30 UTC
('grupos', 'Colombia', 'Portugal',       'co', 'pt', 'Miami',       'EE.UU.',  '2026-06-27T23:30:00Z'),
('grupos', 'R.D. Congo','Uzbekistán',    'cd', 'uz', 'Atlanta',     'EE.UU.',  '2026-06-27T23:30:00Z'),

-- 10 PM ET = 02:00 UTC (madrugada del 28)
('grupos', 'Argelia',  'Austria',        'dz', 'at', 'Kansas City', 'EE.UU.',  '2026-06-28T02:00:00Z'),
('grupos', 'Jordania', 'Argentina',      'jo', 'ar', 'Dallas',      'EE.UU.',  '2026-06-28T02:00:00Z');
