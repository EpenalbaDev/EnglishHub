# EnglishHub — Guía de Implementación

> Plataforma para profesores de inglés independientes.
> Stack: Next.js 16 + Supabase + Tailwind + shadcn/ui

---

## 📁 Estructura de Documentos

```
englishhub-docs/
├── README.md                    ← Este archivo
├── DESIGN_SYSTEM.md             ← Guía visual (leer SIEMPRE antes de UI)
├── ARCHITECTURE.md              ← Estructura, DB schema, stack decisions
├── FASE_0_SETUP.md              ← Scaffolding del proyecto
├── FASE_1_STUDENTS_PAYMENTS.md  ← Estudiantes + Pagos
├── FASE_2_LESSONS.md            ← Lecciones + Pronunciación + Presentación
├── FASE_3_ASSIGNMENTS_AI.md     ← Tareas + Link público + Resumen AI
└── FASE_4_CALENDAR_PORTAL.md    ← Calendario + Dashboard + Portal estudiante
```

---

## 🚀 Cómo usar con Claude Code

1. Copia toda la carpeta `englishhub-docs/` a la raíz de tu proyecto (o donde Claude Code pueda leerla)

2. Para cada fase, dale a Claude Code este prompt:

```
Lee los archivos en ./englishhub-docs/. Empieza por DESIGN_SYSTEM.md y ARCHITECTURE.md para entender el contexto. Luego implementa FASE_0_SETUP.md completa. Sigue las instrucciones al pie de la letra, especialmente el design system.
```

3. Para fases siguientes:

```
Lee DESIGN_SYSTEM.md (para mantener consistencia visual) y luego implementa FASE_1_STUDENTS_PAYMENTS.md. El proyecto ya tiene la Fase 0 completada.
```

4. **SIEMPRE** recuérdale leer el DESIGN_SYSTEM.md antes de cualquier trabajo de UI.

---

## 🖱️ Cómo usar con Cursor

1. Agrega `englishhub-docs/` como carpeta en tu proyecto

2. En Cursor, puedes referenciar archivos con `@`:

```
@DESIGN_SYSTEM.md @ARCHITECTURE.md @FASE_0_SETUP.md

Implementa la Fase 0 completa siguiendo estas instrucciones. Asegúrate de seguir el design system exactamente.
```

3. Para fases siguientes, siempre incluye el design system:

```
@DESIGN_SYSTEM.md @FASE_1_STUDENTS_PAYMENTS.md

Implementa la Fase 1. El proyecto ya tiene Fase 0 lista.
```

---

## ⚡ Tips Importantes

1. **Orden de fases es estricto.** Cada fase depende de la anterior. No saltar.

2. **DESIGN_SYSTEM.md es sagrado.** Si Claude Code o Cursor genera UI que no sigue el design system, corrígelo inmediatamente. Referéncialo en cada prompt.

3. **Verifica cada fase antes de avanzar.** Cada documento tiene un checklist de verificación al final. Asegúrate de que todo funcione antes de pasar a la siguiente fase.

4. **Supabase migrations son secuenciales.** Ejecutar en orden: 001 → 002 → 003 → 004.

5. **Variables de entorno.** Crea tu proyecto en Supabase primero y configura `.env.local` antes de empezar Fase 0.

6. **Multi-tenant desde el inicio.** Todo filtra por `tutor_id` via RLS. No necesitas hacer nada especial, pero no rompas las policies.

---

## 📋 Checklist General

- [ ] **Fase 0:** Proyecto corriendo, login funcional, sidebar navegable
- [ ] **Fase 1:** CRUD estudiantes, registro de pagos, filtros
- [ ] **Fase 2:** Builder de lecciones, pronunciación, modo presentación
- [ ] **Fase 3:** Tareas compartibles, submissions, resumen AI
- [ ] **Fase 4:** Calendario, dashboard real, portal estudiante
