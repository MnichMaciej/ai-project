# Plan implementacji widoku projektów

## 1. Przegląd

Widok projektów jest główną stroną aplikacji po zalogowaniu, wyświetlającą listę projektów użytkownika w formie kafelków lub wierszy. Jego celem jest zapewnienie szybkiego przeglądu portfolio użytkownika, z obsługą pustego stanu dla nowych użytkowników bez projektów. Widok integruje się z API do pobierania projektów i obsługuje podstawowe interakcje, takie jak edycja i usuwanie projektów, zgodnie z wymaganiami PRD i user stories US-005 oraz US-007.

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką `/` (strona główna) dla zalogowanych użytkowników. W przypadku braku autoryzacji, przekierowanie do widoku logowania. Użyj Astro middleware do ochrony trasy.

## 3. Struktura komponentów

- `ProjectsView` (główny komponent React w pliku `src/pages/index.astro` lub dedykowanym komponencie)
  - `ProjectsList` (lista projektów)
    - `ProjectCard` (kafelki/wiersze dla pojedynczego projektu)
  - `EmptyState` (widok dla pustej listy projektów)
  - `LoadingSpinner` (opcjonalny komponent z Shadcn/ui dla stanu ładowania)

Hierarchia:

```
ProjectsView
├── LoadingSpinner (conditional)
├── EmptyState (conditional, if projects.length === 0)
└── ProjectsList
    └── ProjectCard (map over projects)
```

## 4. Szczegóły komponentów

### ProjectsView

- Opis komponentu: Główny kontener widoku, zarządzający stanem, pobieraniem danych z API i renderowaniem podkomponentów w zależności od stanu (ładowanie, pusta lista, lista projektów).
- Główne elementy: `<div>` kontener z Tailwind klasami dla layoutu, warunkowe renderowanie `LoadingSpinner`, `EmptyState` lub `ProjectsList`.
- Obsługiwane zdarzenia: Brak bezpośrednich; deleguje do podkomponentów (np. onEdit, onDelete z ProjectCard).
- Obsługiwana walidacja: Brak; walidacja API jest obsługiwana po stronie serwera.
- Typy: `ProjectsListResponse` dla danych z API, `ProjectDto[]` dla listy.
- Propsy: Brak (jako strona Astro, używa locals.supabase dla auth).

### ProjectsList

- Opis komponentu: Wyświetla listę projektów w formie responsywnej siatki kafelków używając Tailwind i Shadcn/ui komponentów (np. Card).
- Główne elementy: `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">` z mapowaniem `ProjectCard`.
- Obsługiwane zdarzenia: Brak; przekazuje props do ProjectCard.
- Obsługiwana walidacja: Brak.
- Typy: `projects: ProjectDto[]`.
- Propsy: `{ projects: ProjectDto[], onEdit: (id: string) => void, onDelete: (id: string) => void }`.

### ProjectCard

- Opis komponentu: Pojedynczy kafelek projektu, wyświetlający nazwę, technologie, status oraz przyciski edycji i usuwania. Używa Shadcn/ui Button i Badge.
- Główne elementy: `<Card>` z Shadcn/ui, zawierający `<h3>` dla nazwy, `<Badge>` dla statusu i technologii, przyciski `<Button>` dla edycji/usuwania.
- Obsługiwane zdarzenia: `onClickEdit` - otwiera formularz edycji (przekierowanie), `onClickDelete` - potwierdzenie i usunięcie via API.
- Obsługiwana walidacja: Walidacja potwierdzenia usunięcia (dialog z Shadcn/ui Dialog).
- Typy: `ProjectDto` dla danych projektu.
- Propsy: `{ project: ProjectDto, onEdit: (id: string) => void, onDelete: (id: string) => void }`.

### EmptyState

- Opis komponentu: Sekcja dla nowych użytkowników bez projektów, z przyjaznym komunikatem i przyciskiem CTA do dodania projektu. Używa Shadcn/ui dla ikon i przycisków.
- Główne elementy: `<div class="text-center py-12">` z ikoną, tekstem "Nie masz jeszcze żadnych projektów. Dodaj swój pierwszy!" i `<Button>` "Dodaj projekt".
- Obsługiwane zdarzenia: `onClick` przycisku - przekierowanie do `/projects/create` lub otwarcia modala.
- Obsługiwana walidacja: Brak.
- Typy: Brak specyficznych.
- Propsy: `{ onAddProject: () => void }`.

### LoadingSpinner

- Opis komponentu: Prosty spinner dla stanu ładowania podczas pobierania projektów.
- Główne elementy: Użyj Shadcn/ui Spinner lub Tailwind animacja.
- Obsługiwane zdarzenia: Brak.
- Obsługiwana walidacja: Brak.
- Typy: Brak.
- Propsy: Brak.

## 5. Typy

Użyj istniejących typów z `src/types.ts`:

- `ProjectStatus`: Enum dla statusów projektu (PLANNING, IN_PROGRESS, MVP_COMPLETED, FINISHED).
- `ProjectDto`: Interfejs dla pojedynczego projektu (id, name, description, technologies: string[], status, repoUrl, demoUrl, previewUrl, createdAt, updatedAt).
- `ProjectsListResponse`: { projects: ProjectDto[], total: number }.

Nowe typy (jeśli potrzebne dla ViewModel):

- `ProjectsViewState`:
  - loading: boolean - stan ładowania.
  - projects: ProjectDto[] - lista projektów.
  - error: string | null - komunikat błędu.
  - total: number - całkowita liczba projektów.
- `ProjectCardProps`: { project: ProjectDto, onEdit: (id: string) => void, onDelete: (id: string) => void }.
- `ProjectsListProps`: { projects: ProjectDto[], total: number, onEdit: (id: string) => void, onDelete: (id: string) => void }.

Te typy rozszerzają istniejące DTO o stan UI, bez modyfikacji backendowych typów.

## 6. Zarządzanie stanem

Użyj React hooks w komponencie `ProjectsView` (Astro z React island):

- `useState` dla lokalnego stanu: `{ loading: true, projects: [], error: null, total: 0 }` typu `ProjectsViewState`.
- Custom hook `useProjects` (w `src/lib/useProjects.ts`):
  - Cel: Encapsuluje logikę fetchingu projektów z API, obsługę błędów i refetch.
  - Użycie: `const { projects, loading, error, refetch } = useProjects();` - używa `fetch` lub Supabase client do GET /api/projects, obsługuje autoryzację via locals.
- Brak globalnego store (np. Zustand) na MVP; lokalny stan wystarczy.

## 7. Integracja API

Integracja z endpointem GET `/api/projects` (z `src/pages/api/projects.ts`):

- Żądanie: Brak body; query params opcjonalne (limit=50 default, offset=0, sort=status:asc).
- Odpowiedź: `ProjectsListResponse` (200 OK).
- Implementacja: W custom hook `useProjects`, użyj `fetch('/api/projects', { method: 'GET', headers: { Authorization: locals.supabase.auth.token } })`, parse JSON do `ProjectsListResponse`.
- Błędy: 401 - przekieruj do login; 500 - ustaw error state.
- Wywołanie: Na mount komponentu (`useEffect`).

Dla edycji/usuwania: Zakładamy osobne API (PUT/DELETE /api/projects/[id]), ale na podstawie PRD - zaimplementować w przyszłości.

## 8. Interakcje użytkownika

- Ładowanie: Wyświetl `LoadingSpinner` podczas fetchingu.
- Pusta lista: Render `EmptyState` z przyciskiem "Dodaj projekt" - `navigate('/projects/new')` używając `useNavigate` z React Router lub Astro navigation.
- Lista projektów: Render kafelki `ProjectCard`; kliknięcie nazwy - podgląd (opcjonalnie); przycisk edycji - przekieruj do `/projects/[id]/edit`; przycisk usuwania - otwórz dialog potwierdzenia, potem DELETE API i refetch listy.
- Responsywność: Grid dostosowany do mobile/desktop z Tailwind.
- Dostępność: ARIA labels dla przycisków, focus management na EmptyState przycisku.

## 9. Warunki i walidacja

- Warunki API: Wymaga autoryzacji (401 jeśli nie zalogowany) - weryfikuj w hooku, przekieruj jeśli brak tokenu.
- Walidacja client-side: Brak dla listy (dane z API walidowane przez Zod w backendzie via `projectsQuerySchema`).
- Walidacja interakcji: Dla usuwania - potwierdzenie dialogu (Shadcn/ui AlertDialog); sprawdź czy userId pasuje (backend).
- Wpływ na UI: Jeśli error, wyświetl toast lub alert z komunikatem; loading blokuje interakcje.
- Pagination: Opcjonalna, ale na MVP - pobierz wszystkie (limit=50, zakładając <50 projektów).

## 10. Obsługa błędów

- Sieciowe błędy (fetch fail): Ustaw `error: "Nie udało się pobrać projektów"` i wyświetl w UI (Shadcn/ui Alert).
- 401 Unauthorized: Przekieruj do `/login` z komunikatem "Wymagane logowanie".
- 500 Internal Server Error: `error: "Błąd serwera, spróbuj ponownie"` i przycisk refetch.
- Pusta lista: Nie błąd, ale trigger EmptyState (zgodne z US-005).
- Edge cases: Brak internetu - offline detection via navigator; max projektów - brak limitu w MVP.
- Logging: Console.error dla debugu, bez wysyłania na serwer w MVP.

## 11. Kroki implementacji

1. Utwórz custom hook `useProjects` w `src/lib/hooks/useProjects.ts`: Zaimplementuj fetch z API, obsługę stanu loading/error, refetch.
2. Dodaj nowe typy do `src/types.ts`: `ProjectsViewState`, props interfaces.
3. Utwórz komponent `EmptyState` w `src/components/EmptyState.tsx`: Z ikoną (np. Plus z Lucide React), tekstem i przyciskiem.
4. Utwórz `ProjectCard` w `src/components/ProjectCard.tsx`: Użyj Shadcn Card, Badge dla status/tech, Buttons dla edit/delete z Dialog dla potwierdzenia.
5. Utwórz `ProjectsList` w `src/components/ProjectsList.tsx`: Grid z map ProjectCard.
6. W `src/pages/index.astro`: Użyj React component `<ProjectsView client:load>` z useProjects hookiem, warunkowym renderowaniem.
7. Dodaj routing: W Astro config lub middleware, chroń `/` autoryzacją; dodaj linki do create/edit.
8. Styling: Użyj Tailwind dla layoutu, Shadcn dla UI (dodaj komponenty via CLI jeśli brak).
9. Test: Ręczne testy empty state (usuń projekty), lista z danymi, edycja/usuwanie (mock API jeśli potrzeba).
10. Walidacja: Uruchom linter (ESLint), sprawdź typy (TypeScript), przetestuj responsywność.
11. Deploy: Brak zmian w strukturze; commit i push.
