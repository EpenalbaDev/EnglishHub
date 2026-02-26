-- ============================================
-- ASSIGNMENTS: AUDIENCE + TIMING
-- ============================================
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all_active_students'
    CHECK (audience IN ('all_active_students', 'selected_students')),
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER
    CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assignments_audience ON assignments(audience);
CREATE INDEX IF NOT EXISTS idx_assignments_available_until ON assignments(available_until);

-- ============================================
-- ASSIGNMENT RECIPIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_recipients (
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  PRIMARY KEY (assignment_id, student_id)
);

ALTER TABLE assignment_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipients_tutor_manage" ON assignment_recipients;
CREATE POLICY "recipients_tutor_manage" ON assignment_recipients
  FOR ALL
  USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "recipients_student_view" ON assignment_recipients;
CREATE POLICY "recipients_student_view" ON assignment_recipients
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_assignment_recipients_assignment ON assignment_recipients(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_recipients_student ON assignment_recipients(student_id);

-- ============================================
-- SUBMISSIONS TRACEABILITY
-- ============================================
ALTER TABLE assignment_submissions
  ADD COLUMN IF NOT EXISTS is_guest_submission BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Keep recipient status in sync when a linked student submits.
CREATE OR REPLACE FUNCTION mark_assignment_recipient_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NOT NULL THEN
    UPDATE assignment_recipients
    SET status = 'completed'
    WHERE assignment_id = NEW.assignment_id
      AND student_id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_assignment_recipient_completed ON assignment_submissions;
CREATE TRIGGER set_assignment_recipient_completed
  AFTER INSERT ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION mark_assignment_recipient_completed();
