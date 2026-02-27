# HavenLanguage — Design System & UI Guidelines

> Este documento es la fuente de verdad para el diseño visual de HavenLanguage.
> Todos los componentes, páginas y features DEBEN seguir estas guías.
> Léelo ANTES de implementar cualquier UI.

---

## 🎨 Dirección Estética: "Warm Academic"

**Concepto:** Una plataforma educativa que se siente premium, cálida y profesional — como un cuaderno Moleskine meets una app moderna de productividad. NO debe parecer una app corporativa fría ni un juguete infantil.

**Tono visual:** Refinado pero accesible. Limpio pero con personalidad. Profesional pero cálido.

---

## Tipografía

```css
/* Importar en layout.tsx o globals.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap');
```

| Uso | Fuente | Peso | Ejemplo |
|---|---|---|---|
| Headings (h1, h2) | DM Serif Display | 400 | Títulos de página, nombres de lección |
| Subheadings (h3, h4) | DM Sans | 600 | Secciones, cards |
| Body text | DM Sans | 400 | Contenido general |
| Labels/Captions | DM Sans | 500 | Botones, etiquetas, metadata |
| Code/Monospace | JetBrains Mono | 400 | Ejercicios de gramática |

```css
:root {
  --font-heading: 'DM Serif Display', serif;
  --font-body: 'DM Sans', sans-serif;
}
```

---

## Paleta de Colores

### Colores Principales

```css
:root {
  /* Primary — Deep Teal (profesional, educativo, confiable) */
  --primary-50: #f0fdfa;
  --primary-100: #ccfbf1;
  --primary-200: #99f6e4;
  --primary-300: #5eead4;
  --primary-400: #2dd4bf;
  --primary-500: #14b8a6;
  --primary-600: #0d9488;
  --primary-700: #0f766e;
  --primary-800: #115e59;
  --primary-900: #134e4a;

  /* Accent — Warm Amber (energía, creatividad, calidez) */
  --accent-50: #fffbeb;
  --accent-100: #fef3c7;
  --accent-200: #fde68a;
  --accent-300: #fcd34d;
  --accent-400: #fbbf24;
  --accent-500: #f59e0b;
  --accent-600: #d97706;
  --accent-700: #b45309;

  /* Neutrals — Warm Gray (no usar grises puros/fríos) */
  --neutral-50: #fafaf9;
  --neutral-100: #f5f5f4;
  --neutral-200: #e7e5e4;
  --neutral-300: #d6d3d1;
  --neutral-400: #a8a29e;
  --neutral-500: #78716c;
  --neutral-600: #57534e;
  --neutral-700: #44403c;
  --neutral-800: #292524;
  --neutral-900: #1c1917;

  /* Semantic */
  --success: #059669;
  --success-light: #d1fae5;
  --warning: #d97706;
  --warning-light: #fef3c7;
  --error: #dc2626;
  --error-light: #fee2e2;
  --info: #0d9488;
  --info-light: #ccfbf1;

  /* Backgrounds */
  --bg-primary: #fafaf9;
  --bg-card: #ffffff;
  --bg-sidebar: #115e59;
  --bg-sidebar-hover: #0f766e;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.07), 0 2px 4px -2px rgba(28, 25, 23, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.04);
  --shadow-card: 0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.06);
}
```

### Modo Oscuro (opcional, fase futura)
No implementar dark mode en las primeras fases. Mantener light theme consistente.

---

## Espaciado & Layout

```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;
}
```

### Grid System
- **Sidebar:** Fija, 260px ancho, bg `--bg-sidebar` (teal oscuro), texto blanco
- **Main content:** Flex grow, max-width 1200px, padding 32px
- **Cards:** Background blanco, border-radius `--radius-lg`, shadow `--shadow-card`, padding 24px
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Breakpoints
```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

---

## Componentes UI Core

### Buttons

```
Primary:    bg-primary-600, text-white, hover:bg-primary-700, radius-md, px-5 py-2.5
Secondary:  bg-white, border border-neutral-200, text-neutral-700, hover:bg-neutral-50
Ghost:      bg-transparent, text-neutral-600, hover:bg-neutral-100
Accent:     bg-accent-500, text-white, hover:bg-accent-600 (CTAs importantes)
Danger:     bg-error, text-white, hover:bg-red-700
```

- Todos los botones: `font-weight: 500`, `transition: all 150ms ease`
- Tamaños: sm (px-3 py-1.5 text-sm), md (px-5 py-2.5), lg (px-6 py-3 text-lg)
- Incluir estados: hover, focus-visible (ring-2 ring-primary-400 ring-offset-2), disabled (opacity-50)

### Cards

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--neutral-100);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 24px;
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Sidebar Navigation

```
- Fondo: --bg-sidebar (#115e59)
- Items: text-white/70, hover:bg-sidebar-hover, hover:text-white
- Item activo: bg-white/10, text-white, font-weight:600, border-left: 3px solid --accent-400
- Logo/Brand: DM Serif Display, text-white, text-xl, padding 24px
- Secciones: uppercase, text-xs, tracking-wider, text-white/40, mt-8 mb-2
- Iconos: lucide-react, 20px, stroke-width 1.75
```

### Tables

```
- Header: bg-neutral-50, text-neutral-500, text-xs uppercase tracking-wider
- Rows: border-bottom border-neutral-100, hover:bg-neutral-50/50
- Cells: py-4 px-4, text-sm text-neutral-700
- Bordes redondeados en tabla con overflow-hidden y radius-lg
```

### Forms & Inputs

```
- Input: border border-neutral-200, radius-md, px-4 py-2.5
- Focus: border-primary-400, ring-2 ring-primary-100
- Label: text-sm font-medium text-neutral-700, mb-1.5
- Error state: border-error, text-error text-sm mt-1
- Placeholder: text-neutral-400
```

### Badges/Tags

```
Status badges con colores semánticos:
- Activo/Pagado:    bg-success-light, text-success
- Pendiente:        bg-warning-light, text-warning
- Vencido/Inactivo: bg-error-light, text-error
- Info/Default:     bg-primary-50, text-primary-700

Todas: text-xs font-medium px-2.5 py-1 radius-full
```

### Modales

```
- Overlay: bg-black/40, backdrop-blur-sm
- Modal: bg-white, radius-xl, shadow-lg, max-width 520px, p-6
- Animación: fade-in + scale de 0.95 a 1
```

---

## Iconografía

Usar **lucide-react** exclusivamente:
```tsx
import { Users, BookOpen, CreditCard, Calendar, Play, Mic, Volume2, Plus, Search, Filter, MoreHorizontal, ChevronRight, CheckCircle, AlertCircle, X } from 'lucide-react'
```

- Tamaño default: 20px (w-5 h-5)
- En botones: 16px (w-4 h-4) con gap-2
- Stroke width: 1.75 (no cambiar)
- Color: heredar del texto padre

---

## Animaciones & Transiciones

```css
/* Transiciones base para todos los interactivos */
transition: all 150ms ease;

/* Page transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Staggered list items */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Card hover */
transform: translateY(-1px);
box-shadow: var(--shadow-md);

/* Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
background: linear-gradient(90deg, var(--neutral-100) 25%, var(--neutral-50) 50%, var(--neutral-100) 75%);
background-size: 200% 100%;
```

---

## Modo Presentación (Lecciones en clase)

Cuando la profesora presenta una lección en clase, el diseño cambia:

```
- Fullscreen (sin sidebar, sin header)
- Fondo: gradiente suave de --primary-800 a --primary-900
- Texto: blanco, tamaños grandes (h1: 3rem, body: 1.5rem)
- Vocabulario: cards grandes con pronunciación
- Controles de navegación: flechas laterales, indicador de progreso bottom
- Animaciones suaves entre secciones (slide horizontal)
- Botón de pronunciación: grande, circular, con animación de onda al reproducir
```

---

## Patterns de UI Específicos

### Dashboard (Home de la profesora)
- Stats cards en row (estudiantes, clases este mes, pagos pendientes, próxima clase)
- Próximas clases (lista compacta)
- Estudiantes con pagos pendientes (alert cards)
- Actividad reciente

### Lista de Estudiantes
- Search bar + filtros arriba
- Tabla con avatar (iniciales), nombre, email, status, último pago
- Click en fila → slide panel o página de detalle

### Detalle de Estudiante
- Header con avatar grande, nombre, info de contacto
- Tabs: Progreso | Pagos | Clases | Tareas
- Timeline de actividad

### Builder de Lecciones
- Left panel: lista de secciones (drag to reorder)
- Center: editor de la sección seleccionada
- Right panel: preview en vivo
- Toolbar superior: título, categoría, tags

---

## Tailwind Config Reference

```js
// tailwind.config.ts — referencia para configuración
{
  theme: {
    extend: {
      fontFamily: {
        heading: ['DM Serif Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
          600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
        },
        accent: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309',
        },
        neutral: {
          50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4',
          300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c',
          600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917',
        },
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px', xl: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(28,25,23,0.06), 0 1px 2px -1px rgba(28,25,23,0.06)',
      },
    },
  },
}
```

---

## Reglas Inquebrantables

1. **NUNCA** usar grises puros (#gray). Siempre warm grays (stone/neutral con tono cálido)
2. **NUNCA** usar Inter, Roboto, Arial o system fonts
3. **NUNCA** gradientes morados genéricos
4. **SIEMPRE** usar DM Serif Display para headings, DM Sans para body
5. **SIEMPRE** mantener la sidebar teal oscuro como ancla visual
6. **SIEMPRE** border-radius mínimo de 6px, preferir 10-14px para cards
7. **SIEMPRE** incluir hover states y transitions en elementos interactivos
8. **SIEMPRE** usar lucide-react para iconos, nunca heroicons o fontawesome
9. **SIEMPRE** spacing consistente: múltiplos de 4px
10. **SIEMPRE** que un componente nuevo se cree, debe seguir este design system
