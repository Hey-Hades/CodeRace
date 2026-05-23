create table if not exists problems (
  id text primary key,
  title text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  statement text not null,
  input_format text not null,
  output_format text not null,
  examples jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  source text not null default 'local',
  source_url text,
  test_cases jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  problem_id text not null,
  problem_title text not null,
  difficulty text not null,
  status text not null default 'finished',
  winner_player_id text,
  winner_name text,
  started_at timestamptz,
  ended_at timestamptz not null default now(),
  review text,
  created_at timestamptz not null default now()
);

create table if not exists match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id text not null,
  name text not null,
  score integer not null default 0,
  passed_tests integer not null default 0,
  total_tests integer not null default 0,
  hints_used integer not null default 0,
  hint_penalty integer not null default 0,
  submissions integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  player_id text not null,
  player_name text not null,
  problem_id text not null,
  language text not null,
  code text not null,
  passed_tests integer not null default 0,
  total_tests integer not null default 0,
  status text not null,
  accepted boolean not null default false,
  judge_source text not null default 'local',
  error text,
  created_at timestamptz not null default now()
);

create table if not exists ai_hints (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  player_id text not null,
  player_name text not null,
  problem_id text not null,
  hint_type text not null,
  penalty integer not null,
  hint text not null,
  created_at timestamptz not null default now()
);

create index if not exists matches_room_code_idx on matches(room_code);
create index if not exists submissions_room_code_idx on submissions(room_code);
create index if not exists ai_hints_room_code_idx on ai_hints(room_code);
