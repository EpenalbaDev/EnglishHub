-- ============================================
-- FIX: prevent student auth users from becoming tutors
-- ============================================

-- Student accounts are created via magic links and should not receive
-- a row in public.tutors. Keep tutor auto-provisioning for normal signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tutor') = 'student' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tutors (auth_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
