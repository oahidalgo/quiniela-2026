-- Reemplaza get_my_predictions para incluir banderas y datos del estadio
drop function if exists get_my_predictions(text) cascade;

create or replace function get_my_predictions(p_token text)
returns jsonb language plpgsql security definer as $$
declare v_pid uuid;
begin
  v_pid := resolve_token(p_token);
  return (
    select coalesce(jsonb_agg(row_to_json(t) order by t.kickoff asc), '[]')
    from (
      select
        m.id          as match_id,
        m.stage,
        m.home_team,  m.away_team,
        m.home_flag,  m.away_flag,
        m.stadium,    m.city,    m.country,
        m.kickoff,
        m.home_result, m.away_result,
        pr.home_goals as home_pred,
        pr.away_goals as away_pred,
        case
          when m.home_result is null or m.away_result is null then null
          when pr.home_goals = m.home_result and pr.away_goals = m.away_result then 5
          when sign(pr.home_goals - pr.away_goals) = sign(m.home_result - m.away_result) then 3
          when pr.home_goals = m.away_result and pr.away_goals = m.home_result then 1
          else 0
        end as points,
        case
          when m.home_result is null or m.away_result is null then null
          when pr.home_goals = m.home_result and pr.away_goals = m.away_result then 'exacto'
          when sign(pr.home_goals - pr.away_goals) = sign(m.home_result - m.away_result) then 'ganador'
          when pr.home_goals = m.away_result and pr.away_goals = m.home_result then 'inverso'
          else 'fallo'
        end as category
      from predictions pr
      join matches m on m.id = pr.match_id
      where pr.participant_id = v_pid
      order by m.kickoff asc
    ) t
  );
end; $$;
