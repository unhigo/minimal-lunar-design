# MOONØ.LAB — Admin System · PHASE 0 Audit

Fecha: 2026-09-29 · Alcance: auditoría del proyecto existente como base del
Admin System. **PHASE 2 (AppShell/Sidebar/CommandPalette) NO se ha iniciado** —
este documento es el mapa que la guiará.

## 0. Stack detectado (inspección real, no suposiciones)

| Área | Estado real |
|---|---|
| Framework | Vite + React 19 + TypeScript strict |
| Routing | react-router v7 (`src/main.tsx`, rutas declarativas) |
| Estilos | Tailwind v4 (`@import "tailwindcss"`) + shadcn/ui (new-york) |
| Backend / DB | Convex (`src/convex/`) — queries/mutations/actions reales |
| Auth | Convex Auth (`@convex-dev/auth`), roles `admin/user/member` |
| Storage | Convex File Storage (`files.generateUploadUrl` + `attach`) |
| Formularios | React controlado + Zod (sin react-hook-form) |
| Estado global | Ninguno (estado local + Convex subscriptions) — no se añade |
| Iconos | lucide-react |
| Tests | Vitest + happy-dom, 17 archivos / 170 tests |
| Monorepo de datos | `tools`, `resources`, `submissions`, `comments`, `purchases`, `toolVotes`, `toolFavorites`, `users` |

## 1. Mapa EXISTING (funciona hoy — no reconstruir)

- **`/admin` (`src/pages/Admin.tsx`)** — cola de envíos (aprobar/descartar/
  publicar como recurso/herramienta), recursos (ocultar/destacar/borrar),
  comentarios recientes, gestión de roles, bootstrap de primer admin.
- **`src/pages/AdminDirectory.tsx`** — CRUD del directorio de herramientas
  (`api.tools.create/update/remove/listAllForAdmin`) con filtro local.
- **`src/pages/Dashboard.tsx`** — superficie autenticada: quick actions, mis
  recursos (editar/eliminar/copiar enlace), mis envíos, favoritos, descargas.
- **Backend completo**: `resources.ts`, `tools.ts`, `submissions.ts`,
  `files.ts`, `users.ts` con guardas de rol `ROLES.ADMIN` server-side.
- **Design system**: tokens de marca §15 en `src/index.css`
  (`--moon-black #050505`, `--signal-red #ff0033`, escala `--gray-*`),
  utilidades `.mono-label`, `.signal-dot`, `.btn-solid/.btn-outline`,
  `.grid-technical`, jerarquía `.h1-editorial`.
- **Navegación pública**: `SiteHeader` + `SiteMenubar` (glass) con manifiesto
  `src/lib/nav.ts` (`NAV_SECTIONS`, `isNavPathActive`).
- **Rutas existentes** que el admin debe respetar (main.tsx): `/dashboard`,
  `/admin`, `/submit`, `/upload`, `/tools(+/:slug)`, `/directory`, `/lab`,
  `/projects(+/:slug)`, `/resources`-equivalente (`/catalog`, `/collections`),
  `/settings` (no existe aún), `/lab/playground` (no existe aún).

## 2. Mapa REUSABLE (aprovechar tal cual en PHASE 2+)

- `RequireAuth` (returnTo preservado) para envolver el shell admin.
- `useAuth()` → `{ user, isLoading, isAuthenticated }`; `user.role === "admin"`
  ya es el gate correcto (lo usa `/admin` hoy).
- shadcn/ui: `dialog`, `menubar`, `button`, `input`, `textarea`, `select`
  nativo — base para Sidebar/CommandPalette sin dependencias nuevas.
- `timeAgo`/`formatPrice` (`src/lib/catalog.ts`), `OSymbol/Logo/SignalDot`
  (`src/components/brand/Logo.tsx`), `cn`, `usePageMeta`.
- Pipeline de subida `uploadImage` + `files.attach` para cualquier UI admin
  con imágenes.
- Patrón de validación de catálogos + Zod (`submit-schema.ts`) como guía para
  formularios admin.
- Convex reactive subscriptions — evita stores manuales para datos de server.

## 3. Mapa CONFLICT (decisiones de diseño a respetar)

- **Dos sistemas de "dashboard"**: el `/dashboard` de usuario vs el admin
  system solicitado. Decisión: el shell admin se montará sobre rutas propias
  (`/admin/...`) sin reemplazar `/dashboard`; el `/admin` actual se migrará
  dentro del shell en PHASE 2+, no se borra.
- **Tema**: el proyecto es dark-only (html.dark fijo, sin toggle). El prompt
  original pide light/dark/system. Decisión: Dark es el modo principal y
  único; no se reintroduce el toggle.
- **Glass vs flat admin**: la nav pública usa glassmorphism; la estética admin
  especifica superficies planas (#0D0D0D/#1C1C1C). Decisión: el shell admin
  usará superficies planas con la MISMA escala de grises (tokens ya unificados).
- **Menú**: `SiteMenubar` público vs sidebar admin. Coexisten: el shell admin
  tendrá su propio sidebar desde `navConfig` (PHASE 3), no se toca el menú
  público.
- **Datos mock**: el prompt pide stats mock; el backend real ya expone counts.
  Decisión: preferir datos reales de Convex; etiquetar explícitamente `MOCK`
  solo lo que no tenga fuente real (System Status).

## 4. Mapa MISSING (lo que PHASE 2+ deberá crear)

- `AppShell` + `Sidebar` (expanded/icon/mobile) + `Header` + `Breadcrumb` +
  `PageHeader` — **no iniciar en esta fase**.
- `navConfig` de admin (config-driven, no hardcodeado).
- Command Palette (⌘K) con índice de rutas/acciones.
- `DataTable` reutilizable (sorting/filtering/pagination/selection/column
  visibility) — hoy cada sección de `/admin` tiene su propia lista `<ul>`.
- Capa Repository (`useTools → ToolRepository → ConvexRepo`) para desacoplar
  páginas de mocks/datasource.
- Estados estándar `Skeleton/LoadingState/EmptyState/ErrorState`.
- `/settings` y subrutas de lab (`/lab/playground`, `/lab/experiments`).

## 5. PHASE 1 — Design System (implementado en esta fase)

Añadido a `src/index.css` **dentro de `@layer utilities`, sin reemplazar nada**:

| Token/clase | Valor | Uso previsto |
|---|---|---|
| `.admin-surface` | `#0D0D0D` (var(--gray-0d)) | fondo de página admin |
| `.admin-panel` | `#1C1C1C` (var(--gray-1c)) | paneles/sidebar |
| `.admin-border` | `#333333` (var(--gray-3)) | bordes discretos |
| `.admin-border-strong` | `#555555` (var(--gray-5)) | bordes activos |
| `.admin-meta` | `#A0A0A0` (var(--gray-a)) | metadata |
| `.admin-meta-dim` | `#777777` (var(--gray-7)) | metadata secundaria |
| `.admin-accent` / `.admin-accent-bg` | `#FF0033` | señal única |
| `.admin-status-online` / `.admin-status-ready` | verde / señal | System Status |
| `.admin-cell` | mono 12px, pad 8/12 | ritmo denso de tabla |

Reglas registradas: fondo negro, texto blanco, rojo solo como señal, sin
gradients, radius pequeño (var(--radius) = 4px), motion 100–200ms respetando
`prefers-reduced-motion` (ya cubierto por el bloque global existente).

## 6. Verificación de esta fase

- `bun tsc -b --noEmit` → 0 errores.
- `bun vitest run` → 17 archivos / **170 tests** en verde.
- Ningún archivo existente de admin fue modificado; `index.css` solo recibió
  tokens nuevos (sin cambios visuales hasta que PHASE 2 los consuma).
