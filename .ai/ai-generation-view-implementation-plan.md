# Plan implementacji widoku Generowanie danych za pomocą AI

## 1. Przegląd

Widok generowania danych za pomocą AI jest integralną częścią formularzy edycji i tworzenia projektów w aplikacji Portfol.io. Jego głównym celem jest umożliwienie użytkownikom automatycznego uzupełnienia pól opisu i technologii projektu na podstawie analizy kodu źródłowego z publicznych repozytoriów GitHub. Widok integruje się z API endpointem, który wykorzystuje sztuczną inteligencję (przez Openrouter.ai) do przetwarzania plików, z uwzględnieniem limitów użycia (5 zapytań na projekt, 8 plików na zapytanie, 100 KB na plik). Zapewnia intuicyjny interfejs z walidacją, wskaźnikami postępu i obsługą błędów, poprawiając efektywność zarządzania portfolio projektów.

## 2. Routing widoku

Widok będzie dostępny w ramach istniejących tras routingu Astro:

- `/projects/new` – dla tworzenia nowego projektu (integracja w formularzu tworzenia).
- `/projects/[id]` – dla edycji istniejącego projektu (integracja w formularzu edycji, gdzie `id` to identyfikator projektu).
  Ponieważ to komponenty osadzone w istniejących widokach, nie wymaga nowych tras; zamiast tego, komponenty AI będą warunkowo renderowane w formularzach projektów.

## 3. Struktura komponentów

Struktura komponentów opiera się na hierarchii React w ramach Astro, z wykorzystaniem Shadcn/ui dla spójnego UI. Główny widok formularza projektu zawiera podkomponenty AI:

- ProjectForm (główny formularz edycji/tworzenia)
  - AISection (sekcja dedykowana generowaniu AI)
    - AIGenerateButton (przycisk inicjalizujący generowanie)
    - FileLinksInput (pole tekstowe dla linków do plików)
    - AIProgressIndicator (wskaźnik postępu i ładowania)
    - AILimitInfo (wyświetlanie informacji o limitach i liczbie zapytań)

Hierarchia zapewnia modularność: AISection jest opcjonalny i renderowany tylko w trybie edycji lub tworzenia.

## 4. Szczegóły komponentów

### ProjectForm

- Opis komponentu: Główny formularz do tworzenia lub edycji projektu, integrujący sekcję AI. Składa się z pól formularza (nazwa, opis, technologie itp.) oraz warunkowo sekcji AI. Używa React Hook Form dla zarządzania formularzem i walidacji.
- Główne elementy: `<form>`, pola input (tekstowe, select dla statusu), upload dla previewUrl, oraz `<AISection />` poniżej pól opisu i technologii.
- Obsługiwane zdarzenia: `onSubmit` dla zapisywania projektu, `onAI Generate` do wyzwalania API AI.
- Obsługiwana walidacja: Walidacja pól projektu (wymagane: nazwa, opis, technologie, status); integracja z walidacją AI (limity plików).
- Typy: Używa `CreateProjectDto` i `UpdateProjectDto` z types.ts; ViewModel: `ProjectFormData` (rozszerzony o stany AI).
- Propsy: `initialData?: ProjectDto`, `projectId?: string`, `onSubmit: (data: CreateProjectDto) => Promise<void>`, `isEditMode: boolean`.

### AISection

- Opis komponentu: Sekcja dedykowana integracji AI, widoczna w formularzu edycji/tworzenia. Zawiera przycisk, input linków i wskaźniki. Używa custom hooka do zarządzania stanem AI.
- Główne elementy: `<div className="ai-section">`, `<AIGenerateButton />`, `<FileLinksInput />` (ukryty domyślnie), `<AIProgressIndicator />`, `<AILimitInfo />`.
- Obsługiwane zdarzenia: `onGenerateClick` – pokazuje input i inicjuje zapytanie; `onFilesSubmit` – waliduje i wysyła do API.
- Obsługiwana walidacja: Liczba plików ≤8 ale >=1, każdy URL GitHub raw, symulacja rozmiaru (jeśli możliwe); sprawdzenie queryCount <5.
- Typy: `GenerateProjectAIRequest`, `GenerateProjectAIResponse`; ViewModel: `AIState` (isOpen, fileLinks, isLoading, queryCount, error).
- Propsy: `projectId: string`, `onAIGenerate: (request: GenerateProjectAIRequest) => Promise<GenerateProjectAIResponse>`, `queryCount: number`, `onUpdateProject: (updates: Partial<ProjectDto>) => void`.

### AIGenerateButton

- Opis komponentu: Przycisk wyzwalający generowanie AI. Używa komponentu Button z Shadcn/ui, z ikoną AI i tekstem. Blokowany po osiągnięciu limitu.
- Główne elementy: `<Button variant="outline" disabled={queryCount >=5}>Generuj z AI</Button>`, tooltip z limitem.
- Obsługiwane zdarzenia: `onClick` – toggluje widoczność inputu; jeśli limit, pokazuje info.
- Obsługiwana walidacja: Sprawdza queryCount przed aktywacją.
- Typy: Brak nowych; używa `queryCount: number`.
- Propsy: `onClick: () => void`, `disabled: boolean`, `queryCount: number`.

### FileLinksInput

- Opis komponentu: Pole tekstowe (textarea) do wklejania linków do plików GitHub (jeden na linię). Używa Textarea z Shadcn/ui, z placeholderem i walidacją.
- Główne elementy: `<Textarea placeholder="Wklej linki do plików (jeden na linię)..."></Textarea>`, przycisk "Analizuj".
- Obsługiwane zdarzenia: `onChange` – aktualizuje fileLinks; `onSubmit` – waliduje i wywołuje API.
- Obsługiwana walidacja: Podział na linie, ≤8 linków, walidacja URL (raw.githubusercontent.com), ostrzeżenie o rozmiarze (klient-side check jeśli fetch).
- Typy: `fileLinks: string[]`; ViewModel: `FileLinksValidation` (valid, errors: string[]).
- Propsy: `value: string`, `onChange: (value: string) => void`, `onSubmit: (links: string[]) => void`, `isLoading: boolean`.

### AIProgressIndicator

- Opis komponentu: Wskaźnik postępu dla operacji AI (ładowanie, sukces/błąd). Używa Progress z Shadcn/ui i Alert dla statusu.
- Główne elementy: `<Progress value={progress} />` (jeśli multi-step), `<Spinner />` dla loading, ARIA live dla update'ów.
- Obsługiwane zdarzenia: Brak; reaktywny na stan (isLoading, error).
- Obsługiwana walidacja: Brak.
- Typy: `AIStatus` (idle, loading, success, error).
- Propsy: `status: AIStatus`, `progress?: number`, `message?: string`.

### AILimitInfo

- Opis komponentu: Statyczny/reatywny komponent wyświetlający info o limitach i bieżącej liczbie zapytań.
- Główne elementy: `<Badge>Użyte zapytania: {queryCount}/5</Badge>`, tekst z ostrzeżeniem.
- Obsługiwane zdarzenia: Brak.
- Obsługiwana walidacja: Brak.
- Typy: `queryCount: number`.
- Propsy: `queryCount: number`, `maxQueries: number`.

## 5. Typy

Wykorzystujemy istniejące typy z `src/types.ts` (backendowe DTO). Rozszerzamy inline frontendowe ViewModel i typy pomocnicze. Nowe typy definiujemy inline w hooku/komponentach.

- **Istniejące typy (z types.ts)**:
  - `ProjectDto`: Interfejs pełnego projektu (id, name, description, technologies: string[], status: ProjectStatus, repoUrl?: string | null, demoUrl?: string | null, previewUrl?: string | null, createdAt: string, updatedAt: string).
  - `CreateProjectDto`: Dla tworzenia (wszystkie pola z ProjectDto bez id/createdAt/updatedAt).
  - `UpdateProjectDto`: Partial<CreateProjectDto> dla aktualizacji.
  - `GenerateProjectAIRequest`: { fileLinks: string[] } – żądanie do API (max 8).
  - `GenerateProjectAIResponse`: { description: string, technologies: string[], queryCount: number } – odpowiedź z AI.

- **Nowe typy ViewModel (frontend-specific)**:
  - `AIState`: Zarządza stanem sekcji AI.
    - isOpen: boolean – czy input linków jest widoczny.
    - fileLinks: string – surowy tekst inputu (string, nie array, dla textarea).
    - parsedLinks: string[] | null – sparsowane linki po walidacji.
    - isLoading: boolean – status ładowania API.
    - queryCount: number – bieżąca liczba zapytań (z API lub stanu projektu).
    - error: string | null – komunikat błędu (np. "Za dużo plików").
    - status: 'idle' | 'loading' | 'success' | 'error' – stan operacji.
  - `FileLinksValidation`: { valid: boolean, links: string[], errors: string[] } – wynik walidacji inputu (sprawdza URL, liczbę, format GitHub raw).
  - `ProjectFormData`: Rozszerzenie CreateProjectDto o stany AI.
    - ...CreateProjectDto
    - aiQueryCount?: number
    - aiError?: string
  - `AIStatus`: Union type dla statusu progressu, jak wyżej.

Typy zapewniają type-safety w TS, z walidacją na poziomie runtime (np. Zod dla inputu, ale skoro nie określono, użyć prostych checków).

## 6. Zarządzanie stanem

Stan jest zarządzany lokalnie w komponentach React za pomocą `useState` i `useEffect`, z integracją React Hook Form dla całego formularza. Dla sekcji AI, zalecany custom hook `useAIGeneration` do enkapsulacji logiki:

- **useAIGeneration(projectId: string, onUpdate: (updates: Partial<ProjectDto>) => void)**:
  - Zwraca: { state: AIState, openInput: () => void, generateAI: (links: string[]) => Promise<void>, validateLinks: (input: string) => FileLinksValidation, isButtonDisabled: boolean }.
  - Cel: Zarządza stanem AI (otwieranie inputu, walidacja, вызов API, update pól projektu po sukcesie).
  - Użycie: W AISection, hook inicjalizuje stan z queryCount z props (z ProjectDto lub fetch), obsługuje loading via isLoading, aktualizuje description/technologies w formularzu po odpowiedzi.

Globalny stan (np. via Context) nie jest potrzebny, gdyż AI jest lokalne do projektu. Persystencja via Supabase (już w API).

## 7. Integracja API

Integracja z endpointem POST `/api/projects/${projectId}/ai-generate` odbywa się via `fetch` w custom hooku `useAIGeneration`.

- **Żądanie**: `GenerateProjectAIRequest` – { fileLinks: string[] } (walidowane klient-side przed send).
- **Odpowiedź**: `GenerateProjectAIResponse` – { description: string, technologies: string[], queryCount: number }.
- **Implementacja**: W hooku, `generateAI` parsuje input, waliduje, wysyła POST z JSON body, obsługuje response: na sukces, update stanu formularza (setValue('description', response.description), setValue('technologies', response.technologies)), aktualizuje queryCount. Błędy: parse JSON error, set error state.
- Headers: { 'Content-Type': 'application/json' }, credentials: 'include' dla Supabase auth.
- Precyzja: Tylko dla trybu edycji (projectId wymagany); dla /new, przycisk ukryty lub disabled (brak ID do logowania query).

## 8. Interakcje użytkownika

- **Kliknięcie "Generuj z AI"**: Jeśli queryCount <5, toggluje widoczność FileLinksInput; jeśli >=5, pokazuje tooltip/Alert z info o limicie. ARIA: aria-expanded dla sekcji.
- **Wklejenie/wpisanie linków**: onChange aktualizuje stan; przycisk "Analizuj" waliduje i inicjuje API (set isLoading true, disable button).
- **Podczas ładowania**: Pokazuje Spinner/Progress, blokuje input; ARIA live: "Analiza w toku...".
- **Po sukcesie**: Wypełnia pola opisu/technologii, zamyka input, pokazuje Alert success ("Wygenerowano! Edytuj przed zapisem."), aktualizuje queryCount.
- **Edycja po AI**: Użytkownik może modyfikować pola; przycisk AI pozostaje dostępny do kolejnego użycia (do limitu).
- **Zamknięcie**: Anuluj (jeśli loading? – abort fetch via AbortController).
- Dostępność: Labels dla inputów, role="progressbar" dla progress, screen-reader friendly błędy via Alert z role="alert".

## 9. Warunki i walidacja

Walidacja jest dwupoziomowa: klient-side (UI) i serwer-side (API). Dotyczy komponentów FileLinksInput i AIGenerateButton.

- **Klient-side**:
  - Liczba plików: ≤8 (split input by \n, trim, filter empty); error jeśli >8: "Maksymalnie 8 plików".
  - Format URL: Regex dla raw.githubusercontent.com (np. /^https:\/\/raw\.githubusercontent\.com\/.+\/.+\/.+\/.+$/); error: "Nieprawidłowy link GitHub raw".
  - Rozmiar pliku: Symulacja – fetch head lub pre-check (ale costly; ostrzeżenie: "Sprawdź rozmiary plików <100KB"); API egzekwuje serwer-side.
  - Limit zapytań: queryCount >=5 → disable button, pokaż Badge/Tooltip: "Limit 5 zapytań osiągnięty".
  - Wpływ: Błędy set error state, uniemożliwiają submit; success enable save.

- **Komponenty**: FileLinksInput – walidacja onBlur/onSubmit; AIGenerateButton – check queryCount prop; AISection – agreguje stany.

- **Inne**: Dla /new – hide AI lub warn "AI dostępne po zapisaniu projektu" (brak projectId).

## 10. Obsługa błędów

Obsługa błędów jest reaktywna, z user-friendly komunikatami i fallbackami:

- **Błędy walidacji**: Klient-side – display inline errors pod inputem (via Alert z variant="destructive"); np. "Za dużo linków" blokuje submit.
- **Błędy API**:
  - 400: "Nieprawidłowe dane (np. za duże pliki)" – set error, show Alert.
  - 429: "Osiągnięto limit zapytań" – disable button, update UI (choć klient-side check powinien zapobiec).
  - 401/403: "Brak autoryzacji" – redirect do login lub show error (Supabase auth obsługuje).
  - 404: "Projekt nie znaleziony" – fallback do empty state.
  - 500: "Błąd serwera AI" – retry button? Set error, log console.
- **Network errors**: Timeout/fetch fail – "Sprawdź połączenie", retry option.
- **Edge cases**: Pusty input – warn; invalid JSON response – generic error.
- UI: Użyj Toaster z Shadcn/ui dla globalnych błędów; ARIA live dla dynamicznych update'ów. Log errors do console dla dev.

## 11. Kroki implementacji

1. **Przygotowanie typów**: Dodaj nowe typy ViewModel (AIState, FileLinksValidation, AIStatus) inline. Rozszerz ProjectFormData o pola AI.

2. **Stwórz custom hook**: Implementuj `useAIGeneration` w `src/lib/hooks/useAIGeneration.ts`: zarządzaj stanem, walidacją linków (split, regex), fetch do API z AbortController, update form values po sukcesie.

3. **Implementuj komponenty UI**:
   - Stwórz `AIGenerateButton.tsx`, `FileLinksInput.tsx`, `AIProgressIndicator.tsx`, `AILimitInfo.tsx` w `src/components/ai/` używając Shadcn/ui (Button, Textarea, Progress, Alert, Badge).
   - Zintegruj w `AISection.tsx`: użyj hooka, conditional render (isOpen ? Input : null), handle events.

4. **Integracja z formularzem**: W istniejącym `ProjectForm` (lub utwórz jeśli brak, np. `useProjectForm.ts`): dodaj `<AISection />` po polach description/technologies. Użyj React Hook Form: setValue/update na sukcesie AI. Pobierz queryCount z initialData lub fetch.

5. **Walidacja i stany**: Dodaj walidację w FileLinksInput (useState dla errors). Obsłuż loading: disable inputs, show spinner. Dla /new: conditional render AISection tylko jeśli projectId.

6. **Obsługa błędów i dostępność**: Dodaj error boundaries lub try-catch w hooku. Użyj ARIA: aria-label, role="alert" dla błędów, live regions dla progress.

7. **Testowanie**: Unit testy dla hooka (walidacja, mock fetch); e2e dla flow (Cypress: kliknij button, wpisz linki, assert update pól). Sprawdź limity, błędy.

8. **Stylizacja**: Użyj Tailwind: classes dla sekcji (border, p-4), responsive. Integruj z istniejącym designem Shadcn.

9. **Integracja z routingiem**: W `src/pages/projects/[id].astro` i `/new.astro`: render `<ProjectForm isEditMode={!!id} projectId={id} initialData={project} />` via React island.

10. **Finalne sprawdzenie**: Uruchom app, przetestuj flow: generate AI <5x, sprawdź limity, edycję po AI, błędy. Upewnij się zgodności z PRD (US-010, US-011).
