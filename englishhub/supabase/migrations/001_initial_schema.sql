-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TUTORS
-- ============================================
CREATE TABLE tutors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  business_name   TEXT,
  timezone        TEXT DEFAULT 'America/Panama',
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutors_own_data" ON tutors
  FOR ALL USING (auth_id = auth.uid());

-- ============================================
-- STUDENTS
-- ============================================
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  auth_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
  level           TEXT CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced')),
  notes           TEXT,
  monthly_rate    DECIMAL(10,2),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_tutor_isolation" ON students
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

-- Index para queries frecuentes
CREATE INDEX idx_students_tutor_id ON students(tutor_id);
CREATE INDEX idx_students_status ON students(status);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  payment_date    DATE NOT NULL,
  period_start    DATE,
  period_end      DATE,
  method          TEXT CHECK (method IN ('cash', 'transfer', 'yappy', 'nequi', 'card', 'other')),
  status          TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  notes           TEXT,
  receipt_url     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_tutor_isolation" ON payments
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

CREATE INDEX idx_payments_tutor_id ON payments(tutor_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- ============================================
-- FUNCTION: Auto-create tutor on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tutors (auth_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_tutors
  BEFORE UPDATE ON tutors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_students
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
