# Auditoría técnica — Kilo

_Fecha: 2026-07-27 · Alcance: backend (Supabase), frontend, UX y seguridad._

> **Corrección de stack.** El prompt asumía **Vite + React + shadcn/ui**. El proyecto real es
> **Next.js 16 (App Router) + React 19 + Supabase SSR + Gemini (`@google/genai`) + web-push**, con una
> librería de UI **propia** en `components/ui` (no shadcn, no Radix). Varias recomendaciones cambian por esto:
> no hay que auditar `vite.config`, el ruteo es por carpetas en `app/`, el auth corre en `proxy.ts`
> (middleware de Next 16) y la accesibilidad hay que revisarla a mano porque los componentes no vienen de shadcn.

## Resumen ejecutivo

La base está **sólida y por encima del promedio** para un proyecto en esta etapa: RLS activo y bien
restringido en todas las tablas, secrets fuera del repo, rate limiting real en las rutas de IA/red, y un
patrón de fetching bien pensado (`useAuth` compartido + caché local). **No encontré hallazgos críticos**
(agujeros de seguridad ni cosas que rompan datos de forma grave). Lo que hay para mejorar es sobre todo
**consistencia** (mezclaste dos patrones de auth) y **escalabilidad de un par de piezas del frontend**.

---

## 🔴 Hallazgos críticos

Ninguno. RLS, manejo de secrets, validación de inputs del lado servidor y rate limiting están en su lugar.
(Ver "seguridad" al final para el detalle de por qué.)

---

## 🟠 Hallazgos importantes

> **Estado:** #1, #2, #3 y #4 ✅ implementados (2026-07-28).

### 1. ✅ Patrón de autenticación mezclado (esto es lo que "mezclaste")
**Dónde:** [`hooks/useReminders.ts`](hooks/useReminders.ts) (2 llamadas), [`hooks/useWeeklyInsights.ts`](hooks/useWeeklyInsights.ts), [`hooks/useProgressPhotos.ts`](hooks/useProgressPhotos.ts) (2), [`components/food/AddFoodSheet.tsx:210`](components/food/AddFoodSheet.tsx#L210).

**Por qué es un problema:** tenés dos patrones conviviendo. El bueno —`useDiary`, `useWater`, `useHabits`,
`useWeightLog`, `useProfile`— saca el `userId` del **`AuthContext` compartido** (un solo `getSession()`, sin red).
Los de arriba todavía hacen `supabase.auth.getUser()`, que es un **round-trip al server de auth de Supabase** en
cada montaje del hook. Es exactamente lo que la refactorización de `useAuth` (commit `724cfa6`) vino a eliminar;
quedaron estos cuatro sin migrar. Efecto: latencia extra, parpadeos de estado y comportamiento inconsistente entre pantallas.

> Nota: en las **API routes** (`app/api/**`) el `getUser()` server-side **está bien** y hay que dejarlo — ahí valida el token de verdad. El problema es sólo en hooks/componentes de cliente.

**Cómo lo resolvería:** en esos hooks, reemplazar el `getUser()` por `const { userId } = useAuth()` (el de
`context/AuthContext`) y usar `userId` en las queries, igual que `useDiary`. En `AddFoodSheet` ya está
importado `useAuth` y ya tenés `userId` en scope (línea 156) — la llamada de la 210 es redundante, se borra.

### 2. ✅ Filtro de día por timestamp naïve vs. UTC (comidas en el día equivocado)
**Dónde:** [`hooks/useDiary.ts:87-88`](hooks/useDiary.ts#L87) — `.gte("eaten_at", \`${targetDate}T00:00:00\`).lte(..., "T23:59:59")`.

**Por qué es un problema:** `eaten_at` es `timestamptz` (se guarda en UTC). El filtro compara contra un string
**sin offset**, que Postgres interpreta en la timezone de la sesión (UTC). Para un usuario en Argentina (UTC-3),
una comida cargada a las **22:00 local** se guarda como **01:00 UTC del día siguiente** y cae **fuera** de la
ventana del día → aparece en la fecha equivocada o "desaparece" del diario de hoy. Los días pasados lo mitigan
anclando a mediodía, pero el día actual con hora real queda expuesto.

**Cómo lo resolvería:** calcular los límites del día **en local** y mandarlos como ISO con offset
(`new Date(`${targetDate}T00:00:00-03:00`).toISOString()`), o —más robusto y consistente con el resto del
esquema— agregar a `meals` una columna generada `log_date date` en timezone local, tal como ya hacés en
`water_logs` y `habit_logs`, e indexar/filtrar por ahí.

### 3. ✅ `AddFoodSheet.tsx` es un componente-Dios (1464 líneas)
**Dónde:** [`components/food/AddFoodSheet.tsx`](components/food/AddFoodSheet.tsx) — el archivo más grande del proyecto por lejos.

**Por qué es un problema:** concentra búsqueda, tabs (Frecuentes/Recientes/Buscar), scanner de barcode,
análisis por foto, carga manual, sugerencias por momento del día **y** escrituras a la DB. Es difícil de testear,
propenso a renders innecesarios (todo el árbol re-renderiza ante cualquier cambio de estado) y es el punto donde
"se va a volver un quilombo" a medida que crezca.

**Cómo lo resolvería:** partirlo por responsabilidad: un subcomponente por tab, extraer la lógica de datos a hooks
(`useFoodSearch` con debounce, `useFrequentFoods`, `useRecentFoods`) y dejar `AddFoodSheet` como orquestador del
sheet. Memoizar las listas de resultados.

### 4. ✅ Pantallas sin estado de error (fallo silencioso)
**Dónde:** [`app/dashboard/page.tsx`](app/dashboard/page.tsx) y [`app/macros/page.tsx`](app/macros/page.tsx) — 0 referencias a manejo de error.

**Por qué es un problema:** si la query falla (red caída, token expirado), la pantalla queda en loading o muestra
ceros sin avisar. En una app de uso diario eso se lee como "se borraron mis datos".

**Cómo lo resolvería:** propagar el `error` que ya devuelven los hooks (`useDiary`, `useWeeklyInsights` exponen
`error`) y renderizar un estado de error con reintento, como ya hace `app/habits/page.tsx`.

---

## 🟡 Mejoras sugeridas (nice-to-have)

- **Duplicación de lógica de fecha local.** `toLocaleDateString("en-CA")` está repetido en `useToday`,
  `useWeeklyInsights`, `app/diary/page.tsx`, `app/habits/page.tsx` y `lib/habits/streak.ts`. Extraer un
  `lib/date.ts` con `todayLocal()` y `localDayRange(date)` — de paso resuelve el punto #2 en un solo lugar.

- **`cron-send` acepta el secret por query param.** [`app/api/notifications/cron-send/route.ts:79`](app/api/notifications/cron-send/route.ts#L79)
  lee `?secret=` como fallback. Los query params se filtran en logs de acceso, referrers e historial. Dejar
  sólo el header `Authorization: Bearer`. Bonus: comparación en tiempo constante para el secreto.

- **Caché local parcial.** Sólo `useDiary` y `useProfile` usan `localCache`. Extender el patrón a los otros
  hooks de lectura (agua, hábitos, insights) daría carga instantánea consistente en toda la app — o documentar
  por qué algunos quedan afuera.

- **Índices menores.** `meal_items.food_id` y `meal_items.barcode_product_id` no tienen índice; si más adelante
  consultás "en qué comidas usé tal alimento", conviene agregarlos. Hoy no es un problema (las lecturas van por `meal_id`).

- **Accesibilidad (UI propia).** Al no usar shadcn, hay que verificar a mano: `label`/`aria-label` en inputs del
  sheet, foco visible, contraste, y navegación por teclado en `Sheet`/`Toast`. Vale una pasada con el inspector de accesibilidad.

- **UX / retención.** Ya tenés lo core cubierto (racha real, agua, recordatorios push, insights semanales). Lo que
  sumaría fricción-menos: **"copiar comida de ayer"**, edición de porción por unidades comunes (no sólo gramos),
  y búsqueda con debounce visible. Nada urgente.

---

## Lo que está bien (para no romperlo)

- **RLS completo y correcto:** todas las tablas de usuario con políticas `= auth.uid()`; `meal_items` valida
  ownership vía join a `meals`; catálogo (`foods`, `barcode_products`) con lectura pública intencional; `audit`
  con RLS activo y sin políticas de cliente (solo `service_role`); Storage de fotos de progreso restringido por
  carpeta `{user_id}/`. Bucket privado con URLs firmadas.
- **Secrets:** `.env.local` fuera de git (sólo `.env.local.example`), `SUPABASE_SERVICE_ROLE_KEY` sólo en rutas server.
- **Validación server-side:** barcode saneado y validado por regex antes de salir a Open Food Facts; foto con
  validación de tipo, tamaño (6MB) y tokens alfanuméricos (sin riesgo de inyección en el `.or()` de matching).
- **Rate limiting real:** por usuario y persistente en DB, + **tope global diario** de llamadas a Gemini para no
  salir del free tier. Fetch a Open Food Facts con timeout y cache de 24h.
- **Fetching:** join anidado `meals→meal_items→foods` en una sola query (sin N+1) y updates optimistas con rollback.

---

_Sin cambios aplicados — esto es sólo el diagnóstico. Decime por cuál arrancamos y lo implemento (sugerencia:
#1 auth y #2 timezone primero, son de bajo riesgo y alto impacto)._
