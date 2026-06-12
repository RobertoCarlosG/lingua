-- Lingua: Auth + Row Level Security
-- Ejecutar en el SQL editor de tu proyecto Supabase DESPUÉS de 001_initial.sql

-- ───────────────────────────────────────────
-- 1. Limpiar datos de demo (no hay datos reales que preservar)
-- ───────────────────────────────────────────
DELETE FROM reviews        WHERE user_id = 'demo-user';
DELETE FROM session_logs   WHERE user_id = 'demo-user';
DELETE FROM error_entries  WHERE user_id = 'demo-user';
DELETE FROM lessons        WHERE user_id = 'demo-user';
DELETE FROM vocab_words    WHERE user_id = 'demo-user';

-- ───────────────────────────────────────────
-- 2. Cambiar user_id de text → uuid en todas las tablas
--    y establecer auth.uid() como default
-- ───────────────────────────────────────────
ALTER TABLE vocab_words
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE reviews
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE error_entries
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE session_logs
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE lessons
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

-- ───────────────────────────────────────────
-- 3. Habilitar Row Level Security
-- ───────────────────────────────────────────
ALTER TABLE vocab_words   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons       ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────
-- 4. Policies: cada usuario solo ve y modifica sus propios datos
-- ───────────────────────────────────────────

-- vocab_words
CREATE POLICY "vocab_words: own rows" ON vocab_words
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- reviews
CREATE POLICY "reviews: own rows" ON reviews
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- error_entries
CREATE POLICY "error_entries: own rows" ON error_entries
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- session_logs
CREATE POLICY "session_logs: own rows" ON session_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- lessons
CREATE POLICY "lessons: own rows" ON lessons
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────
-- 5. Índice en user_id para queries rápidas
-- ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vocab_words_user_id_idx   ON vocab_words(user_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx        ON reviews(user_id);
CREATE INDEX IF NOT EXISTS error_entries_user_id_idx  ON error_entries(user_id);
CREATE INDEX IF NOT EXISTS session_logs_user_id_idx   ON session_logs(user_id);
CREATE INDEX IF NOT EXISTS lessons_user_id_idx        ON lessons(user_id);
