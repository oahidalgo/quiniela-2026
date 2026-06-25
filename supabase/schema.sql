-- ============================================================
-- QUINIELA MUNDIAL 2026 — Schema completo
-- Pegar en Supabase > SQL Editor > New query > Run
-- ============================================================

-- ============================================================
-- 1. TABLAS
-- ============================================================

create table if not exists participants (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  apellido    text not null,
  segundo_apellido text,
  pin_hash    text not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Unicidad: (nombre, apellido, segundo_apellido) case-insensitive
create unique index if not exists participants_name_unique
  on participants (lower(nombre), lower(apellido), coalesce(lower(segundo_apellido), ''));

create table if not exists sessions (
  token       text primary key,
  participant_id uuid not null references participants(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  created_at  timestamptz not null default now()
);

create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  stage       text not null,          -- '16vos','8vos','4tos','semifinal','3erlugar','final'
  home_team   text not null,
  away_team   text not null,
  home_flag   text,                   -- código flagcdn, ej: 'ar', 'gb-eng'
  away_flag   text,
  stadium     text,
  city        text,
  country     text,
  kickoff     timestamptz not null,
  home_result int,                    -- null = pendiente
  away_result int,
  created_at  timestamptz not null default now()
);

create table if not exists predictions (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references participants(id) on delete cascade,
  match_id        uuid not null references matches(id) on delete cascade,
  home_goals      int not null check (home_goals between 0 and 99),
  away_goals      int not null check (away_goals between 0 and 99),
  points          int,
  category        text,               -- 'exacto','ganador','inverso','fallo' o null
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (participant_id, match_id)
);

-- ============================================================
-- 2. RLS: activado pero sin políticas → tablas bloqueadas
--    Todo acceso va por funciones SECURITY DEFINER
-- ============================================================

alter table participants enable row level security;
alter table sessions     enable row level security;
alter table matches      enable row level security;
alter table predictions  enable row level security;

-- ============================================================
-- 3. HELPERS INTERNOS
-- ============================================================

-- Puntaje 5/3/1
create or replace function score_prediction(
  ph int, pa int, rh int, ra int,
  out points int, out category text
) language plpgsql immutable as $$
begin
  if rh is null or ra is null then points := 0; category := null; return; end if;
  if ph = rh and pa = ra        then points := 5; category := 'exacto';  return; end if;
  if sign(ph-pa)::int = sign(rh-ra)::int
                                then points := 3; category := 'ganador'; return; end if;
  if ph = ra and pa = rh        then points := 1; category := 'inverso'; return; end if;
  points := 0; category := 'fallo';
end; $$;

-- Cierre del partido (1 hora antes del kickoff)
create or replace function match_closing(p_kickoff timestamptz)
returns timestamptz language sql immutable as $$
  select p_kickoff - interval '1 hour';
$$;

-- Valida token y devuelve participant_id (lanza error si inválido)
create or replace function resolve_token(p_token text)
returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  select participant_id into v_id
    from sessions
   where token = p_token and expires_at > now();
  if v_id is null then
    raise exception 'SESSION_INVALID';
  end if;
  return v_id;
end; $$;

-- ============================================================
-- 4. AUTH
-- ============================================================

-- register_participant
create or replace function register_participant(
  p_nombre            text,
  p_apellido          text,
  p_pin               text,
  p_segundo_apellido  text default null
) returns jsonb language plpgsql security definer as $$
declare
  v_id      uuid;
  v_token   text;
  v_name    text;
  v_clash   boolean;
begin
  -- Validaciones básicas
  if trim(p_nombre) = '' or trim(p_apellido) = '' then
    raise exception 'INVALID_NAME';
  end if;
  if p_pin !~ '^\d{4,6}$' then
    raise exception 'INVALID_PIN';
  end if;

  -- ¿Choque de nombre+apellido?
  select exists(
    select 1 from participants
     where lower(nombre) = lower(trim(p_nombre))
       and lower(apellido) = lower(trim(p_apellido))
  ) into v_clash;

  if v_clash then
    if p_segundo_apellido is null or trim(p_segundo_apellido) = '' then
      raise exception 'SECOND_LASTNAME_REQUIRED';
    end if;
    -- Verificar terna completa
    if exists(
      select 1 from participants
       where lower(nombre)           = lower(trim(p_nombre))
         and lower(apellido)         = lower(trim(p_apellido))
         and lower(segundo_apellido) = lower(trim(p_segundo_apellido))
    ) then
      raise exception 'NAME_TAKEN';
    end if;
  end if;

  -- Insertar
  insert into participants (nombre, apellido, segundo_apellido, pin_hash)
  values (
    trim(p_nombre),
    trim(p_apellido),
    nullif(trim(coalesce(p_segundo_apellido,'')), ''),
    crypt(p_pin, gen_salt('bf'))
  )
  returning id into v_id;

  -- Nombre para mostrar
  select case when segundo_apellido is not null
              then nombre || ' ' || apellido || ' ' || segundo_apellido
              else nombre || ' ' || apellido end
    into v_name from participants where id = v_id;

  -- Sesión
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into sessions (token, participant_id) values (v_token, v_id);

  return jsonb_build_object(
    'token', v_token,
    'participant_id', v_id,
    'name', v_name,
    'is_admin', false
  );
end; $$;

-- login_participant
create or replace function login_participant(
  p_nombre            text,
  p_apellido          text,
  p_pin               text,
  p_segundo_apellido  text default null
) returns jsonb language plpgsql security definer as $$
declare
  v_id      uuid;
  v_token   text;
  v_name    text;
  v_admin   boolean;
  v_count   int;
begin
  -- ¿Cuántos con ese nombre+apellido?
  select count(*) into v_count
    from participants
   where lower(nombre)   = lower(trim(p_nombre))
     and lower(apellido) = lower(trim(p_apellido));

  if v_count = 0 then
    raise exception 'BAD_CREDENTIALS';
  end if;

  if v_count > 1 and (p_segundo_apellido is null or trim(p_segundo_apellido) = '') then
    raise exception 'SECOND_LASTNAME_REQUIRED';
  end if;

  -- Buscar el participante exacto con PIN correcto
  select id, is_admin,
         case when segundo_apellido is not null
              then nombre || ' ' || apellido || ' ' || segundo_apellido
              else nombre || ' ' || apellido end
    into v_id, v_admin, v_name
    from participants
   where lower(nombre)   = lower(trim(p_nombre))
     and lower(apellido) = lower(trim(p_apellido))
     and (
       p_segundo_apellido is null
       or lower(coalesce(segundo_apellido,'')) = lower(trim(p_segundo_apellido))
     )
     and pin_hash = crypt(p_pin, pin_hash);

  if v_id is null then
    raise exception 'BAD_CREDENTIALS';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into sessions (token, participant_id) values (v_token, v_id);

  return jsonb_build_object(
    'token', v_token,
    'participant_id', v_id,
    'name', v_name,
    'is_admin', v_admin
  );
end; $$;

-- logout_participant
create or replace function logout_participant(p_token text)
returns void language plpgsql security definer as $$
begin
  delete from sessions where token = p_token;
end; $$;

-- ============================================================
-- 5. PARTIDOS
-- ============================================================

create or replace function get_matches()
returns jsonb language plpgsql security definer as $$
begin
  return (
    select coalesce(jsonb_agg(row_to_json(t)), '[]')
    from (
      select id, stage, home_team, away_team, home_flag, away_flag,
             stadium, city, country, kickoff, home_result, away_result
        from matches
       order by kickoff asc
    ) t
  );
end; $$;

create or replace function get_match(p_match_id uuid)
returns jsonb language plpgsql security definer as $$
declare v jsonb;
begin
  select row_to_json(t) into v
    from (
      select id, stage, home_team, away_team, home_flag, away_flag,
             stadium, city, country, kickoff, home_result, away_result
        from matches where id = p_match_id
    ) t;
  if v is null then raise exception 'NOT_FOUND'; end if;
  return v;
end; $$;

-- ============================================================
-- 6. PRONÓSTICOS
-- ============================================================

create or replace function save_prediction(
  p_token    text,
  p_match_id uuid,
  p_home     int,
  p_away     int
) returns jsonb language plpgsql security definer as $$
declare
  v_pid     uuid;
  v_kickoff timestamptz;
begin
  v_pid := resolve_token(p_token);

  select kickoff into v_kickoff from matches where id = p_match_id;
  if v_kickoff is null then raise exception 'NOT_FOUND'; end if;

  -- Validar cierre
  if now() >= match_closing(v_kickoff) then
    raise exception 'CLOSED';
  end if;

  -- Validar rango
  if p_home < 0 or p_home > 99 or p_away < 0 or p_away > 99 then
    raise exception 'INVALID_GOALS';
  end if;

  insert into predictions (participant_id, match_id, home_goals, away_goals)
  values (v_pid, p_match_id, p_home, p_away)
  on conflict (participant_id, match_id)
  do update set home_goals = excluded.home_goals,
                away_goals = excluded.away_goals,
                updated_at = now();

  return jsonb_build_object('ok', true);
end; $$;

create or replace function get_my_predictions(p_token text)
returns jsonb language plpgsql security definer as $$
declare v_pid uuid;
begin
  v_pid := resolve_token(p_token);
  return (
    select coalesce(jsonb_agg(row_to_json(t) order by m.kickoff asc), '[]')
    from predictions pr
    join matches m on m.id = pr.match_id
    cross join lateral score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result) s
    join (select * from predictions) t on false
    -- reescrito como subquery limpia:
    where pr.participant_id = v_pid
  );
end; $$;

-- Reescritura limpia de get_my_predictions
create or replace function get_my_predictions(p_token text)
returns jsonb language plpgsql security definer as $$
declare v_pid uuid;
begin
  v_pid := resolve_token(p_token);
  return (
    select coalesce(jsonb_agg(row_to_json(t) order by t.kickoff asc), '[]')
    from (
      select m.id as match_id,
             m.stage, m.home_team, m.away_team, m.kickoff,
             m.home_result, m.away_result,
             pr.home_goals as home_pred, pr.away_goals as away_pred,
             (score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result)).points,
             (score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result)).category
        from predictions pr
        join matches m on m.id = pr.match_id
       where pr.participant_id = v_pid
       order by m.kickoff asc
    ) t
  );
end; $$;

-- get_match_predictions (anti-copia: solo si cerró)
create or replace function get_match_predictions(p_token text, p_match_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_pid     uuid;
  v_kickoff timestamptz;
  v_hr      int;
  v_ar      int;
begin
  v_pid := resolve_token(p_token);

  select kickoff, home_result, away_result
    into v_kickoff, v_hr, v_ar
    from matches where id = p_match_id;

  if v_kickoff is null then raise exception 'NOT_FOUND'; end if;

  -- Anti-copia: solo visible si cerró (1h antes) o ya tiene resultado
  if now() < match_closing(v_kickoff) and v_hr is null then
    raise exception 'NOT_CLOSED';
  end if;

  return jsonb_build_object(
    'match', jsonb_build_object(
      'id', p_match_id,
      'home_team', (select home_team from matches where id = p_match_id),
      'away_team', (select away_team from matches where id = p_match_id),
      'home_result', v_hr,
      'away_result', v_ar
    ),
    'predictions', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.points desc nulls last, t.name asc), '[]')
      from (
        select case when pa.segundo_apellido is not null
                    then pa.nombre || ' ' || pa.apellido || ' ' || pa.segundo_apellido
                    else pa.nombre || ' ' || pa.apellido end as name,
               pr.home_goals as home_pred, pr.away_goals as away_pred,
               (score_prediction(pr.home_goals, pr.away_goals, v_hr, v_ar)).points,
               (score_prediction(pr.home_goals, pr.away_goals, v_hr, v_ar)).category
          from predictions pr
          join participants pa on pa.id = pr.participant_id
         where pr.match_id = p_match_id
      ) t
    )
  );
end; $$;

-- ============================================================
-- 7. TABLA DE POSICIONES
-- ============================================================

create or replace function get_standings()
returns jsonb language plpgsql security definer as $$
begin
  return (
    select coalesce(jsonb_agg(row_to_json(t)), '[]')
    from (
      select dense_rank() over (order by total_points desc)::int as lugar,
             name, total_points, exact_count, winner_count, inverse_count, predicted_count
      from (
        select case when pa.segundo_apellido is not null
                    then pa.nombre || ' ' || pa.apellido || ' ' || pa.segundo_apellido
                    else pa.nombre || ' ' || pa.apellido end as name,
               coalesce(sum(
                 (score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result)).points
               ), 0)::int as total_points,
               count(*) filter (
                 where (score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result)).category = 'exacto'
               )::int as exact_count,
               count(*) filter (
                 where (score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result)).category = 'ganador'
               )::int as winner_count,
               count(*) filter (
                 where (score_prediction(pr.home_goals, pr.away_goals, m.home_result, m.away_result)).category = 'inverso'
               )::int as inverse_count,
               count(pr.id)::int as predicted_count
          from participants pa
          left join predictions pr on pr.participant_id = pa.id
          left join matches m on m.id = pr.match_id
         group by pa.id, pa.nombre, pa.apellido, pa.segundo_apellido
      ) sub
      order by total_points desc, exact_count desc, name asc
    ) t
  );
end; $$;

-- ============================================================
-- 8. ADMIN
-- ============================================================

-- Helper: verifica que el token sea de un admin
create or replace function require_admin(p_token text)
returns uuid language plpgsql security definer as $$
declare
  v_pid   uuid;
  v_admin boolean;
begin
  v_pid := resolve_token(p_token);
  select is_admin into v_admin from participants where id = v_pid;
  if not coalesce(v_admin, false) then
    raise exception 'NOT_ADMIN';
  end if;
  return v_pid;
end; $$;

-- Recalcular puntos de un partido (llamado internamente)
create or replace function recalc_match(p_match_id uuid)
returns void language plpgsql security definer as $$
declare
  v_hr int; v_ar int;
begin
  select home_result, away_result into v_hr, v_ar from matches where id = p_match_id;
  update predictions
     set points   = (score_prediction(home_goals, away_goals, v_hr, v_ar)).points,
         category = (score_prediction(home_goals, away_goals, v_hr, v_ar)).category
   where match_id = p_match_id;
end; $$;

-- admin_set_result
create or replace function admin_set_result(
  p_token    text,
  p_match_id uuid,
  p_home     int,
  p_away     int
) returns jsonb language plpgsql security definer as $$
begin
  perform require_admin(p_token);
  if p_home is null or p_away is null then raise exception 'RESULT_REQUIRED'; end if;
  update matches set home_result = p_home, away_result = p_away where id = p_match_id;
  perform recalc_match(p_match_id);
  return jsonb_build_object('ok', true);
end; $$;

-- admin_create_match
create or replace function admin_create_match(
  p_token    text,
  p_stage    text,
  p_home_team text, p_away_team text,
  p_home_flag text default null, p_away_flag text default null,
  p_stadium   text default null, p_city text default null, p_country text default null,
  p_kickoff   timestamptz default null
) returns jsonb language plpgsql security definer as $$
declare v_id uuid;
begin
  perform require_admin(p_token);
  insert into matches (stage, home_team, away_team, home_flag, away_flag, stadium, city, country, kickoff)
  values (p_stage, p_home_team, p_away_team, p_home_flag, p_away_flag, p_stadium, p_city, p_country, p_kickoff)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

-- admin_update_match
create or replace function admin_update_match(
  p_token     text,
  p_match_id  uuid,
  p_stage     text default null,
  p_home_team text default null, p_away_team text default null,
  p_home_flag text default null, p_away_flag text default null,
  p_stadium   text default null, p_city text default null, p_country text default null,
  p_kickoff   timestamptz default null
) returns jsonb language plpgsql security definer as $$
begin
  perform require_admin(p_token);
  update matches set
    stage      = coalesce(p_stage, stage),
    home_team  = coalesce(p_home_team, home_team),
    away_team  = coalesce(p_away_team, away_team),
    home_flag  = coalesce(p_home_flag, home_flag),
    away_flag  = coalesce(p_away_flag, away_flag),
    stadium    = coalesce(p_stadium, stadium),
    city       = coalesce(p_city, city),
    country    = coalesce(p_country, country),
    kickoff    = coalesce(p_kickoff, kickoff)
  where id = p_match_id;
  return jsonb_build_object('ok', true);
end; $$;

-- admin_delete_match
create or replace function admin_delete_match(p_token text, p_match_id uuid)
returns jsonb language plpgsql security definer as $$
begin
  perform require_admin(p_token);
  delete from matches where id = p_match_id;
  return jsonb_build_object('ok', true);
end; $$;

-- admin_list_participants
create or replace function admin_list_participants(p_token text)
returns jsonb language plpgsql security definer as $$
begin
  perform require_admin(p_token);
  return (
    select coalesce(jsonb_agg(row_to_json(t) order by t.nombre asc), '[]')
    from (
      select id,
             case when segundo_apellido is not null
                  then nombre || ' ' || apellido || ' ' || segundo_apellido
                  else nombre || ' ' || apellido end as name,
             nombre, apellido, segundo_apellido, is_admin, created_at
        from participants
    ) t
  );
end; $$;

-- admin_delete_participant
create or replace function admin_delete_participant(p_token text, p_participant_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_admin_id uuid;
begin
  v_admin_id := require_admin(p_token);
  if p_participant_id = v_admin_id then
    raise exception 'CANNOT_DELETE_SELF';
  end if;
  delete from participants where id = p_participant_id;
  return jsonb_build_object('ok', true);
end; $$;

-- admin_recalculate (todo el torneo)
create or replace function admin_recalculate(p_token text)
returns jsonb language plpgsql security definer as $$
declare v_match record;
begin
  perform require_admin(p_token);
  for v_match in select id from matches where home_result is not null loop
    perform recalc_match(v_match.id);
  end loop;
  return jsonb_build_object('ok', true);
end; $$;

-- admin_reset
create or replace function admin_reset(p_token text, p_delete_participants boolean default false)
returns jsonb language plpgsql security definer as $$
declare v_admin_id uuid;
begin
  v_admin_id := require_admin(p_token);
  -- Borrar resultados
  update matches set home_result = null, away_result = null;
  -- Borrar pronósticos
  delete from predictions;
  -- Resetear puntos no es necesario (predictions ya borradas)
  if p_delete_participants then
    -- Borrar todos excepto el admin actual
    delete from participants where id <> v_admin_id;
  end if;
  return jsonb_build_object('ok', true);
end; $$;

-- ============================================================
-- 9. CREAR ADMIN (ejecutar UNA sola vez manualmente)
-- ============================================================
-- Descomentiá y ajustá con tu nombre real, luego volvé a comentar:

-- insert into participants (nombre, apellido, pin_hash, is_admin)
-- values ('Admin', 'Quiniela', crypt('1234', gen_salt('bf')), true);

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
