-- ============================================
-- FIX: tutors RLS recursion with students lookup
-- ============================================

-- The previous tutors policy queried students, while students policy
-- queries tutors, creating an infinite recursion cycle.

DROP POLICY IF EXISTS "tutors_students_read_own_tutor" ON tutors;

CREATE OR REPLACE FUNCTION public.student_belongs_to_tutor(target_tutor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.auth_id = auth.uid()
      AND s.tutor_id = target_tutor_id
  );
$$;

CREATE POLICY "tutors_students_read_own_tutor" ON tutors
  FOR SELECT
  USING (public.student_belongs_to_tutor(id));
