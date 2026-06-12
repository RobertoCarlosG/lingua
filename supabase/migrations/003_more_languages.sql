-- Lingua: idiomas de aprendizaje adicionales
-- Ejecutar en el SQL editor de Supabase DESPUÉS de 002_auth_rls.sql
--
-- Amplía el CHECK de `language` para aceptar futuros idiomas sin nueva
-- migración. La validación efectiva de qué idiomas están habilitados vive en
-- el registro de la app (frontend/src/lib/languages.ts y su espejo en
-- backend/app/lesson_validator.py); la BD solo acota a códigos conocidos.

ALTER TABLE vocab_words
  DROP CONSTRAINT IF EXISTS vocab_words_language_check;
ALTER TABLE vocab_words
  ADD CONSTRAINT vocab_words_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it'));

ALTER TABLE error_entries
  DROP CONSTRAINT IF EXISTS error_entries_language_check;
ALTER TABLE error_entries
  ADD CONSTRAINT error_entries_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it'));

ALTER TABLE session_logs
  DROP CONSTRAINT IF EXISTS session_logs_language_check;
ALTER TABLE session_logs
  ADD CONSTRAINT session_logs_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it'));

ALTER TABLE lessons
  DROP CONSTRAINT IF EXISTS lessons_language_check;
ALTER TABLE lessons
  ADD CONSTRAINT lessons_language_check
  CHECK (language IN ('en', 'pt', 'fr', 'de', 'it'));
