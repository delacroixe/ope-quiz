-- OPE Quiz – Supabase schema
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query

-- 1. Perfiles de usuario (nombre, fecha examen, meta diaria)
create table public.profiles (
  id            uuid references auth.users on delete cascade not null primary key,
  nombre        text,
  fecha_examen  date,
  meta_diaria   integer,
  updated_at    timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Perfil propio" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 2. Estadísticas por pregunta
create table public.question_stats (
  user_id     uuid references auth.users on delete cascade not null,
  question_id integer not null,
  vistas      integer not null default 0,
  correctas   integer not null default 0,
  fallos      integer not null default 0,
  primary key (user_id, question_id)
);
alter table public.question_stats enable row level security;
create policy "Stats propias" on public.question_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Historial de sesiones
create table public.sessions (
  id        uuid default gen_random_uuid() primary key,
  user_id   uuid references auth.users on delete cascade not null,
  date      timestamptz not null,
  total     integer not null,
  score     integer not null,
  bloque    text,
  modo      text
);
alter table public.sessions enable row level security;
create policy "Sesiones propias" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
