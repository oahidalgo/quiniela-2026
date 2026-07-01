-- ============================================================
-- Pronósticos cargados manualmente
-- Busca al participante por (nombre, apellido) y al partido por equipos.
-- Idempotente: si el pronóstico ya existe, lo actualiza.
-- ============================================================
-- IMPORTANTE: los puntos NO se calculan aquí. Se calculan solos
-- cuando el admin carga el resultado del partido (ver nota al final).
-- ============================================================

insert into predictions (participant_id, match_id, home_goals, away_goals)
select p.id, m.id, v.hg, v.ag
from (values
  -- nombre,    apellido,   local,        visitante,  goles_local, goles_visit
  ('Hayven',   'De León',  'Sudáfrica',  'Canadá',   1, 3),
  ('Juan',     'Escobar',  'Sudáfrica',  'Canadá',   1, 1),
  ('Pablo',    'Juarez',   'Sudáfrica',  'Canadá',   1, 3),
  ('Brandon',  'Hidalgo',  'Alemania',   'Paraguay', 2, 0)
) as v(nombre, apellido, home_team, away_team, hg, ag)
join participants p
  on lower(p.nombre)   = lower(v.nombre)
 and lower(p.apellido) = lower(v.apellido)
join matches m
  on m.home_team = v.home_team
 and m.away_team = v.away_team
on conflict (participant_id, match_id)
do update set home_goals = excluded.home_goals,
              away_goals = excluded.away_goals,
              updated_at = now();

-- Verificación: ver los pronósticos recién cargados
select pa.nombre, pa.apellido, m.home_team, m.away_team,
       pr.home_goals, pr.away_goals
from predictions pr
join participants pa on pa.id = pr.participant_id
join matches m on m.id = pr.match_id
where (m.home_team, m.away_team) in (('Sudáfrica','Canadá'), ('Alemania','Paraguay'))
order by m.home_team, pa.nombre;
