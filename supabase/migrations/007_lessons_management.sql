-- Lingua: gestión de lecciones — status y sort_order
-- Ejecutar en el SQL editor de Supabase

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  ADD COLUMN IF NOT EXISTS sort_order integer;

-- Índices para filtrar por estado y ordenar rápidamente
CREATE INDEX IF NOT EXISTS lessons_status_idx ON lessons(status);
CREATE INDEX IF NOT EXISTS lessons_sort_order_idx ON lessons(sort_order);
