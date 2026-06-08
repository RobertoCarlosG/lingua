-- Lingua: Supabase migration
-- Ejecutar en el SQL editor de tu proyecto Supabase

-- Vocabulary words
create table if not exists vocab_words (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-user',
  language text not null check (language in ('en', 'pt')),
  word text not null,
  translation text not null,
  ipa text,
  definition text,
  example_sentence text,
  status text not null default 'new' check (status in ('new', 'learning', 'known', 'mastered')),
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  tags text[] default '{}',
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Error bank
create table if not exists error_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-user',
  language text not null check (language in ('en', 'pt')),
  error_text text not null,
  correction text not null,
  explanation text,
  category text not null default 'gramática',
  is_recurring boolean not null default false,
  occurrence_count integer not null default 1,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Session logs
create table if not exists session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-user',
  language text not null check (language in ('en', 'pt')),
  date date not null default current_date,
  duration_minutes integer not null default 60,
  activities text[] default '{}',
  words_reviewed integer not null default 0,
  errors_made integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- Lessons (YAML content)
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-user',
  language text not null check (language in ('en', 'pt')),
  title text not null,
  yaml_content text not null,
  rendered_at timestamptz,
  created_at timestamptz not null default now()
);

-- Row Level Security (opcional para demo, activar con auth real)
-- alter table vocab_words enable row level security;
-- alter table error_entries enable row level security;
-- alter table session_logs enable row level security;
-- alter table lessons enable row level security;

-- Índices de performance
create index if not exists vocab_words_language_idx on vocab_words(language);
create index if not exists vocab_words_status_idx on vocab_words(status);
create index if not exists error_entries_language_idx on error_entries(language);
create index if not exists error_entries_recurring_idx on error_entries(is_recurring);
create index if not exists lessons_language_idx on lessons(language);
