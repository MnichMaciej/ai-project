# Plan implementacji widoku Widok tworzenia projektu

## 1. Przegląd

Widok tworzenia projektu (/projects/new) umożliwia użytkownikom dodanie nowego projektu do portfolio poprzez wypełnienie formularza z kluczowymi informacjami. Głównym celem jest zapewnienie intuicyjnego interfejsu do wprowadzania danych wymaganych i opcjonalnych, z walidacją i integracją z API do zapisywania projektu. Po pomyślnym zapisaniu użytkownik jest przekierowywany do listy projektów.

## 2. Routing widoku

Ścieżka widoku: `/projects/new`. Widok powinien być dostępny tylko dla zalogowanych użytkowników. Użyj Astro do routingu statycznego, z dynamicznym komponentem React dla formularza interaktywnego.

## 3. Struktura komponentów

- **NewProjectView** (główny komponent widoku)
  - **ProjectForm** (główny formularz)
    - **NameInput** (input nazwy)
    - **DescriptionInput** (textarea opisu)
    - **TechnologiesInput** (multi-select lub tag input dla technologii)
    - **StatusSelect** (select dla statusu)
    - **RepoUrlInput** (input URL repozytorium)
    - **DemoUrlInput** (input URL dema)
    - **PreviewImageInput** (input file lub URL dla podglądu)
    - **SubmitButton** (przycisk zapisu)
  - **LoadingSpinner** (opcjonalny, podczas submitu)
  - **ErrorMessage** (komponent do wyświetlania błędów)

Hierarchia: NewProjectView zawiera ProjectForm jako główne dziecko, z inputami jako wnukami.

## 4. Szczegóły komponentów

### NewProjectView

- Opis komponentu: Główny kontener widoku, zarządza routingiem, stanem aplikacji i integracją z API. Składa się z nagłówka strony i formularza projektu.
- Główne elementy: `<div>` z klasami Tailwind dla layoutu, `<h1>` dla tytułu "Dodaj nowy projekt", komponent ProjectForm.
- Obsługiwane zdarzenia: Ładowanie strony (fetch user if needed), submit formularza (wywołanie API).
- Obsługiwana walidacja: Ogólna walidacja formularza przed submit, obsługa błędów API.
- Typy: `CreateProjectDto`, `ProjectsListResponse` (dla redirect), custom `FormState`.
- Propsy: Brak (jako root komponent); eksportuje hooki jeśli potrzebne.

### ProjectForm

- Opis komponentu: Centralny komponent formularza, zarządza stanem lokalnym pól i walidacją. Używa React Hook Form dla zarządzania formularzem.
- Główne elementy: `<form>` z onSubmit, dzieci: inputy dla każdego pola, przycisk submit.
- Obsługiwane zdarzenia: onChange dla inputów, onSubmit dla zapisu.
- Obsługiwana walidacja: Wymagane pola (name, description, technologies, status), walidacja URL dla repoUrl i demoUrl (format URL), minimalna długość dla description (np. 10 znaków), niepuste technologie (min 1).
- Typy: `CreateProjectDto` dla submit data, `zod` schema z createProjectSchema.
- Propsy: `onSubmit: (data: CreateProjectDto) => Promise<void>`, `initialData?: Partial<CreateProjectDto>` (choć dla create pusty).

### NameInput

- Opis komponentu: Prosty input tekstowy dla nazwy projektu, z walidacją.
- Główne elementy: `<input type="text">` z klasami Shadcn/ui (Input komponent).
- Obsługiwane zdarzenia: onChange, onBlur.
- Obsługiwana walidacja: Wymagane, max długość 100 znaków, brak pustych stringów.
- Typy: `string`.
- Propsy: `value: string`, `onChange: (e) => void`, `error?: string`.

### DescriptionInput

- Opis komponentu: Textarea dla opisu projektu.
- Główne elementy: `<textarea>` z Shadcn/ui (Textarea).
- Obsługiwane zdarzenia: onChange, onBlur.
- Obsługiwana walidacja: Wymagane, min 10 znaków, max 1000.
- Typy: `string`.
- Propsy: `value: string`, `onChange: (e) => void`, `error?: string`.

### TechnologiesInput

- Opis komponentu: Input dla listy technologii, jako tagi lub multi-select.
- Główne elementy: Komponent tag input lub Select z multi (Shadcn/ui).
- Obsługiwane zdarzenia: onChange (dodaj/usun tag).
- Obsługiwana walidacja: Wymagane, min 1 technologia, max 10, unikalne stringi.
- Typy: `string[]`.
- Propsy: `value: string[]`, `onChange: (tags: string[]) => void`, `error?: string`.

### StatusSelect

- Opis komponentu: Dropdown dla wyboru statusu projektu.
- Główne elementy: Shadcn/ui Select z opcjami z ProjectStatus.
- Obsługiwane zdarzenia: onChange.
- Obsługiwana walidacja: Wymagane (domyślnie PLANNING?).
- Typy: `ProjectStatus`.
- Propsy: `value: ProjectStatus`, `onChange: (value: ProjectStatus) => void`, `error?: string`.

### RepoUrlInput

- Opis komponentu: Input dla URL repozytorium.
- Główne elementy: `<input type="url">` z Shadcn/ui.
- Obsługiwane zdarzenia: onChange, onBlur.
- Obsługiwana walidacja: Opcjonalne, jeśli podane to valid URL (zod url()).
- Typy: `string | null`.
- Propsy: `value: string`, `onChange: (e) => void`, `error?: string`.

### DemoUrlInput

- Opis komponentu: Input dla URL dema.
- Główne elementy: `<input type="url">`.
- Obsługiwane zdarzenia: onChange, onBlur.
- Obsługiwana walidacja: Opcjonalne, valid URL.
- Typy: `string | null`.
- Propsy: Jak RepoUrlInput.

### PreviewImageInput

- Opis komponentu: Input dla pliku obrazu lub URL podglądu.
- Główne elementy: `<input type="file" accept="image/*">` lub URL input, z podglądem.
- Obsługiwane zdarzenia: onChange (upload lub URL).
- Obsługiwana walidacja: Opcjonalne, max rozmiar 5MB, valid image lub URL.
- Typy: `File | string | null` (trzeba obsłużyć upload do Supabase lub URL).
- Propsy: `value: string | null`, `onChange: (fileOrUrl: File | string | null) => void`, `error?: string`.

### SubmitButton

- Opis komponentu: Przycisk do zapisywania projektu.
- Główne elementy: `<button type="submit">` z Shadcn/ui Button, disabled podczas loading.
- Obsługiwane zdarzenia: onClick (via form submit).
- Obsługiwana walidacja: Brak, zależy od form.
- Typy: Brak.
- Propsy: `disabled: boolean`, `loading: boolean`.

## 5. Typy

- **Istniejące typy z src/types.ts**:
  - `ProjectStatus`: Enum z wartościami PLANNING, IN_PROGRESS, MVP_COMPLETED, FINISHED.
  - `CreateProjectDto`: { name: string; description: string; technologies: string[]; status: ProjectStatus; repoUrl: string | null; demoUrl: string | null; previewUrl: string | null; } – używany do API request.
  - `ProjectDto`: Pełny response z id, createdAt, updatedAt.

- **Nowe typy dla widoku**:
  - `FormErrors`: { [key: string]: string } – mapa błędów walidacji dla pól.
  - `FormState`: { data: Partial<CreateProjectDto>; errors: FormErrors; isValid: boolean; isSubmitting: boolean; } – stan formularza.
  - `PreviewImageState`: { file?: File; url?: string; preview?: string; } – dla obsługi podglądu (generuj URL.createObjectURL dla file).
  - `SubmitHandler`: (data: CreateProjectDto) => Promise<{ success: boolean; error?: string }>.

Te typy zapewniają type-safety w React komponentach i hookach. Typy widoku nie powinny znajdować się w pliku src/types.ts

## 6. Zarządzanie stanem

Stan zarządzany lokalnie w NewProjectView za pomocą React useState i useReducer dla złożonego stanu formularza. Użyj React Hook Form z zod resolver dla walidacji i zarządzania polami. Custom hook `useProjectForm` do inicjalizacji form, obsługi submit i walidacji. Globalny stan (np. user via Supabase auth) z kontekstem lub locals w Astro. Loading state podczas API call, errors w stanie lokalnym. Brak potrzeby Redux, lokalny stan wystarczy.

## 7. Integracja API

Integracja z endpointem POST `/api/projects` (src/pages/api/projects.ts).

- **Żądanie**: POST JSON z body: CreateProjectDto, headers: Content-Type application/json. Użyj fetch lub axios w hooku.
- **Odpowiedź**: 201 z ProjectDto (nowy projekt), lub 400/500 z { error: string, details?: string[] }.
- W hooku: await fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }), parse response, na success redirect do /projects via useNavigate lub window.location. Obsługa DEFAULT_USER_ID z locals.supabase.

## 8. Interakcje użytkownika

- Wypełnianie pól: onChange aktualizuje stan, walidacja live (np. zielony border dla valid).
- Wybór statusu: Dropdown z opcjami enum, default PLANNING.
- Dodawanie technologii: Tag input, przycisk + do dodania, X do usunięcia.
- Upload podglądu: Wybór pliku generuje preview, lub paste URL.
- Submit: Kliknięcie przycisku sprawdza walidację, pokazuje loading, wysyła API, na success toast "Projekt dodany" i redirect, na error pokazuje błędy.
- Anuluj: Przycisk powrót do listy projektów.
- Klawiatura: Enter submit, Tab navigation, ARIA labels dla dostępności.

## 9. Warunki i walidacja

Walidacja client-side z React Hook Form + zod (createProjectSchema z validators).

- **Wymagane pola** (ProjectForm): name (!empty, length 1-100), description (!empty, length 10-1000), technologies (array length >=1, unique), status (enum value).
- **Opcjonalne**: repoUrl/demoUrl (zod.url() jeśli nie null), previewUrl (zod.string().url().optional() lub file validation).
- Wpływ: Błędy wyświetlają pod inputami (czerwony border, message), disable submit jeśli !isValid. Server-side walidacja z API response details, merge z client errors.

## 10. Obsługa błędów

- **Walidacja client**: Wyświetl błędy inline, nie wysyłaj API.
- **Network/API errors**: 400 – parse details i ustaw errors; 500 – toast "Błąd serwera"; offline – retry button.
- **Upload image**: Jeśli file >5MB lub invalid type – error message.
- **Edge cases**: Puste form – prevent submit; duplicate name? (nie walidowane, server obsłuży).
- Użyj Sonner dla toastów błędów/sukcesu.

## 11. Kroki implementacji

1. Utwórz stronę Astro w `src/pages/projects/new.astro`: Import React komponent NewProjectView, dodaj layout, title "Dodaj projekt".
2. Stwórz komponenty React w `src/components`: NewProjectView.tsx, ProjectForm.tsx, i inputy (użyj Shadcn/ui: Input, Textarea, Select, Button).
3. Zdefiniuj custom hook `useProjectForm` w `src/lib/hooks/useProjectForm.ts`: Integracja z React Hook Form, zod, fetch API.
4. Dodaj typy jeśli nowe (FormState etc.) lokalnie.
5. Implementuj walidację: Rozszerz createProjectSchema o client rules (zod).
6. Dodaj stylowanie Tailwind: Form w card, responsive, dark mode.
7. Dodaj empty state lub back button.
