-- Cambia el cierre de pronósticos a 1 minuto antes del kickoff.
-- Ejecutar en Supabase > SQL Editor.

create or replace function match_closing(p_kickoff timestamptz)
returns timestamptz language sql immutable as $$
  select p_kickoff - interval '1 minute';
$$;
