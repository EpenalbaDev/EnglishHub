-- ============================================
-- SCHEDULED CLASSES
-- ============================================
CREATE TABLE scheduled_classes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES students(id) ON DELETE SET NULL,
  lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  location        TEXT,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes           TEXT,
  recurrence_rule TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_tutor" ON scheduled_classes
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

-- Estudiante logueado ve sus propias clases
CREATE POLICY "classes_student_own" ON scheduled_classes
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE auth_id = auth.uid())
  );

CREATE INDEX idx_classes_tutor ON scheduled_classes(tutor_id);
CREATE INDEX idx_classes_student ON scheduled_classes(student_id);
CREATE INDEX idx_classes_start ON scheduled_classes(start_time);
CREATE INDEX idx_classes_status ON scheduled_classes(status);

CREATE TRIGGER set_updated_at_classes
  BEFORE UPDATE ON scheduled_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
