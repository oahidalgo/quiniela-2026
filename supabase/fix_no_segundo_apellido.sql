-- ============================================================
-- Quita la lógica de "segundo apellido"
-- Identidad única = (nombre, apellido). Si choca → NAME_TAKEN.
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1) Unicidad solo por (nombre, apellido)
drop index if exists participants_name_unique;
create unique index if not exists participants_name_unique
  on participants (lower(nombre), lower(apellido));

-- 2) register_participant sin segundo apellido
drop function if exists register_participant(text, text, text, text) cascade;
drop function if exists register_participant(text, text, text) cascade;

create or replace function register_participant(
  p_nombre   text,
  p_apellido text,
  p_pin      text
) returns jsonb language plpgsql security definer as $$
declare
  v_id    uuid;
  v_token text;
  v_name  text;
begin
  if trim(p_nombre) = '' or trim(p_apellido) = '' then
    raise exception 'INVALID_NAME';
  end if;
  if p_pin !~ '^\d{4,6}$' then
    raise exception 'INVALID_PIN';
  end if;

  if exists (
    select 1 from participants
     where lower(nombre)   = lower(trim(p_nombre))
       and lower(apellido) = lower(trim(p_apellido))
  ) then
    raise exception 'NAME_TAKEN';
  end if;

  insert into participants (nombre, apellido, pin_hash)
  values (trim(p_nombre), trim(p_apellido), crypt(p_pin, gen_salt('bf')))
  returning id into v_id;

  v_name := trim(p_nombre) || ' ' || trim(p_apellido);

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into sessions (token, participant_id) values (v_token, v_id);

  return jsonb_build_object(
    'token', v_token,
    'participant_id', v_id,
    'name', v_name,
    'is_admin', false
  );
end; $$;

-- 3) login_participant sin segundo apellido
drop function if exists login_participant(text, text, text, text) cascade;
drop function if exists login_participant(text, text, text) cascade;

create or replace function login_participant(
  p_nombre   text,
  p_apellido text,
  p_pin      text
) returns jsonb language plpgsql security definer as $$
declare
  v_id    uuid;
  v_token text;
  v_name  text;
  v_admin boolean;
begin
  select id, is_admin, nombre || ' ' || apellido
    into v_id, v_admin, v_name
    from participants
   where lower(nombre)   = lower(trim(p_nombre))
     and lower(apellido) = lower(trim(p_apellido))
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
