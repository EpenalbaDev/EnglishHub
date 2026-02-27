-- ============================================
-- STUDENT ACCESS LINKS (teacher-generated login links)
-- ============================================

CREATE TABLE student_access_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  last_used_at  TIMESTAMPTZ,
  use_count     INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_access_links_student_id ON student_access_links(student_id);
CREATE INDEX idx_student_access_links_tutor_id ON student_access_links(tutor_id);
CREATE INDEX idx_student_access_links_expires_at ON student_access_links(expires_at);

ALTER TABLE student_access_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_access_links_tutor_isolation" ON student_access_links
  FOR ALL
  USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()))
  WITH CHECK (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));
