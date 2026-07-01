-- ============================================================
-- Pronósticos manuales — México vs Ecuador
-- Chino Interiano  = cuenta Alberto Cruz     → Ecuador gana 2-1  (México 1-2)
-- Lalo Escobar     = cuenta Hayven De León   → México gana 2-1   (México 2-1)
-- Idempotente: si ya existe el pronóstico, lo actualiza.
-- ============================================================

insert into predictions (participant_id, match_id, home_goals, away_goals)
select p.id, m.id, v.hg, v.ag
from (values
  -- nombre,   apellido,  local,    visitante, goles_local(Mex), goles_visit(Ecu)
  ('Alberto', 'Cruz',    'México', 'Ecuador', 1, 2),
  ('Hayven',  'De León', 'México', 'Ecuador', 2, 1)
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

-- Verificación
select pa.nombre, pa.apellido, m.home_team, m.away_team,
       pr.home_goals, pr.away_goals
from predictions pr
join participants pa on pa.id = pr.participant_id
join matches m on m.id = pr.match_id
where m.home_team = 'México' and m.away_team = 'Ecuador'
order by pa.nombre;
