# Szczegółowa Architektura Implementacji Lazy Loading i Filtrowania Listy Projektów

Na podstawie analizy wymagań z pliku PRD.md (sekcje dotyczące zarządzania projektami, US-007: Przeglądanie listy projektów), tech-stack.md (użycie Astro z React dla interaktywności, Supabase jako backend, Vitest i Playwright do testów) oraz dodatkowych wymagań użytkownika (częściowe ładowanie listy projektów z mechanizmem infinite scroll, filtrowanie za pomocą pojedynczego inputa tekstowego bez naruszania istniejącej funkcjonalności), poniżej przedstawiono opisową specyfikację techniczną. Specyfikacja skupia się na modyfikacjach istniejącej struktury aplikacji, zapewniając zgodność z zasadami clean code (np. early returns, guard clauses), typowaniem TypeScript oraz integracją z istniejącymi komponentami (ProjectsView.tsx, ProjectsList.tsx, project.service.ts, pages/api/projects.ts). Nie narusza ona mechanizmów autentykacji (Supabase), middleware ani renderowania server-side (Astro w trybie SSR z adapterem Vercel).

Specyfikacja unika naruszenia istniejącego działania: lista projektów pozostaje dostępna dla zalogowanych użytkowników, empty state dla nowych (US-005), obsługa błędów i ładowania, mobilna nawigacja. Zmiany wprowadzają paginację server-side (zamiast client-side filtrowania), co optymalizuje wydajność dla dużych list (zgodne z wymaganiami PRD o skalowalności CRUD).

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

Warstwa frontendu opiera się na hybrydowym modelu Astro (statyczne strony z SSR) + React (interaktywne komponenty client-side). Zmiany koncentrują się na stronie `/projects` (renderowanej server-side via Astro, z integracją React komponentów), bez modyfikacji layoutów (Layout.astro) ani stron auth (np. `/auth/login.astro`). Istniejące strony non-auth (np. redirect z `/` na `/projects` via astro.config.mjs) pozostają niezmienione – autentykacja via middleware wymusza logowanie przed dostępem do listy.

### Dokładny opis zmian w warstwie frontendu:
- **Strona Astro `/src/pages/projects/index.astro` (istniejąca, do rozszerzenia):** 
  - Pozostaje kontenerem server-side dla ProjectsView (React komponent client-side). Dodaje się atrybut `client:load` do skryptu React, aby komponent ładował się asynchronicznie po renderze SSR (zgodne z Astro 5 i React 19). To zapewnia szybki initial render (pusty lub z partial data z query params), a interaktywność (infinite scroll, filtrowanie) obsługuje React po hydratacji.
  - Brak zmian w layoutach (Layout.astro) – autentykacja sprawdzana server-side via locals.user z middleware.
  - Nowe elementy: Brak nowych stron; rozszerzenie o query params w URL (np. `?search=query&offset=0&limit=10`) dla bookmarkable stanu (np. po refreshu).

- **Komponent React `ProjectsView.tsx` (do rozszerzenia o odpowiedzialność za paginację i infinite scroll):**
  - **Rozszerzone elementy:** 
    - Hook `useProjects` (z `@/lib/hooks/useProjects`) modyfikowany do obsługi paginacji: zamiast fetch wszystkich projektów, przyjmuje parametry `limit`, `offset`, `searchQuery`. Zwraca `projects` (aktualna strona), `hasMore` (czy są kolejne strony), `total` (całkowita liczba po filtrowaniu), `loadingMore` (stan ładowania kolejnej strony), `error`.
    - Stan lokalny: Dodaje `offset` (initial 0), `hasMore` (na podstawie total z API), `loadingMore` (boolean dla infinite scroll). Istniejący `searchQuery` i `deletingId` pozostają.
    - Filtrowanie: Input tekstowy (już w `MobileBottomNav.tsx`) integruje się z `searchQuery`; po zmianie query resetuje `offset` do 0 i triggeruje refetch (debounce 300ms dla UX).
    - Infinite scroll: Używa `IntersectionObserver` (natywny API przeglądarki, bez zewnętrznych lib) do wykrywania dojścia do końca listy. Po obserwacji ostatniego elementu w `ProjectsList`, jeśli `hasMore` i nie `loadingMore`, incrementuje `offset` o `limit` (domyślnie 10) i fetchuje kolejną stronę via `projectService.fetchUserProjects` (nowa metoda w serwisie).
    - Nawigacja: Istniejące `handleAddProject`, `handleEdit`, `handleDelete` pozostają; po delete/refetch resetuje `offset` jeśli potrzeba (aby uniknąć pustych stron).
  - **Nowe elementy:** 
    - Komponent `InfiniteScrollTrigger` (nowy, prosty React komponent w `@/components/InfiniteScrollTrigger.tsx`): Obserwator na ostatnim `ProjectCard` w `ProjectsList`. Props: `onLoadMore` (callback z `useProjects`), `hasMore`, `loadingMore`. Używa `useEffect` z `useRef` do attach/detach observera.
    - Loading indicator: Rozszerzenie `SkeletonGrid` o wariant dla "more" (pokazywany pod listą podczas `loadingMore`).

- **Komponent React `ProjectsList.tsx` (minimalne rozszerzenie):**
  - Pozostaje gridem responsywnym (1-3 kolumny). Dodaje ref na ostatni `ProjectCard` (via `useRef` w `ProjectsView`, przekazywany jako prop `lastRef`).
  - Brak logiki biznesowej – czysta prezentacja `ProjectDto[]`. Filtrowanie i paginacja obsługiwane wyżej (server-side, więc lista zawsze aktualna).

- **Inne komponenty (bez zmian lub minimalne):**
  - `MobileBottomNav.tsx`: Istniejący input search integruje się z `onSearchChange` w `ProjectsView`; debounce via `useCallback`.
  - `EmptyState.tsx`: Pokazywany tylko jeśli `total === 0` po initial fetch (z search=empty).
  - `ProjectCard.tsx`: Bez zmian – edycja/usuwanie via callbacks.

### Rozdzielenie odpowiedzialności:
- **Strony Astro (server-side):** Renderują initial HTML z SSR (np. partial data z query params via Supabase query w `getStaticProps` jeśli potrzeba, ale głównie middleware auth). Integracja z backendem: Przekazują `locals.user` do komponentów React. Nawigacja: Astro obsługuje routing (np. `/projects/new`), React – client-side actions (fetch via service).
- **Komponenty React (client-side):** `ProjectsView` zarządza stanem (offset, search), hookami (useProjects z SWR-like caching via React Query lub custom) i interakcjami (observer, debounce). `projectService` (z `@/lib/services/project.service.ts`) abstrahuje API calls (type-safe z DTOs z `@/types.ts`). Brak bezpośrednich połączeń z Supabase – wszystko via API endpoints.
- **Integracja z backendem autentykacji:** Credentials: `include` w fetch (Supabase sessions). Na 401 – redirect do `/login` (już w kodzie). Nawigacja: `window.location.href` dla SSR pages (zgodne z Astro).

### Opis przypadków walidacji i komunikatów błędów:
- **Walidacja client-side:** Search query – trim i escape (via `useMemo`); limit/offset – walidowane w hooku (min 1-50 dla limit). Błędy API (z `ApiError` z utils) mapowane na toasty (sonner): np. "Nie znaleziono projektów" dla empty results, "Błąd ładowania" dla 500.
- **Komunikaty błędów:** 
  - Initial load fail: Pokaz `AlertCircle` z retry button (już w kodzie).
  - Load more fail: Toast error + stop infinite scroll (`hasMore=false`).
  - Search too broad: Server-side limit (np. max 100 results), client pokazuje "Za dużo wyników, zawęź wyszukiwanie".
  - Offline/network: `createNetworkError` z service, retry via pull-to-refresh (nowy gesture via touch events w mobile).
- **Edge cases:** Empty search + offset>0 – reset offset. Delete last item – check `hasMore`. Slow network – optimistic UI (local filter przed refetch, ale minimalne dla zgodności).

### Obsługa najważniejszych scenariuszy:
- Initial load: Fetch first page (offset=0, limit=10, search="").
- Scroll end: Auto-load next page, append do `projects[]`.
- Search change: Reset offset, fetch new total/filtered results.
- Delete: Refetch current page, adjust offset jeśli empty.
- Refresh/page back: Przywróć stan z URL params (search, offset).
- Mobile: Grid 1-col, bottom nav z input; observer działa na touch scroll.
- Accessibility: ARIA-live dla nowych items ("Wczytano więcej projektów"), focus management po load.

## 2. LOGIKA BACKENDOWA

Backend opiera się na Astro API routes (SSR z Supabase), z typami z `@/types.ts` (ProjectDto, CreateProjectDto). Istniejący endpoint `/api/projects` (GET/POST) wspiera query params (limit, offset, sort via Zod schema). Zmiany rozszerzają o server-side search i paginację, bez naruszania POST (create) ani auth (locals.user z Supabase).

### Struktura endpointów API i modeli danych:
- **Endpoint GET `/api/projects` (rozszerzony):**
  - Query params: `limit` (number, default 10, max 50), `offset` (number, default 0), `sort` (enum: 'name-asc', 'date-desc', default 'date-desc'), **nowy: `search` (string, optional, min 3 chars dla perf)**.
  - Response: `{ projects: ProjectDto[], total: number, hasMore?: boolean }` – `total` to count filtered results, `hasMore` = total > offset + limit.
  - Modele: Używa istniejącego `ProjectDto` (z id, name, description, technologies[], status, links). Filtrowanie: Full-text search na Supabase (np. `ilike` na name/description, array overlap na technologies).
- **Brak nowych endpointów:** POST pozostaje dla create (bez paginacji). Delete via `/api/projects/:id` (już obsługiwane w ProjectsView).
- **Integracja z Supabase:** W backend `ProjectService` (nie pokazany, ale inferowany z locals.supabase): Używa `supabase.from('projects').select('*').eq('user_id', locals.user.id).range(offset, offset+limit-1).order(sort).filter('name', 'ilike', `%${search}%')` + count dla total.

### Mechanizm walidacji danych wejściowych:
- **Zod schemas (rozszerzone):** `projectsQuerySchema` dodaje `search: z.string().optional().min(3, "Za krótkie zapytanie")`. Walidacja w API route: `safeParse` na URL params; błędy 400 z details (array messages).
- **Server-side:** Supabase RLS (Row Level Security) zapewnia isolation per user_id. Walidacja DTOs via Zod w service (już w createProjectSchema).
- **Rate limiting:** Opcjonalnie via middleware (np. 10 req/min per user dla search, zgodne z PRD limits AI).

### Obsługa wyjątków:
- **Błędy auth:** 401 Unauthorized (już w kodzie, redirect client-side).
- **Walidacja fail:** 400 Bad Request z JSON {error, details[]}.
- **Supabase errors:** Catch w service, map na custom `ApiError` (type: 'database', message: user-friendly, np. "Błąd bazy danych"). Log via console.error.
- **Network/timeout:** Supabase client timeout (5s), fallback 500 Internal Server Error.
- **Edge cases:** Empty results – {projects: [], total: 0}. Invalid offset (>total) – empty page, hasMore=false.

### Aktualizacja sposobu renderowania wybranych stron server-side:
- **Astro config (`astro.config.mjs`):** Pozostaje SSR (`output: "server"`) z adapterem Vercel. Dodaje się cache headers dla API (np. `Cache-Control: no-cache` dla dynamic search/pagination).
- **Strony:** `/projects/index.astro` – SSR initial props z partial query (jeśli user logged), ale bulk interakcji client-side. Brak zmian w prerender=false dla API routes.
- **Performance:** Pagination redukuje initial payload (z ~all projects do 10). Vercel edge caching dla static parts, dynamic dla search.

## Kluczowe wnioski i kontrakty:
- **Moduły/serwisy:** Frontend: `useProjects` hook (zależny od `projectService.fetchUserProjects(params: {limit, offset, search}) => Promise<{projects, total, hasMore}>`). Backend: Rozszerzony `ProjectService` (metoda `fetchUserProjects(userId, query)` z Supabase RPC).
- **Kontrakty (TypeScript):** Nowy interface `PaginationQuery { limit: number; offset: number; search?: string; }`. Response type `PaginatedProjectsResponse extends ProjectsResponse { total: number; hasMore: boolean; }`.
- **Zgodność z PRD/tech-stack:** Wspiera US-007 (lista z filtrami), skalowalność (Supabase pagination), testowalność (Vitest dla hooka, Playwright dla scroll/search flows). Brak naruszeń: Auth via Supabase, UI z Tailwind/Shadcn, React hooks dla stanu.
- **Ryzyka/Mitigacje:** Over-fetching – debounce search + min length. SEO – SSR initial page z meta z total.
