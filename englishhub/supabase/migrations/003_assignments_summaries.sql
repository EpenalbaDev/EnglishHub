-- ============================================
-- ASSIGNMENTS
-- ============================================
CREATE TABLE assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  public_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active       BOOLEAN DEFAULT true,
  due_date        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_tutor_isolation" ON assignments
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

CREATE POLICY "assignments_public_by_token" ON assignments
  FOR SELECT USING (is_active = true AND public_token IS NOT NULL);

CREATE INDEX idx_assignments_tutor ON assignments(tutor_id);
CREATE INDEX idx_assignments_token ON assignments(public_token);
CREATE INDEX idx_assignments_lesson ON assignments(lesson_id);

-- ============================================
-- ASSIGNMENT EXERCISES
-- ============================================
CREATE TABLE assignment_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'free_text', 'pronunciation')),
  question        TEXT NOT NULL,
  options         JSONB,
  correct_answer  JSONB NOT NULL,
  points          INTEGER DEFAULT 1,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assignment_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_tutor" ON assignment_exercises
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "exercises_public" ON assignment_exercises
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE is_active = true AND public_token IS NOT NULL
    )
  );

CREATE INDEX idx_exercises_assignment ON assignment_exercises(assignment_id);

-- ============================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================
CREATE TABLE assignment_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name    TEXT,
  student_email   TEXT,
  answers         JSONB NOT NULL DEFAULT '{}',
  score           DECIMAL(5,2),
  max_score       DECIMAL(5,2),
  submitted_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_tutor" ON assignment_submissions
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "submissions_public_insert" ON assignment_submissions
  FOR INSERT WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments WHERE is_active = true
    )
  );

CREATE POLICY "submissions_student_own" ON assignment_submissions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE auth_id = auth.uid()
    )
  );

CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);

-- ============================================
-- LESSON SUMMARIES
-- ============================================
CREATE TABLE lesson_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  content         TEXT NOT NULL,
  key_points      JSONB,
  examples        JSONB,
  is_edited       BOOLEAN DEFAULT false,
  share_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lesson_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summaries_tutor" ON lesson_summaries
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

CREATE POLICY "summaries_public" ON lesson_summaries
  FOR SELECT USING (share_token IS NOT NULL);

CREATE INDEX idx_summaries_lesson ON lesson_summaries(lesson_id);

-- Triggers
CREATE TRIGGER set_updated_at_assignments
  BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_summaries
  BEFORE UPDATE ON lesson_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
