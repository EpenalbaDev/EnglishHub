# Fase 3 — Tareas Compartibles + Resumen AI Post-Clase

> **Objetivo:** La profesora puede crear tareas, compartirlas por link, los estudiantes las completan (con o sin login), y al terminar una clase puede generar un resumen AI de la lección.
> **Pre-requisito:** Fase 2 completada.
> **Leer ANTES:** `DESIGN_SYSTEM.md`

---

## Base de Datos — Migración

### `supabase/migrations/003_assignments_summaries.sql`

```sql
-- ============================================
-- ASSIGNMENTS
-- ============================================
CREATE TABLE assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  public_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active       BOOLEAN DEFAULT true,
  due_date        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Tutor ve sus propias tareas
CREATE POLICY "assignments_tutor_isolation" ON assignments
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

-- Acceso público para ver tareas activas por token (SELECT only)
CREATE POLICY "assignments_public_by_token" ON assignments
  FOR SELECT USING (is_active = true AND public_token IS NOT NULL);

CREATE INDEX idx_assignments_tutor ON assignments(tutor_id);
CREATE INDEX idx_assignments_token ON assignments(public_token);
CREATE INDEX idx_assignments_lesson ON assignments(lesson_id);

-- ============================================
-- ASSIGNMENT EXERCISES
-- ============================================
CREATE TABLE assignment_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'free_text', 'pronunciation')),
  question        TEXT NOT NULL,
  options         JSONB,
  correct_answer  JSONB NOT NULL,
  points          INTEGER DEFAULT 1,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assignment_exercises ENABLE ROW LEVEL SECURITY;

-- Tutor CRUD
CREATE POLICY "exercises_tutor" ON assignment_exercises
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

-- Público puede ver ejercicios de tareas activas
CREATE POLICY "exercises_public" ON assignment_exercises
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE is_active = true AND public_token IS NOT NULL
    )
  );

CREATE INDEX idx_exercises_assignment ON assignment_exercises(assignment_id);

-- ============================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================
CREATE TABLE assignment_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name    TEXT,
  student_email   TEXT,
  answers         JSONB NOT NULL DEFAULT '{}',
  score           DECIMAL(5,2),
  max_score       DECIMAL(5,2),
  submitted_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Tutor ve submissions de sus tareas
CREATE POLICY "submissions_tutor" ON assignment_submissions
  FOR SELECT USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

-- Cualquiera puede INSERT (submit público)
CREATE POLICY "submissions_public_insert" ON assignment_submissions
  FOR INSERT WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments WHERE is_active = true
    )
  );

-- Estudiante logueado ve sus propias submissions
CREATE POLICY "submissions_student_own" ON assignment_submissions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE auth_id = auth.uid()
    )
  );

CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);

-- ============================================
-- LESSON SUMMARIES
-- ============================================
CREATE TABLE lesson_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  content         TEXT NOT NULL,
  key_points      JSONB,
  examples        JSONB,
  is_edited       BOOLEAN DEFAULT false,
  share_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lesson_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summaries_tutor" ON lesson_summaries
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

-- Público puede ver resúmenes compartidos
CREATE POLICY "summaries_public" ON lesson_summaries
  FOR SELECT USING (share_token IS NOT NULL);

CREATE INDEX idx_summaries_lesson ON lesson_summaries(lesson_id);

-- Triggers
CREATE TRIGGER set_updated_at_assignments
  BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_summaries
  BEFORE UPDATE ON lesson_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Types

### Agregar a `src/types/database.ts`

```ts
export interface Assignment {
  id: string
  tutor_id: string
  lesson_id: string | null
  title: string
  description: string | null
  public_token: string
  is_active: boolean
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface AssignmentExercise {
  id: string
  assignment_id: string
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'free_text' | 'pronunciation'
  question: string
  options: any
  correct_answer: any
  points: number
  order_index: number
  created_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string | null
  student_name: string | null
  student_email: string | null
  answers: Record<string, any>
  score: number | null
  max_score: number | null
  submitted_at: string
}

export interface LessonSummary {
  id: string
  lesson_id: string
  tutor_id: string
  content: string
  key_points: string[] | null
  examples: { sentence: string; explanation: string }[] | null
  is_edited: boolean
  share_token: string
  created_at: string
  updated_at: string
}

// Joins
export interface AssignmentWithExercises extends Assignment {
  exercises: AssignmentExercise[]
}

export interface AssignmentWithResults extends Assignment {
  exercises: AssignmentExercise[]
  submissions: AssignmentSubmission[]
}
```

---

## Módulo de Tareas (Tutor Side)

### Página: Lista de Tareas — `src/app/(dashboard)/assignments/page.tsx`

**Layout:**
- Header: "Tareas" + botón "Nueva Tarea" (btn-primary)
- Grid de cards (similar a lecciones):
  - Título
  - Lección asociada (si hay)
  - Due date
  - Status badge (Activa/Inactiva)
  - Conteo de submissions / ejercicios
  - Botón copiar link (icono Link)
  - Menú: Editar, Ver resultados, Copiar link, Desactivar, Eliminar

### Página: Builder de Tarea — `src/app/(dashboard)/assignments/new/page.tsx`

**Layout:**
- Top: título (editable) + descripción + seleccionar lección asociada (optional) + due date
- Si se asocia una lección, ofrecer botón "Auto-generar ejercicios desde la lección" (usa el contenido de las secciones para pre-crear ejercicios)
- Lista de ejercicios:
  - Cada ejercicio es un card editable
  - Tipo selector (multiple_choice, fill_blank, true_false, matching, free_text, pronunciation)
  - Campos dinámicos por tipo:
    - **multiple_choice**: pregunta + 4 opciones + marcar correcta
    - **fill_blank**: frase con ___ + respuesta correcta
    - **true_false**: statement + true/false
    - **matching**: pares (drag? o inputs pareados)
    - **free_text**: pregunta + respuesta sugerida (corrección manual)
    - **pronunciation**: palabra/frase a pronunciar
  - Drag to reorder o botones up/down
  - Puntos por ejercicio
- Botón "Publicar tarea" → genera/muestra el link compartible
- Sección de link: mostrar URL con botón copiar y botón compartir por WhatsApp

**Compartir por WhatsApp:**
```ts
const shareUrl = `https://wa.me/?text=${encodeURIComponent(`📚 Tarea: ${title}\n${assignmentUrl}`)}`
```

### Página: Ver Resultados — `src/app/(dashboard)/assignments/[id]/page.tsx`

**Layout:**
- Info de la tarea arriba
- Stats: total submissions, promedio score, mejor score
- Tabla de submissions:
  - Estudiante (nombre o "Anónimo")
  - Score (con barra visual %)
  - Fecha de envío
  - Botón ver detalle
- Detalle de submission: mostrar cada pregunta con la respuesta del estudiante, si es correcta o no, y la respuesta correcta

---

## Tarea Pública (Student Side)

### Página: `src/app/(public)/assignment/[token]/page.tsx`

**IMPORTANTE:** Esta página NO requiere autenticación. Acceso por token.

**Layout diferente al dashboard — diseño limpio y enfocado:**
- Fondo: neutral-50
- Card centrada (max-width 720px)
- Header: título de la tarea + nombre del tutor/academia + due date
- Formulario de identificación (antes de empezar):
  - Nombre* (input)
  - Email (input, opcional — si tiene cuenta, puede loguearse)
  - Botón "Comenzar tarea"
- Ejercicios uno a la vez (wizard/stepper) o todos en scroll:
  - Renderizar según tipo con UI limpia
  - Multiple choice: radio buttons estilizados
  - Fill blank: input inline en la frase
  - True/false: dos botones grandes
  - Free text: textarea
  - Pronunciation: botón grabar (si browser soporta) o solo botón de escuchar modelo
- Barra de progreso arriba (X de Y completados)
- Botón "Enviar tarea" al final
- Pantalla de confirmación: "¡Tarea enviada!" + score si se puede calcular automáticamente
- Si el ejercicio tiene auto-grading (todo menos free_text), calcular score inmediatamente

**Auto-grading:**
```ts
function gradeSubmission(exercises: AssignmentExercise[], answers: Record<string, any>) {
  let score = 0
  let maxScore = 0

  exercises.forEach(ex => {
    maxScore += ex.points
    if (ex.type === 'free_text') return // manual grading

    const studentAnswer = answers[ex.id]
    const correct = ex.correct_answer

    if (ex.type === 'fill_blank') {
      // Case-insensitive comparison, trim whitespace
      if (studentAnswer?.toLowerCase().trim() === correct?.toLowerCase().trim()) {
        score += ex.points
      }
    } else {
      // Direct comparison for multiple_choice, true_false, matching
      if (JSON.stringify(studentAnswer) === JSON.stringify(correct)) {
        score += ex.points
      }
    }
  })

  return { score, maxScore }
}
```

---

## Resumen AI Post-Clase

### API Route: `src/app/api/ai/summary/route.ts`

```ts
/**
 * POST /api/ai/summary
 * Body: { lessonId: string }
 *
 * 1. Verificar autenticación (solo tutor puede generar)
 * 2. Obtener lección con todas sus secciones
 * 3. Construir prompt con el contenido de la lección
 * 4. Llamar a Anthropic Claude API (claude-sonnet-4-5-20250929)
 * 5. Parsear respuesta y guardar en lesson_summaries
 * 6. Retornar el resumen generado
 */
```

**Prompt para Claude:**

```
You are an English teacher's assistant. Based on the following lesson content, generate a class summary that the teacher can share with students after the lesson.

LESSON: {title}
LEVEL: {level}

CONTENT:
{secciones formateadas con tipo y contenido}

Generate:
1. A brief, friendly summary of what was covered in class (2-3 paragraphs, in English)
2. Key points to remember (5-8 bullet points)
3. 3-5 practical examples with explanations

Format your response as JSON:
{
  "content": "The summary text...",
  "key_points": ["point 1", "point 2", ...],
  "examples": [
    { "sentence": "example sentence", "explanation": "why this is important" }
  ]
}
```

### UI del Resumen — En la página de detalle de lección

**Botón "Generar Resumen de Clase"** (btn-accent con Sparkles icon):
- Click → loading state con animación
- Muestra el resumen generado en un panel/card
- Editable: la profesora puede modificar el texto generado
- Botones:
  - "Regenerar" (refresh icon)
  - "Guardar cambios" (si editó)
  - "Copiar" (al clipboard)
  - "Compartir por WhatsApp"
  - "Compartir link" (genera link público con share_token)

**Página pública del resumen:** `src/app/(public)/summary/[token]/page.tsx`
- Diseño limpio, tipo blog post
- Header con título de la lección
- Resumen en texto formateado
- Key points en cards
- Ejemplos con highlight
- Footer: "Creado con EnglishHub"

---

## Hooks

### `src/hooks/useAssignments.ts`

```ts
// - assignments: Assignment[]
// - createAssignment(data): Promise<Assignment>
// - updateAssignment(id, data): Promise<void>
// - addExercise(assignmentId, exercise): Promise<void>
// - updateExercise(id, data): Promise<void>
// - deleteExercise(id): Promise<void>
// - reorderExercises(assignmentId, orderedIds): Promise<void>
// - toggleActive(id): Promise<void>
// - getShareUrl(token): string
// - getResults(assignmentId): Promise<AssignmentWithResults>
```

---

## Verificación de la Fase 3

Al completar esta fase:

- [ ] Tablas `assignments`, `assignment_exercises`, `assignment_submissions`, `lesson_summaries` creadas con RLS
- [ ] Builder de tareas funcional con todos los tipos de ejercicios
- [ ] Asociar tarea a lección (opcional)
- [ ] Link público compartible funcional
- [ ] Página pública de tarea: identificación + ejercicios + submit
- [ ] Auto-grading funcional
- [ ] Copiar link y compartir por WhatsApp
- [ ] Ver resultados/submissions de una tarea
- [ ] Generar resumen AI post-clase con Claude
- [ ] Editar resumen generado
- [ ] Compartir resumen por link y WhatsApp
- [ ] RLS correcto: público puede ver/submit tareas activas, solo tutor ve resultados
- [ ] Design System aplicado consistentemente

---

## Siguiente: Fase 4

Proceder a `FASE_4_CALENDAR_PORTAL.md`
