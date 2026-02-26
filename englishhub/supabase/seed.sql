-- Nota: Ejecutar después de crear un usuario de prueba via auth
-- Reemplazar 'AUTH_USER_ID' con el UUID real del usuario de prueba

-- Si ya existe el tutor (creado por trigger), obtener su ID:
-- SELECT id FROM tutors WHERE auth_id = 'AUTH_USER_ID';

-- Estudiantes de ejemplo (reemplazar TUTOR_ID con el UUID real)
INSERT INTO students (tutor_id, full_name, email, phone, status, level, monthly_rate) VALUES
  ('TUTOR_ID', 'María García', 'maria@email.com', '+507-6000-1234', 'active', 'intermediate', 80.00),
  ('TUTOR_ID', 'Carlos López', 'carlos@email.com', '+507-6000-5678', 'active', 'beginner', 60.00),
  ('TUTOR_ID', 'Ana Rodríguez', 'ana@email.com', NULL, 'trial', 'elementary', NULL),
  ('TUTOR_ID', 'Pedro Martínez', 'pedro@email.com', '+507-6000-9012', 'active', 'advanced', 100.00),
  ('TUTOR_ID', 'Sofía Chen', 'sofia@email.com', '+507-6000-3456', 'inactive', 'upper_intermediate', 80.00);

-- Pagos de ejemplo (reemplazar STUDENT_IDs reales después de insertar estudiantes)
-- INSERT INTO payments (tutor_id, student_id, amount, payment_date, period_start, period_end, method, status) VALUES
--   ('TUTOR_ID', 'STUDENT_1_ID', 80.00, '2026-02-01', '2026-02-01', '2026-02-28', 'transfer', 'paid'),
--   ('TUTOR_ID', 'STUDENT_2_ID', 60.00, '2026-02-05', '2026-02-01', '2026-02-28', 'yappy', 'paid'),
--   ('TUTOR_ID', 'STUDENT_4_ID', 100.00, '2026-02-01', '2026-02-01', '2026-02-28', 'cash', 'pending');
