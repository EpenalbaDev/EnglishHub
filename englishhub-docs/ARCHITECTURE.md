# HavenLanguage — Arquitectura & Overview del Proyecto

> Plataforma para profesores de inglés independientes.
> Gestión de estudiantes, lecciones interactivas, tareas, pagos y agenda.
> Multi-tenant ready desde el día 1.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16+ |
| UI | Tailwind CSS + shadcn/ui | Latest |
| Base de datos | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth (email + magic link) | — |
| Storage | Supabase Storage | — |
| Pronunciación | Web Speech API (nativo browser) | — |
| AI (resúmenes) | Anthropic Claude API | claude-sonnet-4-5-20250929 |
| Icons | lucide-react | Latest |
| Fonts | DM Serif Display + DM Sans | Google Fonts |
| Deploy | Vercel | — |

---

## Estructura de Carpetas

```
englishhub/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + main layout
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── students/
│   │   │   │   ├── page.tsx            # Lista de estudiantes
│   │   │   │   └── [id]/page.tsx       # Detalle estudiante
│   │   │   ├── lessons/
│   │   │   │   ├── page.tsx            # Lista de lecciones
│   │   │   │   ├── new/page.tsx        # Builder de lección
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Detalle/editar lección
│   │   │   │       └── present/page.tsx # Modo presentación
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx            # Lista de tareas
│   │   │   │   ├── new/page.tsx        # Crear tarea
│   │   │   │   └── [id]/page.tsx       # Ver resultados
│   │   │   ├── payments/
│   │   │   │   └── page.tsx            # Gestión de pagos
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx            # Agenda
│   │   │   └── settings/
│   │   │       └── page.tsx            # Config del tutor
│   │   ├── (public)/
│   │   │   ├── assignment/
│   │   │   │   └── [token]/page.tsx    # Tarea pública (sin login)
│   │   │   └── student/
│   │   │       ├── login/page.tsx      # Login estudiante
│   │   │       └── dashboard/page.tsx  # Portal del estudiante
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── summary/route.ts    # Generar resumen con AI
│   │   │   └── webhooks/
│   │   │       └── supabase/route.ts
│   │   ├── layout.tsx                  # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── students/
│   │   │   ├── StudentCard.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   └── StudentTable.tsx
│   │   ├── lessons/
│   │   │   ├── LessonBuilder.tsx
│   │   │   ├── SectionEditor.tsx
│   │   │   ├── PresentationView.tsx
│   │   │   └── PronunciationButton.tsx
│   │   ├── assignments/
│   │   │   ├── AssignmentBuilder.tsx
│   │   │   ├── ExerciseRenderer.tsx
│   │   │   └── PublicAssignment.tsx
│   │   ├── payments/
│   │   │   ├── PaymentTable.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── calendar/
│   │   │   └── CalendarView.tsx
│   │   └── shared/
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSkeleton.tsx
│   │       ├── StatsCard.tsx
│   │       ├── SearchBar.tsx
│   │       └── ConfirmDialog.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server client
│   │   │   ├── middleware.ts            # Auth middleware
│   │   │   └── admin.ts                # Service role client
│   │   ├── ai/
│   │   │   └── summary.ts              # Claude API integration
│   │   ├── speech/
│   │   │   └── pronunciation.ts        # Web Speech API wrapper
│   │   ├── utils.ts                    # Helpers generales
│   │   └── constants.ts                # App constants
│   ├── hooks/
│   │   ├── useStudents.ts
│   │   ├── useLessons.ts
│   │   ├── usePayments.ts
│   │   ├── useCalendar.ts
│   │   └── usePronunciation.ts
│   └── types/
│       ├── database.ts                 # Types generados de Supabase
│       └── app.ts                      # Types de la app
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── .env.local.example
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Modelo de Datos (PostgreSQL / Supabase)

### Diagrama de Relaciones

```
tutors (1) ──── (N) students
tutors (1) ──── (N) lessons
tutors (1) ──── (N) scheduled_classes
lessons (1) ──── (N) lesson_sections
lessons (1) ──── (N) assignments
assignments (1) ──── (N) assignment_exercises
assignments (1) ──── (N) assignment_submissions
students (1) ──── (N) assignment_submissions
students (1) ──── (N) payments
students (1) ──── (N) scheduled_classes
lessons (1) ──── (N) lesson_summaries
```

### Tablas

#### `tutors`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE
email           TEXT NOT NULL
full_name       TEXT NOT NULL
phone           TEXT
avatar_url      TEXT
business_name   TEXT              -- "Miss Ana English Academy"
timezone        TEXT DEFAULT 'America/Panama'
settings        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `students`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE
auth_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL  -- nullable, login opcional
full_name       TEXT NOT NULL
email           TEXT
phone           TEXT
avatar_url      TEXT
status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial'))
level           TEXT CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced'))
notes           TEXT
monthly_rate    DECIMAL(10,2)     -- tarifa mensual acordada
enrollment_date DATE DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `lessons`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE
title           TEXT NOT NULL
description     TEXT
category        TEXT              -- 'grammar', 'vocabulary', 'conversation', 'reading', 'writing'
level           TEXT CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced'))
tags            TEXT[]
cover_image_url TEXT
is_published    BOOLEAN DEFAULT false
order_index     INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `lesson_sections`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE
title           TEXT NOT NULL
type            TEXT NOT NULL CHECK (type IN ('intro', 'vocabulary', 'grammar', 'exercise', 'pronunciation', 'reading', 'custom'))
content         JSONB NOT NULL    -- estructura flexible según el tipo
order_index     INTEGER NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**JSONB content por tipo de sección:**

```jsonc
// type: "vocabulary"
{
  "words": [
    { "word": "accomplish", "translation": "lograr", "phonetic": "/əˈkɑːm.plɪʃ/", "example": "She accomplished her goal.", "image_url": null }
  ]
}

// type: "grammar"
{
  "explanation": "The present perfect is used for...",
  "formula": "Subject + have/has + past participle",
  "examples": [
    { "sentence": "I have visited Paris.", "highlight": "have visited" }
  ]
}

// type: "exercise"
{
  "instructions": "Fill in the blanks with the correct form.",
  "questions": [
    { "type": "fill_blank", "sentence": "She ___ (go) to the store.", "answer": "has gone", "options": ["has gone", "went", "goes"] }
  ]
}

// type: "pronunciation"
{
  "words": [
    { "word": "through", "phonetic": "/θruː/", "audio_url": null, "tips": "Tongue between teeth for 'th'" }
  ]
}

// type: "intro" | "reading" | "custom"
{
  "html_content": "<p>Rich text content here...</p>",
  "image_url": null
}
```

#### `assignments`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE
lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL
title           TEXT NOT NULL
description     TEXT
public_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')  -- para link público
is_active       BOOLEAN DEFAULT true
due_date        TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `assignment_exercises`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE
type            TEXT NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'free_text', 'pronunciation'))
question        TEXT NOT NULL
options         JSONB             -- opciones para multiple_choice, matching pairs, etc.
correct_answer  JSONB NOT NULL    -- respuesta(s) correcta(s)
points          INTEGER DEFAULT 1
order_index     INTEGER NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `assignment_submissions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE
student_id      UUID REFERENCES students(id) ON DELETE SET NULL
student_name    TEXT              -- para submissions sin login
student_email   TEXT              -- para submissions sin login
answers         JSONB NOT NULL    -- { exercise_id: answer }
score           DECIMAL(5,2)
max_score       DECIMAL(5,2)
submitted_at    TIMESTAMPTZ DEFAULT now()
```

#### `payments`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE
student_id      UUID REFERENCES students(id) ON DELETE CASCADE
amount          DECIMAL(10,2) NOT NULL
currency        TEXT DEFAULT 'USD'
payment_date    DATE NOT NULL
period_start    DATE              -- período que cubre
period_end      DATE
method          TEXT CHECK (method IN ('cash', 'transfer', 'yappy', 'nequi', 'card', 'other'))
status          TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled'))
notes           TEXT
receipt_url     TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `scheduled_classes`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE
student_id      UUID REFERENCES students(id) ON DELETE SET NULL
lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL
title           TEXT NOT NULL
start_time      TIMESTAMPTZ NOT NULL
end_time        TIMESTAMPTZ NOT NULL
location        TEXT              -- 'zoom', 'presencial', link de meet, etc.
status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
notes           TEXT
recurrence_rule TEXT              -- iCal RRULE para clases recurrentes
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `lesson_summaries`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE
tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE
content         TEXT NOT NULL     -- resumen generado por AI
key_points      JSONB             -- puntos clave extraídos
examples        JSONB             -- ejemplos generados
is_edited       BOOLEAN DEFAULT false
share_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

---

## Row Level Security (RLS)

Cada tabla tiene RLS habilitado. Política base:

```sql
-- Tutores solo ven sus propios datos
CREATE POLICY "tutor_isolation" ON students
  FOR ALL USING (tutor_id = (SELECT id FROM tutors WHERE auth_id = auth.uid()));

-- Estudiantes ven solo sus propios datos
CREATE POLICY "student_own_data" ON assignment_submissions
  FOR SELECT USING (student_id = (SELECT id FROM students WHERE auth_id = auth.uid()));

-- Acceso público para tareas por token
CREATE POLICY "public_assignment_access" ON assignments
  FOR SELECT USING (is_active = true AND public_token IS NOT NULL);
```

---

## Roles de Usuario

| Rol | Auth | Acceso |
|---|---|---|
| Tutor | Email + password | Dashboard completo, CRUD todo |
| Estudiante (con cuenta) | Email + magic link | Portal estudiante: ver progreso, tareas, pagos |
| Estudiante (sin cuenta) | Sin auth | Solo acceso a tarea pública por link/token |

---

## API Routes

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/ai/summary` | POST | Genera resumen de lección con Claude |

> Nota: La mayoría de operaciones CRUD se hacen directamente con Supabase client-side (con RLS). Las API routes son solo para operaciones que necesitan server-side processing (AI, webhooks).

---

## Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Fases de Implementación

- **Fase 0:** Setup del proyecto (Next.js, Supabase, Tailwind, shadcn, design system)
- **Fase 1:** Auth + Estudiantes + Pagos
- **Fase 2:** Lecciones (builder + secciones + pronunciación + modo presentación)
- **Fase 3:** Tareas (builder + link público + submissions + resumen AI)
- **Fase 4:** Calendario + Dashboard + Portal estudiante

Cada fase tiene su propio documento MD con instrucciones detalladas.
