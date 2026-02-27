-- ============================================
-- SUPER ADMIN RBAC + TUTOR SUBSCRIPTIONS
-- ============================================

CREATE TABLE admin_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_roles_self_read" ON admin_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE TABLE tutor_subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id               UUID NOT NULL UNIQUE REFERENCES tutors(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro')),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  trial_ends_at          TIMESTAMPTZ,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tutor_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_subscriptions_tutor_read" ON tutor_subscriptions
  FOR SELECT USING (
    tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid())
  );

CREATE POLICY "tutor_subscriptions_super_admin_all" ON tutor_subscriptions
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "tutors_super_admin_read" ON tutors
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "tutors_super_admin_update" ON tutors
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

INSERT INTO tutor_subscriptions (tutor_id, plan, status)
SELECT id, 'trial', 'active'
FROM tutors
ON CONFLICT (tutor_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_tutor_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tutor_subscriptions (tutor_id, plan, status)
  VALUES (NEW.id, 'trial', 'active')
  ON CONFLICT (tutor_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tutor_created_subscription
  AFTER INSERT ON tutors
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tutor_subscription();

CREATE INDEX idx_tutor_subscriptions_plan ON tutor_subscriptions(plan);
CREATE INDEX idx_tutor_subscriptions_status ON tutor_subscriptions(status);

CREATE TRIGGER set_updated_at_tutor_subscriptions
  BEFORE UPDATE ON tutor_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
