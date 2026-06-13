-- Lingua: restaurar políticas RLS (idempotente)
-- Ejecutar si Supabase muestra:
--   "RLS is enabled for this table, but no policies are set"
--   o error: operator does not exist: uuid = text
--
-- Seguro de ejecutar más de una vez.

-- ── 1. Limpiar filas demo (001 usaba user_id = 'demo-user' como text) ──
DELETE FROM reviews        WHERE user_id::text = 'demo-user';
DELETE FROM session_logs   WHERE user_id::text = 'demo-user';
DELETE FROM error_entries  WHERE user_id::text = 'demo-user';
DELETE FROM lessons        WHERE user_id::text = 'demo-user';
DELETE FROM vocab_words    WHERE user_id::text = 'demo-user';

-- ── 2. Migrar user_id text → uuid si 002 no se aplicó ──
DO $migrate$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['vocab_words', 'reviews', 'error_entries', 'session_logs', 'lessons']
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'user_id'
        AND data_type IN ('text', 'character varying')
    ) THEN
      -- Quitar default 'demo-user' (text) antes de cambiar el tipo
      EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id DROP DEFAULT', tbl);
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN user_id TYPE uuid USING user_id::uuid',
        tbl
      );
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN user_id SET DEFAULT auth.uid(), '
        'ALTER COLUMN user_id SET NOT NULL',
        tbl
      );
    END IF;
  END LOOP;
END
$migrate$;

-- ── 3. Permisos de tabla (anon + authenticated) ──
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ── 4. Asegurar RLS activo ──
ALTER TABLE vocab_words   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons       ENABLE ROW LEVEL SECURITY;

-- ── 5. Quitar políticas viejas y nuevas (nombres de 002 y 005) ──
DROP POLICY IF EXISTS "vocab_words: own rows"   ON vocab_words;
DROP POLICY IF EXISTS "vocab_words_select"      ON vocab_words;
DROP POLICY IF EXISTS "vocab_words_insert"      ON vocab_words;
DROP POLICY IF EXISTS "vocab_words_update"      ON vocab_words;
DROP POLICY IF EXISTS "vocab_words_delete"      ON vocab_words;

DROP POLICY IF EXISTS "reviews: own rows"         ON reviews;
DROP POLICY IF EXISTS "reviews_select"            ON reviews;
DROP POLICY IF EXISTS "reviews_insert"            ON reviews;
DROP POLICY IF EXISTS "reviews_update"            ON reviews;
DROP POLICY IF EXISTS "reviews_delete"            ON reviews;

DROP POLICY IF EXISTS "error_entries: own rows"   ON error_entries;
DROP POLICY IF EXISTS "error_entries_select"      ON error_entries;
DROP POLICY IF EXISTS "error_entries_insert"      ON error_entries;
DROP POLICY IF EXISTS "error_entries_update"      ON error_entries;
DROP POLICY IF EXISTS "error_entries_delete"      ON error_entries;

DROP POLICY IF EXISTS "session_logs: own rows"    ON session_logs;
DROP POLICY IF EXISTS "session_logs_select"       ON session_logs;
DROP POLICY IF EXISTS "session_logs_insert"       ON session_logs;
DROP POLICY IF EXISTS "session_logs_update"       ON session_logs;
DROP POLICY IF EXISTS "session_logs_delete"       ON session_logs;

DROP POLICY IF EXISTS "lessons: own rows"         ON lessons;
DROP POLICY IF EXISTS "lessons_select"            ON lessons;
DROP POLICY IF EXISTS "lessons_insert"            ON lessons;
DROP POLICY IF EXISTS "lessons_update"            ON lessons;
DROP POLICY IF EXISTS "lessons_delete"            ON lessons;

-- ── 6. Crear políticas por operación (rol authenticated) ──

-- vocab_words
CREATE POLICY "vocab_words_select" ON vocab_words FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "vocab_words_insert" ON vocab_words FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vocab_words_update" ON vocab_words FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vocab_words_delete" ON vocab_words FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- reviews
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- error_entries
CREATE POLICY "error_entries_select" ON error_entries FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "error_entries_insert" ON error_entries FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "error_entries_update" ON error_entries FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "error_entries_delete" ON error_entries FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- session_logs
CREATE POLICY "session_logs_select" ON session_logs FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "session_logs_insert" ON session_logs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "session_logs_update" ON session_logs FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "session_logs_delete" ON session_logs FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- lessons
CREATE POLICY "lessons_select" ON lessons FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "lessons_insert" ON lessons FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lessons_update" ON lessons FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lessons_delete" ON lessons FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
