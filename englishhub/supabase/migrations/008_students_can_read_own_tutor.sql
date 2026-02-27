-- ============================================
-- STUDENTS CAN READ THEIR OWN TUTOR PROFILE
-- ============================================

DROP POLICY IF EXISTS "tutors_students_read_own_tutor" ON tutors;

CREATE POLICY "tutors_students_read_own_tutor" ON tutors
  FOR SELECT
  USING (
    id IN (
      SELECT s.tutor_id
      FROM students s
      WHERE s.auth_id = auth.uid()
    )
  );
