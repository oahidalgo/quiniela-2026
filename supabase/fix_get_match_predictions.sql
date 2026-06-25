-- Corrige get_match_predictions
-- Pegar en Supabase > SQL Editor > Run

drop function if exists get_match_predictions(text, uuid) cascade;

create or replace function get_match_predictions(p_token text, p_match_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_pid      uuid;
  v_kickoff  timestamptz;
  v_hr       int;
  v_ar       int;
  v_home_team text;
  v_away_team text;
begin
  v_pid := resolve_token(p_token);

  select kickoff, home_result, away_result, home_team, away_team
    into v_kickoff, v_hr, v_ar, v_home_team, v_away_team
    from matches where id = p_match_id;

  if v_kickoff is null then raise exception 'NOT_FOUND'; end if;

  if now() < match_closing(v_kickoff) and v_hr is null then
    raise exception 'NOT_CLOSED';
  end if;

  return jsonb_build_object(
    'match', jsonb_build_object(
      'id',           p_match_id,
      'home_team',    v_home_team,
      'away_team',    v_away_team,
      'home_result',  v_hr,
      'away_result',  v_ar
    ),
    'predictions', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'name',      sub.name,
          'home_pred', sub.home_pred,
          'away_pred', sub.away_pred,
          'points',    sub.pts,
          'category',  sub.cat
        )
        order by sub.pts desc nulls last, sub.name asc
      ), '[]'::jsonb)
      from (
        select
          case when pa.segundo_apellido is not null
               then pa.nombre || ' ' || pa.apellido || ' ' || pa.segundo_apellido
               else pa.nombre || ' ' || pa.apellido
          end as name,
          pr.home_goals as home_pred,
          pr.away_goals as away_pred,
          -- Calcular puntaje sin usar el tipo compuesto inline
          case
            when v_hr is null or v_ar is null then 0
            when pr.home_goals = v_hr and pr.away_goals = v_ar then 5
            when sign(pr.home_goals - pr.away_goals) = sign(v_hr - v_ar) then 3
            when pr.home_goals = v_ar and pr.away_goals = v_hr then 1
            else 0
          end as pts,
          case
            when v_hr is null or v_ar is null then null
            when pr.home_goals = v_hr and pr.away_goals = v_ar then 'exacto'
            when sign(pr.home_goals - pr.away_goals) = sign(v_hr - v_ar) then 'ganador'
            when pr.home_goals = v_ar and pr.away_goals = v_hr then 'inverso'
            else 'fallo'
          end as cat
        from predictions pr
        join participants pa on pa.id = pr.participant_id
        where pr.match_id = p_match_id
      ) sub
    )
  );
end; $$;
