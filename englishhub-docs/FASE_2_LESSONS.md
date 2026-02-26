# Fase 2 — Lecciones: Builder + Pronunciación + Modo Presentación

> **Objetivo:** La profesora puede crear lecciones con secciones interactivas (vocabulario con pronunciación, gramática, ejercicios), y presentarlas en modo fullscreen durante la clase.
> **Pre-requisito:** Fase 1 completada y verificada.
> **Leer ANTES:** `DESIGN_SYSTEM.md` (especialmente la sección "Modo Presentación")

---

## Base de Datos — Migración

### `supabase/migrations/002_lessons.sql`

```sql
-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  level           TEXT CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced')),
  tags            TEXT[],
  cover_image_url TEXT,
  is_published    BOOLEAN DEFAULT false,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_tutor_isolation" ON lessons
  FOR ALL USING (tutor_id IN (SELECT id FROM tutors WHERE auth_id = auth.uid()));

CREATE INDEX idx_lessons_tutor_id ON lessons(tutor_id);

-- ============================================
-- LESSON SECTIONS
-- ============================================
CREATE TABLE lesson_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('intro', 'vocabulary', 'grammar', 'exercise', 'pronunciation', 'reading', 'custom')),
  content         JSONB NOT NULL DEFAULT '{}',
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sections_via_lesson" ON lesson_sections
  FOR ALL USING (
    lesson_id IN (
      SELECT id FROM lessons WHERE tutor_id IN (
        SELECT id FROM tutors WHERE auth_id = auth.uid()
      )
    )
  );

CREATE INDEX idx_sections_lesson_id ON lesson_sections(lesson_id);
CREATE INDEX idx_sections_order ON lesson_sections(lesson_id, order_index);

-- Triggers
CREATE TRIGGER set_updated_at_lessons
  BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_sections
  BEFORE UPDATE ON lesson_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Types

### Agregar a `src/types/database.ts`

```ts
export interface Lesson {
  id: string
  tutor_id: string
  title: string
  description: string | null
  category: string | null
  level: Student['level']
  tags: string[] | null
  cover_image_url: string | null
  is_published: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type SectionType = 'intro' | 'vocabulary' | 'grammar' | 'exercise' | 'pronunciation' | 'reading' | 'custom'

export interface LessonSection {
  id: string
  lesson_id: string
  title: string
  type: SectionType
  content: SectionContent
  order_index: number
  created_at: string
  updated_at: string
}

// Content types por sección
export interface VocabularyWord {
  word: string
  translation: string
  phonetic: string
  example: string
  image_url?: string
}

export interface GrammarExample {
  sentence: string
  highlight: string
}

export interface ExerciseQuestion {
  type: 'fill_blank' | 'multiple_choice' | 'true_false' | 'matching'
  question: string
  sentence?: string          // para fill_blank
  answer: string
  options?: string[]         // para multiple_choice
  pairs?: Record<string, string>  // para matching
}

export interface PronunciationWord {
  word: string
  phonetic: string
  audio_url?: string
  tips: string
}

export type SectionContent =
  | { words: VocabularyWord[] }                                    // vocabulary
  | { explanation: string; formula: string; examples: GrammarExample[] }  // grammar
  | { instructions: string; questions: ExerciseQuestion[] }        // exercise
  | { words: PronunciationWord[] }                                 // pronunciation
  | { html_content: string; image_url?: string }                   // intro, reading, custom

export interface LessonWithSections extends Lesson {
  sections: LessonSection[]
}
```

---

## Pronunciación — Web Speech API

### `src/lib/speech/pronunciation.ts`

```ts
/**
 * Wrapper para Web Speech API
 * - speak(text, lang): reproduce texto en voz
 * - Configurar lang como 'en-US' o 'en-GB'
 * - Manejar caso donde el browser no soporta speech synthesis
 * - Retornar estado: 'idle' | 'speaking' | 'error'
 * - Cancelar speech anterior si se llama de nuevo
 */

export function speak(text: string, lang: string = 'en-US'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85  // Un poco más lento para aprendizaje
    utterance.pitch = 1

    // Intentar usar voz nativa en inglés
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService)
    if (englishVoice) utterance.voice = englishVoice

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)

    window.speechSynthesis.speak(utterance)
  })
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
```

### `src/hooks/usePronunciation.ts`

```ts
// Hook que wrappea la función speak
// - isSpeaking: boolean
// - isSupported: boolean
// - speak(text): void
// - stop(): void
// Manejar hydration (check support only on client)
```

---

## Componentes de Lecciones

### Componente: PronunciationButton — `src/components/lessons/PronunciationButton.tsx`

```
Props: word (string), size ('sm' | 'md' | 'lg')

Diseño:
- Botón circular con icono Volume2
- Al clickear: icono cambia a animación de ondas sonoras
- Tamaños:
  - sm: w-8 h-8 (para tablas/listas)
  - md: w-10 h-10 (para cards)
  - lg: w-16 h-16 (para modo presentación)
- Color: primary-600, hover:primary-700
- Animación mientras habla: pulse ring effect
```

### Página: Lista de Lecciones — `src/app/(dashboard)/lessons/page.tsx`

**Layout:**
- Header: "Lecciones" + botón "Nueva Lección" (btn-primary)
- Filtros: categoría (select), nivel (select), search
- Grid de cards (no tabla):
  - Cover image o gradiente placeholder
  - Título (DM Serif Display)
  - Descripción truncada
  - Tags como badges
  - Nivel badge
  - Status: Published (verde) / Draft (gris)
  - Conteo de secciones
  - Menú: Editar, Presentar, Crear tarea, Duplicar, Eliminar
- Empty state: "Crea tu primera lección"
- Click en card → va a editar

### Página: Lesson Builder — `src/app/(dashboard)/lessons/new/page.tsx` y `[id]/page.tsx`

**Layout 3 columnas (desktop):**

**Left Panel (240px) — Lista de secciones:**
- Lista vertical de secciones existentes (drag to reorder si es posible, sino up/down buttons)
- Cada item: icono por tipo + título + botón delete
- Al seleccionar una sección, se abre en el editor central
- Botón "+ Agregar sección" al final con dropdown de tipos:
  - 📝 Introducción
  - 📚 Vocabulario
  - 📖 Gramática
  - ✍️ Ejercicio
  - 🎤 Pronunciación
  - 📖 Lectura
  - 🔧 Personalizado

**Center Panel (flex-1) — Editor de sección:**
Formulario dinámico según el tipo de sección seleccionada:

**Tipo "vocabulary":**
- Lista de palabras, cada una con:
  - Word (input) + Translation (input) + Phonetic (input)
  - Example sentence (input)
  - Botón de pronunciación (preview)
  - Botón remove
- Botón "+ Agregar palabra"

**Tipo "grammar":**
- Explanation (rich text / textarea)
- Formula (input, ej: "Subject + have/has + past participle")
- Examples: lista de { sentence, highlight }
- Botón "+ Agregar ejemplo"

**Tipo "exercise":**
- Instructions (textarea)
- Lista de preguntas:
  - Tipo de pregunta (select: fill_blank, multiple_choice, true_false)
  - Campos dinámicos según tipo
  - Botón remove
- Botón "+ Agregar pregunta"

**Tipo "pronunciation":**
- Lista de palabras con:
  - Word + Phonetic + Tips
  - Botón de pronunciación (preview)
- Botón "+ Agregar palabra"

**Tipo "intro" / "reading" / "custom":**
- Textarea grande para contenido (o rich text editor simple)
- Upload de imagen opcional

**Right Panel (320px) — Preview:**
- Preview en vivo de cómo se verá la sección en modo presentación
- Mini versión del modo presentación
- Se actualiza en tiempo real mientras edita

**Top Bar:**
- Back button ← Lecciones
- Título de la lección (editable inline)
- Select: categoría, nivel
- Tags input
- Botón "Guardar borrador" (btn-secondary)
- Botón "Publicar" (btn-primary)
- Botón "Presentar" (btn-accent, solo si hay secciones) → abre modo presentación

### Auto-save:
- Guardar automáticamente cada 5 segundos si hay cambios (debounced)
- Indicador: "Guardado ✓" / "Guardando..." en la top bar

---

## Modo Presentación

### Página: `src/app/(dashboard)/lessons/[id]/present/page.tsx`

**IMPORTANTE: Seguir las guías de "Modo Presentación" del DESIGN_SYSTEM.md**

**Layout fullscreen:**
- Sin sidebar, sin header — pantalla completa
- Fondo: gradiente de primary-800 a primary-900
- Texto: blanco, tamaños grandes

**Navegación:**
- Flechas izquierda/derecha (teclado + click en bordes)
- Barra de progreso en la parte inferior (dots o progress bar)
- Botón ESC o X para salir del modo presentación
- Keyboard shortcuts: ←→ para navegar, ESC para salir, espacio para avanzar

**Renderizado por tipo de sección:**

**Intro/Reading/Custom:**
- Título grande centrado (DM Serif Display, 3rem)
- Contenido debajo en texto grande (1.5rem)
- Imagen si hay

**Vocabulary:**
- Título de la sección arriba
- Cards grandes de vocabulario en grid (2 cols max)
- Cada card:
  - Palabra en grande (2.5rem, font-bold)
  - Fonético debajo en accent-400
  - Traducción
  - Ejemplo en itálica
  - Botón de pronunciación GRANDE (w-16 h-16) con animación de onda

**Grammar:**
- Título
- Fórmula destacada en card con fondo accent-500/20
- Explicación en texto grande
- Ejemplos con highlight (parte resaltada en accent-400)

**Exercise:**
- Instrucciones arriba
- Una pregunta a la vez (navegación entre preguntas)
- Interactivo: la profesora puede hacer el ejercicio con los estudiantes
- Mostrar respuesta correcta con botón "Revelar"

**Pronunciation:**
- Una palabra a la vez, centrada y GRANDE (4rem)
- Fonético debajo
- Botón de pronunciación gigante con animación
- Tips debajo en texto más pequeño
- Navegar entre palabras con flechas

**Transiciones:**
- Slide horizontal entre secciones (CSS transform)
- Fade in para contenido dentro de cada sección
- Transición suave de 300ms

---

## Hooks

### `src/hooks/useLessons.ts`

```ts
// - lessons: Lesson[]
// - loading: boolean
// - createLesson(data): Promise<Lesson>
// - updateLesson(id, data): Promise<Lesson>
// - deleteLesson(id): Promise<void>
// - duplicateLesson(id): Promise<Lesson>
// - publishLesson(id): Promise<void>
// - unpublishLesson(id): Promise<void>
```

### `src/hooks/useLessonSections.ts`

```ts
// - sections: LessonSection[]
// - loading: boolean
// - addSection(lessonId, type, data): Promise<LessonSection>
// - updateSection(id, data): Promise<LessonSection>
// - deleteSection(id): Promise<void>
// - reorderSections(lessonId, orderedIds): Promise<void>
// - Auto-save con debounce de 3-5 segundos
```

---

## Verificación de la Fase 2

Al completar esta fase, debes tener:

- [ ] Tablas `lessons` y `lesson_sections` creadas con RLS
- [ ] Lista de lecciones en grid de cards
- [ ] Lesson Builder funcional con panel de secciones + editor + preview
- [ ] Crear todos los tipos de secciones (intro, vocabulary, grammar, exercise, pronunciation, reading, custom)
- [ ] Pronunciación funcional con Web Speech API (botón reproduce la palabra)
- [ ] Auto-save funcional en el builder
- [ ] Modo Presentación fullscreen:
  - [ ] Navegación con flechas y teclado
  - [ ] Renderizado correcto por tipo de sección
  - [ ] Pronunciación funcional en modo presentación
  - [ ] Barra de progreso
  - [ ] Transiciones suaves
  - [ ] ESC para salir
- [ ] Responsive: builder funciona en tablet (2 cols), presentación funciona en cualquier pantalla
- [ ] Todos los componentes siguen el Design System

---

## Siguiente: Fase 3

Una vez verificado, proceder a `FASE_3_ASSIGNMENTS_AI.md`
