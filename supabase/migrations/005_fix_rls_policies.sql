-- Lingua: políticas RLS explícitas para rol authenticated
-- Ejecutar DESPUÉS de 004_ja_and_grants.sql
--
-- Reemplaza políticas "FOR ALL" genéricas por operaciones separadas
-- con (select auth.uid()) — patrón recomendado por Supabase.

DROP POLICY IF EXISTS "vocab_words: own rows" ON vocab_words;
DROP POLICY IF EXISTS "reviews: own rows" ON reviews;
DROP POLICY IF EXISTS "error_entries: own rows" ON error_entries;
DROP POLICY IF EXISTS "session_logs: own rows" ON session_logs;
DROP POLICY IF EXISTS "lessons: own rows" ON lessons;

-- vocab_words
CREATE POLICY "vocab_words_select" ON vocab_words FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "vocab_words_insert" ON vocab_words FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vocab_words_update" ON vocab_words FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vocab_words_delete" ON vocab_words FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- reviews
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- error_entries
CREATE POLICY "error_entries_select" ON error_entries FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "error_entries_insert" ON error_entries FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "error_entries_update" ON error_entries FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "error_entries_delete" ON error_entries FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- session_logs
CREATE POLICY "session_logs_select" ON session_logs FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "session_logs_insert" ON session_logs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "session_logs_update" ON session_logs FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "session_logs_delete" ON session_logs FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- lessons
CREATE POLICY "lessons_select" ON lessons FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "lessons_insert" ON lessons FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lessons_update" ON lessons FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lessons_delete" ON lessons FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
