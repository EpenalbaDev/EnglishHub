-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  level           TEXT CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced')),
  tags            TEXT[],
  cover_image_url TEXT,
  is_published    BOOLEAN DEFAULT false,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_tutor_isolation" ON lessons
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

CREATE INDEX idx_lessons_tutor_id ON lessons(tutor_id);

-- ============================================
-- LESSON SECTIONS
-- ============================================
CREATE TABLE lesson_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('intro', 'vocabulary', 'grammar', 'exercise', 'pronunciation', 'reading', 'custom')),
  content         JSONB NOT NULL DEFAULT '{}',
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sections_via_lesson" ON lesson_sections
  FOR ALL USING (
    lesson_id IN (
      SELECT id FROM lessons WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

CREATE INDEX idx_sections_lesson_id ON lesson_sections(lesson_id);
CREATE INDEX idx_sections_order ON lesson_sections(lesson_id, order_index);

-- Triggers
CREATE TRIGGER set_updated_at_lessons
  BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_sections
  BEFORE UPDATE ON lesson_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
