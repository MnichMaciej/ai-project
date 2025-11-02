# Plan implementacji widoku edycji projektu

## 1. Przegląd

Widok edycji projektu (/projects/:id/edit) umożliwia użytkownikowi edytowanie istniejących informacji o projekcie, w tym integrację z AI do automatycznego generowania opisu i listy technologii na podstawie linków do plików GitHub. Głównym celem jest zapewnienie intuicyjnego interfejsu do aktualizacji pól projektu (nazwa, opis, technologie, status, URL-e), z obsługą walidacji, limitów zapytań AI (maks. 5 na projekt) oraz aktualizacji optymistycznych dla lepszego UX. Widok jest zgodny z user story US-008, wykorzystuje endpoint PATCH /api/projects/{id} do zapisywania zmian i integruje się z endpointem AI do generowania treści. Aby uniknąć duplikacji kodu, reużyjemy istniejący formularz z widoku tworzenia (ProjectForm.tsx i useProjectForm.ts), dostosowując go do trybu edycji.

## 2. Routing widoku

Ścieżka widoku: `/projects/:id/edit`, gdzie `:id` to UUID projektu. Routing powinien być zdefiniowany w Astro pages jako dynamiczny route w `./src/pages/projects/[id]/edit.astro`, renderujący komponent React dla interaktywności. Po zapisaniu zmian, przekierowanie na `/projects` (lista projektów).

## 3. Struktura komponentów

Hierarchia komponentów (w React, osadzona w Astro page), z reużyciem z widoku tworzenia:

- `ProjectEditView` (główny kontener, wariant NewProjectView.tsx – zarządza layoutem i routingiem, reużywa strukturę z headerem i kontenerem Tailwind)
  - `ProjectHeader` (nagłówek z nazwą projektu i przyciskiem powrotu; reużyj z NewProjectView)
  - `ProjectForm` (reużyj z src/components/ProjectForm.tsx w trybie 'edit' – formularz edycji pól projektu)
    - `TextInput` (dla name, description, URL-i; z Shadcn/ui, już w ProjectForm)
    - `Select` (dla status; z enum ProjectStatus, już w ProjectForm)
    - `TagsInput` (dla technologies; multi-select lub chips z Shadcn/ui, już w ProjectForm)
  - `AIIntegrationSection` (nowa sekcja z przyciskiem AI, po formularzu)
    - `AIGenerateButton` (otwiera modal)
    - `AIGenerateModal` (textarea dla fileLinks, przycisk submit, progress bar; z Shadcn/ui Dialog/Progress)
      - `ProgressIndicator` (loading spinner podczas generowania)
      - `QueryLimitBadge` (wyświetla pozostałe zapytania, np. "Pozostało 3/5"; z Shadcn/ui Badge)
  - `SaveButton` (przycisk zapisu, disabled podczas submitu; reużyj Button z Shadcn/ui)
  - `ErrorModal` (modal dla błędów, np. limity AI, błędy API; z Shadcn/ui Dialog/Alert)

## 4. Szczegóły komponentów

### ProjectEditView

- **Opis komponentu**: Główny komponent widoku (wariant NewProjectView.tsx), odpowiedzialny za layout strony, reużywa kontener Tailwind i header z tworzenia. Zarządza stanem globalnym via hook, renderuje ProjectForm i AI sekcję.
- **Główne elementy**: `<div className="container mx-auto px-4 py-8 max-w-4xl">` (reużyty), `<h1>` "Edytuj projekt", `<ProjectForm mode="edit" />`, `<AIIntegrationSection />`.
- **Obsługiwane zdarzenia**: onLoad (fetch project via hook), onFormSubmit (PATCH update), onAIError (pokaz modal).
- **Warunki walidacji**: Sprawdzenie własności projektu (via API response), walidacja formularza przed submit (reużyty Zod schema), limit zapytań AI (jeśli queryCount >=5, disable button).
- **Typy**: ProjectDto (dane projektu), UpdateProjectDto (dla submit), GenerateProjectAIResponse (dla AI).
- **Propsy**: `projectId: string` (z params), `initialProject?: ProjectDto` (opcjonalnie z SSR).

### ProjectForm

- **Opis komponentu**: Reużyty z src/components/ProjectForm.tsx (dostosuj prop `mode: 'create' | 'edit'` dla tytułu i walidacji partial). Formularz do edycji pól projektu, wstępnie wypełniony danymi z ProjectDto. Obsługuje zmiany inline i walidację pól.
- **Główne elementy**: `<Card>` z `<form>` (reużyty): Input dla name/description/repoUrl/demoUrl/previewUrl, Select dla status, dynamic tags dla technologies (już zaimplementowane).
- **Obsługiwane zdarzenia**: onChange (aktualizacja stanu form), onSubmit (wywołanie PATCH via hook).
- **Warunki walidacji**: Name: required, min 3 chars; Description: required, max 1000 chars; Technologies: min 1, max 10; URLs: valid URL or null; Status: z enum. Użyj reużyty Zod schema dla partial updates (dostosuj resolver w hooku).
- **Typy**: UpdateProjectDto (dla form data, reużyty z CreateProjectFormData), ProjectStatus (enum).
- **Propsy**: `form: UseFormReturn<UpdateProjectFormData>`, `mode: 'edit'`, `onSubmit: (data: UpdateProjectDto) => Promise<void>`, `isSubmitting: boolean`, `onCancel: () => void`.

### AIIntegrationSection

- **Opis komponentu**: Nowa sekcja integracji z AI, zawierająca przycisk do generowania opisu/technologii na podstawie linków plików. Obsługuje limity i progress. Umieść po ProjectForm.
- **Główne elementy**: `<section>` z buttonem, badge'em limitu; modal z `<textarea>` dla fileLinks (Shadcn/ui).
- **Obsługiwane zdarzenia**: onAIGenerateClick (otwórz modal), onLinksSubmit (wyślij do API AI, zaktualizuj form via setValue w hooku).
- **Warunki walidacji**: FileLinks: array stringów (GitHub URLs), max 8, każdy URL valid, total size <100KB (assume URL only); Query limit <5.
- **Typy**: GenerateProjectAIRequest { fileLinks: string[] }, GenerateProjectAIResponse { description, technologies, queryCount }.
- **Propsy**: `projectId: string`, `currentQueryCount: number`, `onGenerateSuccess: (data: GenerateProjectAIResponse) => void`, `form` (do update fields), `maxQueries: 5`.

### AIGenerateModal

- **Opis komponentu**: Modal (z Shadcn/ui Dialog) do wprowadzania linków plików i triggerowania generowania AI. Wyświetla progress i błędy.
- **Główne elementy**: Dialog z headerem, `<textarea>` (rows=5, placeholder="Wklej linki GitHub..."), Button submit, Progress (z Shadcn/ui).
- **Obsługiwane zdarzenia**: onOpenChange, onSubmit (waliduj i API call).
- **Warunki walidacji**: Links: split by newline, trim, validate URL, count <=8; Jeśli przekroczono limit, error message.
- **Typy**: GenerateProjectAIRequest.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `onSubmit: (links: string[]) => Promise<void>`, `isGenerating: boolean`.

### ErrorModal

- **Opis komponentu**: Modal do wyświetlania błędów (np. "Przekroczono limit zapytań", "Błąd API").
- **Główne elementy**: Dialog z Alert (Shadcn/ui), przycisk close.
- **Obsługiwane zdarzenia**: onClose.
- **Warunki walidacji**: Brak, tylko display.
- **Typy**: { message: string, type: 'error' | 'warning' }.
- **Propsy**: `isOpen: boolean`, `error: AIErrorType`, `onClose: () => void`.

## 5. Typy

Wykorzystaj istniejące typy z `src/types.ts` (ProjectDto, UpdateProjectDto = Partial<CreateProjectDto>, ProjectStatus, GenerateProjectAIRequest { fileLinks: string[] }, GenerateProjectAIResponse { description: string, technologies: string[], queryCount: number }).

Nowe typy/ViewModel (dodaj lokalnie; bazuj na istniejących z tworzenia):

- `UpdateProjectFormData` extends UpdateProjectDto (reużyty z CreateProjectFormData, ale partial):
  - name?: string (required w schemacie, ale optional dla partial)
  - description?: string
  - technologies?: string[] (min 1 jeśli podane)
  - status?: ProjectStatus
  - repoUrl?: string | null
  - demoUrl?: string | null
  - previewUrl?: string | null
    Powiązane: ProjectStatus enum (istniejący).

- `AIErrorType`: { message: string, code?: number } (dla błędów jak 429 dla limitu).

- `ProjectEditState`: { project: ProjectDto | null, formData: UpdateProjectFormData, isLoading: boolean, isSubmitting: boolean, isAIGenerating: boolean, queryCount: number, errors: AIErrorType[] } (ViewModel dla stanu strony).

Te typy zapewniają type-safety w React (useState, props), walidację Zod (reużyty schema) i zgodność z API.

## 6. Zarządzanie stanem

Stan zarządzany lokalnie w `ProjectEditView` via reużyty React useState i useReducer dla złożonych akcji (update form, AI generate). Stwórz custom hook `useProjectEditForm` (wariant useProjectForm.ts z src/lib/hooks):

- Cel: Encapsuluje fetch (GET /api/projects/{id}), update (PATCH), AI generate (POST /api/projects/{id}/ai), obsługę loading/error. Reużywa logikę z useProjectForm (form setup, onSubmit transform, error handling).
- Użycie: const { form, isSubmitting, onSubmit, initialData, generateAI, queryCount, ... } = useProjectEditForm(projectId); – pre-fill form.reset(initialData) w useEffect.
- Integracja: useEffect dla initial fetch (z ProjectDto), optimistic updates (update formData przed API, rollback on error). Użyj useSWR lub fetch z AbortController dla cancel. Dla AI: separate state dla modal i progress; na sukces update form via setValue.

Brak globalnego store (Redux/Zustand) – lokalny stan wystarcza dla tej strony.

## 7. Integracja API

Integracja z endpointem PATCH /api/projects/{id} (opisany w Endpoint Description i Implementation):

- **Żądanie**: PATCH JSON z UpdateProjectDto (partial, np. { description: "new desc", technologies: ["React"] }). Walidacja Zod w backendzie (updateProjectSchema; reużyta z tworzenia).
- **Odpowiedź**: 200 OK z { ...updatedProject: ProjectDto, meta: { message: "Project updated" } }.
- Użycie: W hooku useProjectEditForm (reużyty z useProjectForm), fetch via native fetch lub axios, headers: { 'Content-Type': 'application/json' }, z tokenem auth z Supabase session (reużyta logika POST, ale zmień method/endpoint).

Dla AI: Assume endpoint POST /api/projects/{id}/ai z GenerateProjectAIRequest, response GenerateProjectAIResponse. Na sukces: update formData.description i .technologies via setValue w hooku.

Obsługa błędów: Catch response.status, mapuj na AIErrorType (np. 403 -> "Not owner", redirect to /projects; reużyta z tworzenia).

## 8. Interakcje użytkownika

- **Nawigacja do edycji**: Z listy projektów, click "Edytuj" -> navigate(`/projects/${id}/edit`) via Astro Link lub React Router.
- **Wypełnienie formularza**: Automatyczne z fetched ProjectDto (via form.reset w hooku); zmiany inline (onChange) aktualizują formData (reużyty z ProjectForm).
- **Generowanie AI**: Click "Generuj z AI" -> otwórz AIGenerateModal; wklej linki (newline separated), click "Generuj" -> waliduj, pokaż progress, na sukces: auto-update description/technologies w form (via setValue), zaktualizuj queryCount, close modal.
- **Zapis zmian**: Click "Zapisz" -> waliduj form (reużyty handleSubmit), PATCH API, na sukces: toast "Zaktualizowano" (reużyty), redirect to /projects z updated data.
- **Anuluj/Powrót**: Button "Anuluj" (reużyty) -> confirm dialog, navigate back.
- **Limity**: Jeśli queryCount >=5, disable AI button, pokaż badge "Limit osiągnięty"; błędy -> ErrorModal z ARIA live.

UX: Optimistic updates dla AI (immediate preview via setValue), debounce onChange dla inputs (reużyty).

## 9. Warunki i walidacja

- **Warunki API**: Ownership (backend 403, frontend: check if project.userId matches session? ale backend handles); Partial updates (tylko zmienione pola).
- **Walidacja frontendowa** (w komponentach ProjectForm i AIGenerateModal; reużyta z tworzenia):
  - Form: Reużyty Zod schema dla UpdateProjectFormData (required fields tylko jeśli zmieniane, lengths, URL regex dla repoUrl itp.), validate onBlur/submit, display errors inline (Shadcn Form, już zaimplementowane).
  - AI: Walidacja fileLinks: parse lines, filter empty, validate each as http(s)://github.com/... , length <=8; queryCount <5 (state check, disable button).
  - Wpływ na UI: Invalid fields -> red border, error message (reużyty); disabled buttons podczas loading; ARIA-describedby dla accessibility.
- Komponenty: ProjectForm (form validation, reużyty), AIIntegrationSection (link count/limit).

## 10. Obsługa błędów

- **Błędy API**: 400 (invalid data) -> waliduj i pokaż field errors (reużyty inline); 403 (not owner) -> redirect to /projects z toast "Brak dostępu"; 404 (not found) -> 404 page; 500/network -> ErrorModal "Błąd serwera, spróbuj ponownie", retry button.
- **Błędy AI**: Limit exceeded (assume 429) -> ErrorModal "Osiągnięto limit 5 zapytań"; Invalid links -> inline error w modalu; Generation fail -> rollback fields (via form.reset), error message.
- **Edge cases**: Empty project fetch -> loading spinner; Offline -> disable submit, show warning; Unsaved changes on leave -> confirm dialog (usePrompt, dodaj do hooka).
- Logging: console.error dla dev, Sentry integration jeśli dostępne. Użyj try-catch w hookach (reużyty), ARIA live dla screen readers.

## 11. Kroki implementacji

1. Utwórz stronę Astro: `./src/pages/projects/[id]/edit.astro` z `<ProjectEditView client:load />` i params.id (podobnie jak new.astro).
2. Dostosuj istniejące typy: Dodaj UpdateProjectFormData (bazując na CreateProjectFormData), ProjectEditState, AIErrorType. Pamiętaj, że w pliku @src/types.ts są typy tylko backendowe.
3. Stwórz hook `useProjectEditForm` w `./src/lib/hooks/useProjectEditForm.ts` (copy z useProjectForm.ts: zmień na PATCH, dodaj fetch initial i AI generate).
4. Dostosuj komponenty React w `./src/components/project/` (reużyj z tworzenia):
   - ProjectEditView.tsx (wariant NewProjectView.tsx: zmień tytuł, integracja hooka, dodaj AISection).
   - ProjectForm.tsx (istniejący: dodaj prop mode="edit" dla partial walidacji i tytułu "Edytuj projekt").
   - AIIntegrationSection.tsx i AIGenerateModal.tsx (nowe: z Shadcn Dialog, Progress, Button; integruj z form.setValue).
   - ErrorModal.tsx (nowy: z Alert).
5. Dodaj stylowanie Tailwind: Reuse classes z tworzenia (max-w-4xl, p-4, space-y-6), responsive grid dla form i AI sekcji.
6. Zintegruj Shadcn/ui: Reuse istniejące (Form, Input, Select, Button); dodaj Dialog, Badge, Progress jeśli nieobecne (npx shadcn-ui add dialog badge progress).
7. Obsłuż routing: Użyj `astro:redirect` lub window.location dla sukcesu/anuluj (reużyty z tworzenia); fetch z auth headers z Supabase session.
8. Testuj: Reuse unit tests z tworzenia dla form/hooka (dostosuj do edit), dodaj e2e dla flow (Cypress: navigate, pre-fill, AI, save).
9. Accessibility: Reuse ARIA z ProjectForm (aria-invalid,-describedby), dodaj dla modali (keyboard nav, live regions dla updates).
10. Optymalizacje: Reuse debounce z tworzenia, cache project data (SWR w hooku), error boundaries dla crashów.
