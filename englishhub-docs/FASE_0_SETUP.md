# Fase 0 — Setup del Proyecto

> **Objetivo:** Proyecto Next.js funcional con Supabase configurado, design system aplicado, layout base con sidebar, y componentes UI instalados.
> **Resultado:** App corriendo en localhost con sidebar navegable y página de login funcional.

---

## Pre-requisitos

Leer ANTES de empezar:
- `ARCHITECTURE.md` — estructura de carpetas y stack
- `DESIGN_SYSTEM.md` — guía visual completa (SEGUIR AL PIE DE LA LETRA)

---

## Paso 1: Crear proyecto Next.js

```bash
npx create-next-app@latest havenlanguage --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd havenlanguage
```

---

## Paso 2: Instalar dependencias

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI
npx shadcn@latest init
# Cuando pregunte: Style=Default, Color=Neutral, CSS variables=Yes

# Instalar componentes shadcn necesarios
npx shadcn@latest add button input label card dialog table badge tabs select textarea dropdown-menu avatar separator sheet tooltip calendar popover command

# Iconos
npm install lucide-react

# Utilidades
npm install date-fns clsx tailwind-merge
npm install -D @types/node
```

---

## Paso 3: Configurar Tailwind

Actualizar `tailwind.config.ts` con la configuración del Design System:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['DM Serif Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(28,25,23,0.06), 0 1px 2px -1px rgba(28,25,23,0.06)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

---

## Paso 4: Configurar globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap');

@layer base {
  :root {
    --bg-primary: #fafaf9;
    --bg-card: #ffffff;
    --bg-sidebar: #115e59;
    --bg-sidebar-hover: #0f766e;

    --shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.07), 0 2px 4px -2px rgba(28, 25, 23, 0.05);
    --shadow-lg: 0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.04);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background-color: var(--bg-primary);
    color: #292524;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2 {
    font-family: 'DM Serif Display', serif;
  }

  h3, h4, h5, h6 {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
  }
}

@layer components {
  .card-base {
    @apply bg-white border border-neutral-100 rounded-lg shadow-card p-6 transition-all duration-200;
  }
  .card-base:hover {
    @apply shadow-md -translate-y-px;
  }

  .btn-primary {
    @apply bg-primary-600 text-white font-medium px-5 py-2.5 rounded-md
           hover:bg-primary-700 transition-all duration-150
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2;
  }

  .btn-secondary {
    @apply bg-white border border-neutral-200 text-neutral-700 font-medium px-5 py-2.5 rounded-md
           hover:bg-neutral-50 transition-all duration-150
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2;
  }

  .btn-accent {
    @apply bg-accent-500 text-white font-medium px-5 py-2.5 rounded-md
           hover:bg-accent-600 transition-all duration-150
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2;
  }

  .sidebar-item {
    @apply flex items-center gap-3 px-4 py-2.5 rounded-md text-white/70 text-sm font-medium
           hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer;
  }

  .sidebar-item-active {
    @apply bg-white/10 text-white border-l-[3px] border-accent-400;
  }

  .input-base {
    @apply border border-neutral-200 rounded-md px-4 py-2.5 text-sm
           focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none
           placeholder:text-neutral-400 transition-all duration-150;
  }

  .badge-success {
    @apply bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full;
  }

  .badge-warning {
    @apply bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full;
  }

  .badge-error {
    @apply bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full;
  }

  .badge-info {
    @apply bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full;
  }
}
```

---

## Paso 5: Configurar Supabase Client

### `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  )
}
```

### `src/lib/supabase/middleware.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas del dashboard
  if (!user && request.nextUrl.pathname.startsWith('/(dashboard)') ||
      !user && request.nextUrl.pathname.match(/^\/(students|lessons|assignments|payments|calendar|settings)/)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### `src/middleware.ts`

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Paso 6: Utilidades

### `src/lib/utils.ts`

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  if (format === 'long') {
    return d.toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  return d.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateShareUrl(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/assignment/${token}`
}
```

---

## Paso 7: Layout del Dashboard con Sidebar

### `src/components/layout/Sidebar.tsx`

Implementar la sidebar según el Design System:
- Fondo: `bg-[#115e59]` (--bg-sidebar)
- Ancho: 260px fijo en desktop, sheet en mobile
- Logo: "HavenLanguage" en DM Serif Display, blanco
- Secciones de navegación:
  - **GENERAL**: Dashboard (LayoutDashboard), Calendario (Calendar)
  - **ENSEÑANZA**: Lecciones (BookOpen), Tareas (ClipboardList)
  - **GESTIÓN**: Estudiantes (Users), Pagos (CreditCard)
  - **CUENTA**: Configuración (Settings)
- Cada item usa `sidebar-item` class, activo usa `sidebar-item-active`
- Bottom: avatar + nombre del tutor + botón logout
- Mobile: usar Sheet de shadcn, trigger con Menu icon en Header

### `src/components/layout/Header.tsx`

- Solo visible como breadcrumb/título de página actual
- Mobile: botón hamburguesa para abrir sidebar
- Right side: botón de notificaciones (futuro), avatar del tutor

### `src/app/(dashboard)/layout.tsx`

```tsx
// Layout con sidebar fija + main content scrollable
// Sidebar a la izquierda (260px), main content flex-1
// Main content: max-w-[1200px] mx-auto p-8
// Verificar auth: si no hay user, redirect a /login
```

---

## Paso 8: Página de Login

### `src/app/(auth)/login/page.tsx`

- Diseño centrado, card con sombra suave
- Logo "HavenLanguage" arriba con DM Serif Display
- Subtitle: "Gestiona tus clases de inglés"
- Form: email + password + botón "Iniciar Sesión" (btn-primary)
- Link "¿No tienes cuenta? Regístrate"
- Fondo: neutral-50 con un sutil patrón o gradiente teal muy suave
- Usar Supabase Auth `signInWithPassword`

### `src/app/(auth)/register/page.tsx`

- Similar a login pero con campos: nombre completo, email, password, confirmar password
- Crear usuario en auth.users + crear registro en tabla `tutors`
- Redirect a dashboard después del registro

---

## Paso 9: Dashboard Home (placeholder)

### `src/app/(dashboard)/page.tsx`

- Saludo: "Buenos días, [nombre]" con DM Serif Display
- 4 StatsCards en grid:
  - Total estudiantes (Users icon, primary)
  - Clases este mes (BookOpen icon, accent)
  - Pagos pendientes (AlertCircle icon, warning)
  - Próxima clase (Calendar icon, info)
- Sección "Próximas Clases" (empty state por ahora)
- Sección "Actividad Reciente" (empty state por ahora)

### `src/components/shared/EmptyState.tsx`

```tsx
// Componente reutilizable para estados vacíos
// Props: icon, title, description, actionLabel, onAction
// Diseño: centrado, icono grande en circle con bg-neutral-100, texto neutral-500
```

### `src/components/shared/StatsCard.tsx`

```tsx
// Props: title, value, icon, trend?, color ('primary' | 'accent' | 'warning' | 'info')
// Card con icono en circle coloreado, valor grande, título pequeño
```

---

## Paso 10: Archivo .env.local.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (Fase 3)
ANTHROPIC_API_KEY=your-anthropic-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Verificación de la Fase 0

Al completar esta fase, debes tener:

- [ ] Proyecto Next.js corriendo en localhost:3000
- [ ] Tailwind configurado con el design system (colores, fonts, borderRadius)
- [ ] shadcn/ui instalado con los componentes listados
- [ ] globals.css con las clases utilitarias (card-base, btn-primary, sidebar-item, etc.)
- [ ] Supabase clients configurados (browser, server, middleware)
- [ ] Middleware de auth protegiendo rutas del dashboard
- [ ] Layout del dashboard con Sidebar navegable
- [ ] Página de login funcional con Supabase Auth
- [ ] Página de registro funcional
- [ ] Dashboard home con StatsCards y EmptyStates
- [ ] Google Fonts (DM Serif Display + DM Sans) cargando correctamente
- [ ] Responsive: sidebar se colapsa en mobile con Sheet

---

## Siguiente: Fase 1

Una vez verificado todo lo anterior, proceder a `FASE_1_STUDENTS_PAYMENTS.md`
