# Fase 1 — Gestión de Estudiantes + Pagos

> **Objetivo:** CRUD completo de estudiantes y registro de pagos. La profesora puede crear, editar, eliminar estudiantes y llevar control de sus pagos.
> **Pre-requisito:** Fase 0 completada y verificada.
> **Leer ANTES:** `DESIGN_SYSTEM.md` y `ARCHITECTURE.md`

---

## Base de Datos — Migración

### `supabase/migrations/001_initial_schema.sql`

Crear las siguientes tablas con RLS habilitado:

```sql
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
```

Ejecutar esta migración en Supabase (Dashboard > SQL Editor o via Supabase CLI).

---

## Types

### `src/types/database.ts`

Generar types de Supabase o definir manualmente:

```ts
export interface Tutor {
  id: string
  auth_id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  business_name: string | null
  timezone: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  tutor_id: string
  auth_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  status: 'active' | 'inactive' | 'trial'
  level: 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | null
  notes: string | null
  monthly_rate: number | null
  enrollment_date: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  tutor_id: string
  student_id: string
  amount: number
  currency: string
  payment_date: string
  period_start: string | null
  period_end: string | null
  method: 'cash' | 'transfer' | 'yappy' | 'nequi' | 'card' | 'other' | null
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  notes: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

// Join types
export interface PaymentWithStudent extends Payment {
  student: Pick<Student, 'id' | 'full_name' | 'email'>
}

export interface StudentWithPayments extends Student {
  payments: Payment[]
  last_payment?: Payment
}
```

---

## Módulo de Estudiantes

### Página: Lista de Estudiantes — `src/app/(dashboard)/students/page.tsx`

**Layout:**
- Header: título "Estudiantes" (DM Serif Display) + botón "Nuevo Estudiante" (btn-primary con Plus icon)
- Search bar con filtros: por status (select: todos/activo/inactivo/trial), por nivel (select)
- Tabla con columnas:
  - Avatar (iniciales en circle coloreado según status) + Nombre
  - Email
  - Nivel (badge)
  - Status (badge con color semántico)
  - Tarifa mensual
  - Fecha inscripción
  - Acciones (dropdown: Editar, Ver pagos, Eliminar)
- Empty state si no hay estudiantes: ilustración + "Aún no tienes estudiantes" + botón "Agregar tu primer estudiante"
- Animación: staggered fadeIn en las filas

**Datos:** Query Supabase directo con RLS:
```ts
const { data: students } = await supabase
  .from('students')
  .select('*')
  .order('full_name')
```

### Componente: StudentForm — `src/components/students/StudentForm.tsx`

**Modal o slide panel** para crear/editar estudiante:
- Campos:
  - Nombre completo* (input)
  - Email (input email)
  - Teléfono (input tel)
  - Nivel (select: beginner → advanced)
  - Status (select: active, inactive, trial)
  - Tarifa mensual (input number, con $ prefix)
  - Notas (textarea)
- Botones: Cancelar (btn-secondary) + Guardar (btn-primary)
- Validación: nombre requerido, email formato válido si se ingresa
- Loading state en botón de guardar

### Página: Detalle de Estudiante — `src/app/(dashboard)/students/[id]/page.tsx`

**Layout:**
- Back button ← Estudiantes
- Header card: avatar grande (iniciales), nombre, email, teléfono, nivel badge, status badge
- Botón "Editar" (btn-secondary), "Registrar Pago" (btn-accent)
- Tabs (shadcn Tabs):
  - **Info**: datos del estudiante + notas
  - **Pagos**: tabla de pagos de este estudiante + botón agregar pago
  - **Progreso**: placeholder para fase futura (tareas completadas, lecciones vistas)

---

## Módulo de Pagos

### Página: Pagos — `src/app/(dashboard)/payments/page.tsx`

**Layout:**
- Header: "Pagos" (DM Serif Display) + botón "Registrar Pago" (btn-accent con Plus icon)
- Stats cards en row:
  - Total cobrado este mes (suma de pagos 'paid' del mes actual)
  - Pagos pendientes (count de status 'pending')
  - Estudiantes al día (count de estudiantes con pago del mes actual)
- Filtros: mes/año (date picker), status (select), estudiante (search/select)
- Tabla con columnas:
  - Estudiante (nombre)
  - Monto (formateado como currency)
  - Fecha de pago
  - Período (start - end)
  - Método (badge con icono)
  - Status (badge semántico: paid=success, pending=warning, overdue=error)
  - Acciones (editar, cancelar)

**Datos:**
```ts
const { data: payments } = await supabase
  .from('payments')
  .select('*, student:students(id, full_name, email)')
  .order('payment_date', { ascending: false })
```

### Componente: PaymentForm — `src/components/payments/PaymentForm.tsx`

**Modal** para crear/editar pago:
- Campos:
  - Estudiante* (select/combobox searchable con lista de estudiantes)
  - Monto* (input number con $ prefix, pre-fill con monthly_rate del estudiante seleccionado)
  - Fecha de pago* (date picker)
  - Período: Desde - Hasta (2 date pickers)
  - Método de pago (select: Efectivo, Transferencia, Yappy, Nequi, Tarjeta, Otro)
  - Status (select: Pagado, Pendiente)
  - Notas (textarea)
- Auto-fill: cuando selecciona un estudiante, pre-llenar monto con su `monthly_rate`
- Validación: estudiante + monto + fecha requeridos

---

## Hooks

### `src/hooks/useStudents.ts`

```ts
// Custom hook con:
// - students: Student[]
// - loading: boolean
// - error: string | null
// - createStudent(data): Promise<Student>
// - updateStudent(id, data): Promise<Student>
// - deleteStudent(id): Promise<void>
// - refetch(): void
// Usar supabase client-side con realtime opcional
```

### `src/hooks/usePayments.ts`

```ts
// Custom hook con:
// - payments: PaymentWithStudent[]
// - loading: boolean
// - stats: { totalMonth: number, pending: number, studentsUpToDate: number }
// - createPayment(data): Promise<Payment>
// - updatePayment(id, data): Promise<Payment>
// - cancelPayment(id): Promise<void>
// - filterByMonth(year, month): void
// - filterByStatus(status): void
// - refetch(): void
```

---

## Seed Data (Opcional)

### `supabase/seed.sql`

Crear datos de prueba para desarrollo:

```sql
-- Nota: Ejecutar después de crear un usuario de prueba via auth
-- Reemplazar 'AUTH_USER_ID' con el UUID real del usuario de prueba

-- Si ya existe el tutor (creado por trigger), obtener su ID:
-- SELECT id FROM tutors WHERE auth_id = 'AUTH_USER_ID';

-- Estudiantes de ejemplo
INSERT INTO students (tutor_id, full_name, email, phone, status, level, monthly_rate) VALUES
  ('TUTOR_ID', 'María García', 'maria@email.com', '+507-6000-1234', 'active', 'intermediate', 80.00),
  ('TUTOR_ID', 'Carlos López', 'carlos@email.com', '+507-6000-5678', 'active', 'beginner', 60.00),
  ('TUTOR_ID', 'Ana Rodríguez', 'ana@email.com', NULL, 'trial', 'elementary', NULL),
  ('TUTOR_ID', 'Pedro Martínez', 'pedro@email.com', '+507-6000-9012', 'active', 'advanced', 100.00),
  ('TUTOR_ID', 'Sofía Chen', 'sofia@email.com', '+507-6000-3456', 'inactive', 'upper_intermediate', 80.00);

-- Pagos de ejemplo (reemplazar STUDENT_IDs reales)
-- INSERT INTO payments ...
```

---

## Verificación de la Fase 1

Al completar esta fase, debes tener:

- [ ] Tablas `tutors`, `students`, `payments` creadas con RLS
- [ ] Trigger que crea tutor automáticamente al registrar usuario
- [ ] Trigger de updated_at en todas las tablas
- [ ] Página de lista de estudiantes con búsqueda y filtros
- [ ] Crear, editar, eliminar estudiantes funcional
- [ ] Detalle de estudiante con tabs (Info, Pagos, Progreso placeholder)
- [ ] Página de pagos con stats cards
- [ ] Crear y editar pagos funcional
- [ ] Auto-fill del monto basado en monthly_rate del estudiante
- [ ] Filtros de pagos por mes, status, estudiante
- [ ] Badges de status con colores semánticos correctos
- [ ] Empty states cuando no hay data
- [ ] Loading skeletons mientras carga data
- [ ] Responsive en mobile
- [ ] Todos los componentes siguiendo el Design System

---

## Siguiente: Fase 2

Una vez verificado, proceder a `FASE_2_LESSONS.md`
