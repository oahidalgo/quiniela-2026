-- Reporte: participantes sin pronóstico para los partidos de hoy
-- Ejecutar en Supabase > SQL Editor

create or replace function admin_missing_predictions(p_token text)
returns jsonb language plpgsql security definer as $$
declare
  v_admin_id uuid;
  v_result   jsonb;
begin
  v_admin_id := resolve_token(p_token);
  if not exists (select 1 from participants where id = v_admin_id and is_admin) then
    raise exception 'UNAUTHORIZED';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'match_id',      m.id,
      'home_team',     m.home_team,
      'away_team',     m.away_team,
      'home_flag',     m.home_flag,
      'away_flag',     m.away_flag,
      'kickoff',       m.kickoff,
      'stage',         m.stage,
      'missing_count', (
        select count(*)::int
        from participants p2
        where not exists (
          select 1 from predictions pr
          where pr.match_id = m.id and pr.participant_id = p2.id
        )
      ),
      'missing_names', (
        select coalesce(
          jsonb_agg(p2.nombre || ' ' || p2.apellido order by p2.nombre),
          '[]'::jsonb
        )
        from participants p2
        where not exists (
          select 1 from predictions pr
          where pr.match_id = m.id and pr.participant_id = p2.id
        )
      )
    )
    order by m.kickoff
  ), '[]'::jsonb)
  into v_result
  from matches m
  where (m.kickoff at time zone 'America/Guatemala')::date
      = (now()      at time zone 'America/Guatemala')::date;

  return v_result;
end; $$;
