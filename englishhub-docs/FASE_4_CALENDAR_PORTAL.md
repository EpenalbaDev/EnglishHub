# Fase 4 — Calendario + Dashboard Completo + Portal del Estudiante

> **Objetivo:** Agenda de clases funcional, dashboard con datos reales, y portal donde estudiantes logueados ven su progreso.
> **Pre-requisito:** Fase 3 completada.
> **Leer ANTES:** `DESIGN_SYSTEM.md`

---

## Base de Datos — Migración

### `supabase/migrations/004_scheduled_classes.sql`

```sql
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
```

---

## Types

### Agregar a `src/types/database.ts`

```ts
export interface ScheduledClass {
  id: string
  tutor_id: string
  student_id: string | null
  lesson_id: string | null
  title: string
  start_time: string
  end_time: string
  location: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledClassWithDetails extends ScheduledClass {
  student: Pick<Student, 'id' | 'full_name' | 'email'> | null
  lesson: Pick<Lesson, 'id' | 'title'> | null
}
```

---

## Módulo de Calendario

### Página: `src/app/(dashboard)/calendar/page.tsx`

**Layout:**
- Header: "Agenda" + botón "Nueva Clase" (btn-primary)
- Vista toggle: Semana | Mes (default: semana)
- Navegación: ← Anterior | Hoy | Siguiente →

**Vista Semanal:**
- Grid de 7 columnas (Lun-Dom)
- Filas de horas (7am - 9pm)
- Clases como bloques coloreados en la grilla:
  - Color según status: scheduled=primary, completed=success, cancelled=neutral-300, no_show=error
  - Mostrar: hora, título, nombre estudiante
  - Click → abrir detalle/editar

**Vista Mensual:**
- Calendario mensual estándar
- Días con clases tienen dots/indicators
- Click en día → ver clases del día en panel lateral

**No usar librerías de calendario pesadas.** Construir un componente custom simple con CSS grid. Es más flexible y sigue el design system.

### Componente: ClassForm — Modal para crear/editar clase

- Campos:
  - Título* (input, default: "Clase de inglés")
  - Estudiante (select/combobox searchable)
  - Lección asociada (select, opcional)
  - Fecha y hora inicio* (datetime picker)
  - Duración: 30min | 45min | 1hr | 1.5hr | 2hr (select, calcula end_time)
  - Ubicación (input: "Zoom", "Presencial", URL de meet, etc.)
  - Notas (textarea)
  - Recurrencia (opcional): Ninguna | Semanal | Quincenal (genera regla simple)
- Validación: no permitir clases que se superpongan

### Clase completada → Acciones post-clase:
Cuando la profesora marca una clase como "Completada", mostrar opciones:
- "Generar resumen de la lección" (si tiene lección asociada) → Fase 3
- "Crear tarea para el estudiante" → redirige a crear tarea
- "Registrar pago" → abre form de pago con estudiante pre-seleccionado

---

## Dashboard Home (Datos Reales)

### Actualizar `src/app/(dashboard)/page.tsx`

Ahora con queries reales:

**Stats Cards:**
```ts
// Total estudiantes activos
const { count: totalStudents } = await supabase
  .from('students')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active')

// Clases este mes
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
const { count: classesThisMonth } = await supabase
  .from('scheduled_classes')
  .select('*', { count: 'exact', head: true })
  .gte('start_time', startOfMonth)
  .in('status', ['scheduled', 'completed'])

// Pagos pendientes (monto total)
const { data: pendingPayments } = await supabase
  .from('payments')
  .select('amount')
  .eq('status', 'pending')
// Sumar amounts

// Próxima clase
const { data: nextClass } = await supabase
  .from('scheduled_classes')
  .select('*, student:students(full_name)')
  .gte('start_time', new Date().toISOString())
  .eq('status', 'scheduled')
  .order('start_time')
  .limit(1)
  .single()
```

**Secciones del Dashboard:**

1. **Próximas Clases** (lista de las próximas 5 clases):
   - Card compacta: hora, título, estudiante, ubicación
   - Badge de "Hoy" si es hoy
   - Click → ir a calendar

2. **Pagos Pendientes** (alert cards):
   - Lista de estudiantes con pagos pendientes
   - Monto + días de retraso
   - Botón "Registrar pago"

3. **Actividad Reciente** (timeline):
   - Últimas 10 acciones: nuevo estudiante, pago registrado, tarea completada, clase completada
   - Icono + descripción + timestamp relativo ("hace 2 horas")

---

## Portal del Estudiante

### Auth del Estudiante

El estudiante se autentica con **magic link** (email sin password):

1. La profesora agrega el email del estudiante al crear el student record
2. El estudiante recibe un link de la profesora para acceder
3. Primer acceso: magic link al email → se crea auth.user → se vincula student.auth_id
4. Siguientes accesos: magic link o link guardado

### Página Login: `src/app/(public)/student/login/page.tsx`

- Diseño limpio, diferente al login del tutor
- Solo campo de email + botón "Recibir link de acceso"
- Envía magic link via Supabase Auth
- Mensaje de confirmación: "Revisa tu correo"

### Página Dashboard Estudiante: `src/app/(public)/student/dashboard/page.tsx`

**Layout diferente al dashboard del tutor — más simple:**
- Header con nombre del estudiante + academia/tutor name
- Sin sidebar — navegación simple con tabs o cards

**Secciones:**

1. **Mi Progreso** (stats):
   - Clases completadas (total)
   - Tareas completadas + score promedio
   - Nivel actual
   - Racha (clases consecutivas sin faltar)

2. **Próximas Clases**:
   - Lista de clases programadas
   - Fecha, hora, tema

3. **Mis Tareas**:
   - Lista de tareas asignadas
   - Status: Pendiente / Completada
   - Score si ya la hizo
   - Botón "Hacer tarea" → link a la tarea pública

4. **Resúmenes de Clase**:
   - Lista de resúmenes compartidos
   - Click → ver resumen completo

5. **Mis Pagos**:
   - Historial de pagos
   - Status de cada pago
   - Solo lectura (no puede editar)

---

## Hooks

### `src/hooks/useCalendar.ts`

```ts
// - classes: ScheduledClassWithDetails[]
// - loading: boolean
// - currentView: 'week' | 'month'
// - currentDate: Date
// - navigateNext(): void
// - navigatePrev(): void
// - goToToday(): void
// - setView(view): void
// - createClass(data): Promise<ScheduledClass>
// - updateClass(id, data): Promise<void>
// - completeClass(id): Promise<void>
// - cancelClass(id): Promise<void>
// - getClassesForRange(start, end): Promise<ScheduledClassWithDetails[]>
```

---

## Verificación de la Fase 4

Al completar esta fase:

- [ ] Tabla `scheduled_classes` creada con RLS
- [ ] Calendario semanal y mensual funcional
- [ ] Crear, editar, completar, cancelar clases
- [ ] Detección de conflictos de horario
- [ ] Acciones post-clase (generar resumen, crear tarea, registrar pago)
- [ ] Dashboard con datos reales (stats, próximas clases, pagos pendientes, actividad)
- [ ] Login de estudiante con magic link
- [ ] Portal del estudiante con progreso, tareas, resúmenes, pagos
- [ ] Student auth_id vinculado correctamente
- [ ] RLS: estudiante solo ve sus propios datos
- [ ] Responsive completo
- [ ] Design System aplicado en todo

---

## Post-Fase 4: Mejoras Futuras

Una vez las 4 fases estén completas, considerar:

- [ ] Dark mode
- [ ] PWA (installable en mobile)
- [ ] Notificaciones push (recordatorios de clase)
- [ ] Export de reportes (PDF de pagos, progreso de estudiante)
- [ ] Integración con Google Calendar
- [ ] Gamificación (achievements, streaks, XP)
- [ ] Marketplace de lecciones entre tutores
- [ ] Plans & billing (Stripe) para multi-tenant
- [ ] Rich text editor para contenido de lecciones
- [ ] Speech recognition para práctica de pronunciación del estudiante
