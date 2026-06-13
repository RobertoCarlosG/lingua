-- Lingua: japonés + permisos explícitos para roles de Supabase
-- Ejecutar en el SQL editor DESPUÉS de 003_more_languages.sql

ALTER TABLE vocab_words
  DROP CONSTRAINT IF EXISTS vocab_words_language_check;
ALTER TABLE vocab_words
  ADD CONSTRAINT vocab_words_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it', 'ja'));

ALTER TABLE error_entries
  DROP CONSTRAINT IF EXISTS error_entries_language_check;
ALTER TABLE error_entries
  ADD CONSTRAINT error_entries_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it', 'ja'));

ALTER TABLE session_logs
  DROP CONSTRAINT IF EXISTS session_logs_language_check;
ALTER TABLE session_logs
  ADD CONSTRAINT session_logs_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it', 'ja'));

ALTER TABLE lessons
  DROP CONSTRAINT IF EXISTS lessons_language_check;
ALTER TABLE lessons
  ADD CONSTRAINT lessons_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it', 'ja'));

-- Sin estos GRANT, inserts autenticados pueden devolver 403 aunque RLS esté bien
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
