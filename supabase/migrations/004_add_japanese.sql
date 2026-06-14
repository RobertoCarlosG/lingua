-- Lingua: agrega japonés (ja) al CHECK de language
-- Ejecutar DESPUÉS de 003_more_languages.sql

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
