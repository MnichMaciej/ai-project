# Dokumentacja Specyfikacji: Fallback Modeli AI w Integracji z OpenRouter

## Wstęp

Na podstawie analizy dokumentu wymagań produktu (PRD.md), stosu technologicznego (tech-stack.md) oraz user stories (US-010 i US-011), opracowano architekturę dla rozszerzenia istniejącej funkcjonalności integracji z AI. Główne założenie to zapewnienie mechanizmu fallbacku modeli AI w przypadku błędu domyślnego modelu (google/gemini-2.0-flash-exp:free), z sekwencyjnym przełączaniem na alternatywne modele: deepseek/deepseek-chat-v3.1:free, a następnie openai/gpt-oss-20b:free. Architektura zachowuje zgodność z istniejącym kodem (ai.service.ts i openrouter.service.ts), nie naruszając mechanizmów walidacji limitów (5 zapytań na projekt, 8 plików na zapytanie, 100KB na plik), obsługi błędów i struktury backendu opartego na Supabase oraz Astro. Specyfikacja skupia się na logice backendowej, bez szczegółów implementacyjnych, wskazując kluczowe komponenty, moduły, serwisy i kontrakty.

## 1. Logika Backendowa

### Struktura Endpointów API i Modeli Danych

- **Endpointy API**: Istniejący endpoint `/api/projects/ai-generate` (zgodny z PRD i user story US-010) zostanie rozszerzony o parametr `modelFallback` (opcjonalny, domyślnie true), umożliwiający aktywację mechanizmu fallbacku. Endpoint będzie obsługiwał POST z payloadem zawierającym `projectId` (ID projektu z tabeli Supabase `projects`), `fileLinks` (tablica stringów z linkami do plików GitHub) oraz opcjonalnie `preferredModel` (string z ID modelu). Odpowiedź API zwróci obiekt zgodny z modelem `AIGenerateResponse` (opisany poniżej), integrując się z frontendem (formularz edycji projektu w komponencie ProjectForm.tsx).
- **Modele Danych (Typy TypeScript)**:
  - `AIGenerateRequest`: Interfejs z polami `{ projectId: string; fileLinks: string[]; preferredModel?: string; }`. Zgodny z istniejącymi typami z `src/types.ts` (np. rozszerzenie `ProjectDTO` o pola AI).
  - `AIGenerateResponse`: Interfejs `{ success: boolean; description: string; technologies: string[]; error?: string; aiQueriesCount: number; }`. Pola `description` i `technologies` zgodne z wymaganiami PRD (opis po polsku, 200-1000 znaków; lista do 10 technologii). `aiQueriesCount` śledzi limit z US-011.
  - `FallbackModelConfig`: Nowy typ konfiguracyjny `{ default: string; fallbacks: string[]; }` definiujący sekwencję modeli (google/gemini-2.0-flash-exp:free → deepseek/deepseek-chat-v3.1:free → openai/gpt-oss-20b:free). Przechowywany w env lub konfiguracji serwisu.

- **Integracja z Supabase**: Endpoint będzie aktualizował kolumnę `ai_queries_count` w tabeli `projects` (zgodne z migracjami Supabase). Modele danych będą walidowane za pomocą istniejących schematów Zod z `src/lib/validators/` (np. `z.array(z.string().url().refine(isGitHubRawUrl))` dla `fileLinks`).

### Mechanizm Walidacji Danych Wejściowych

- **Walidacja Serwerowa**: Użyj istniejącego modułu `validators/` (Zod) do sprawdzenia:
  - Liczba plików ≤ 8 (z US-011).
  - Rozmiar każdego pliku ≤ 100KB (pobieranie i sprawdzenie w `fetchFilesFromGitHub` z ai.service.ts).
  - Linki muszą być do raw.githubusercontent.com (walidacja URL z regex).
  - `ai_queries_count < 5` dla projektu (query do Supabase via `project.service.ts`).
- **Walidacja Klienta**: Frontend (React komponenty) będzie pre-walidował dane przed wysłaniem (np. via `react-hook-form` z Zod resolverem), ale backendowa walidacja pozostanie ostateczna.
- **Kontrakt**: Nowy serwis `AIFallbackValidator` (moduł w ai.service.ts) zweryfikuje sekwencję modeli, odrzucając nieobsługiwane ID (tylko z `FallbackModelConfig`).

### Obsługa Wyjątków

- **Typy Błędów**: Rozszerz istniejące klasy z openrouter.service.ts (`OpenRouterError`, `ValidationError`) o `FallbackExhaustedError` (gdy wszystkie modele zawiodą) i `LimitExceededError` (dla limitów z US-011).
- **Strategia Fallbacku**: W serwisie `AIService` (ai.service.ts), po błędzie domyślnego modelu (np. status 429 lub 5xx z OpenRouterError), automatycznie przełącz na kolejny z sekwencji. Proces fallbacku odbywa się hermetycznie po stronie backendu, bez przekazywania szczegółów o modelu do frontendu. Po każdym błędzie loguj via console.error i zwiększ `ai_queries_count` tylko po sukcesie. Jeśli fallback wyczerpany, zwróć `AIGenerateResponse` z `error: "Serwis AI jest chwilowo niedostępny, spróbuj później."` (zgodne z PRD).
- **Globalna Obsługa**: W middleware (`src/middleware/index.ts`) i endpointach API, catch-all dla błędów AI z HTTP 503 (tymczasowa niedostępność) lub 429 (limit). Nie narusza istniejącej autentykacji Supabase (blokada po 5 próbach logowania z US-003).

### Aktualizacja Sposobu Renderowania Stron Server-Side (Astro)

- **Konfiguracja Astro**: Zgodne z astro.config.mjs (SSR dla API i stron dynamicznych). Endpoint `/api/projects/ai-generate` pozostanie server-side route (Astro API), renderowany po stronie serwera dla bezpieczeństwa (klucze API w env).
- **Strony Dotknięte**:
  - `/projects/edit/[id].astro`: Rozszerz o server-side fetch do endpointu AI, z hydratacją React komponentu `ProjectEditView.tsx` dla formularza (użyj `getStaticPaths` dla statycznych stron, ale dynamiczne dla edycji).
  - Profil użytkownika (`/profile.astro`): Server-side query do Supabase dla listy projektów z `ai_queries_count`, renderując `ProjectsView.tsx` z ostrzeżeniem o limicie (US-011).
- **Optymalizacja**: Użyj `Astro.locals.supabase` dla zapytań DB (zgodne z regułami backend). Dla fallbacku, renderuj loading state w komponencie via `Suspense` w React 19, bez wpływu na statyczne generowanie (SSG) dla list projektów.

## 2. Istniejąca Funkcjonalność

### ai.service.ts

- **Komponenty**: Klasa `AIService` z metodami `fetchFilesFromGitHub` (pobieranie i walidacja plików) i `callOpenrouterAI` (wywołanie API z schematem JSON dla `description` i `technologies`). `parseAIResponse` parsuje odpowiedź.
- **Rozszerzenia**: Dodaj metodę `generateWithFallback(fileLinks: string[], projectId: string)` integrującą sekwencję modeli z `FallbackModelConfig`. Zachowaj istniejący schemat odpowiedzi (JSON z polami po polsku). Nie zmieniaj logiki pobierania plików ani parsowania.
- **Kontrakt**: Eksporter `AIService` jako singleton w `src/lib/services/`, wstrzykiwany do endpointów via import.

### openrouter.service.ts

- **Komponenty**: Klasa `OpenRouterService` z `generateResponse` (główne wywołanie API z retry i walidacją), `getAvailableModels` (lista modeli), `_makeRequest` (HTTP z backoff), `_parseResponse` (parsowanie z `_cleanMarkdown` dla JSON).
- **Rozszerzenia**: Dodaj parametr `model` do `generateResponse` z fallbackiem w pętli (wywołaj sekwencyjnie z różnych modeli). Użyj istniejącej walidacji schematu JSON (`validateSchema`) dla spójności odpowiedzi. Zachowaj retry (max 3) na poziomie pojedynczego modelu, ale fallback na poziomie serwisu AI.
- **Kontrakt**: `_buildRequestBody` musi obsługiwać dynamiczny `model` z env. Błędy (`OpenRouterError`) będą propagowane do ai.service.ts dla decyzji o fallbacku.

## Kluczowe Wnioski i Zalecenia

- **Zgodność z Wymaganiami**: Mechanizm fallbacku nie wpływa na limity (śledzone per projekt w Supabase), zachowując PRD (US-010/011). Język odpowiedzi AI pozostaje polski, struktura JSON niezmieniona. Fallback odbywa się hermetycznie po stronie backendu, bez wpływu na interfejs użytkownika.
- **Bezpieczeństwo i Wydajność**: Walidacja plików i limitów na serwerze zapobiega nadużyciom. Fallback minimalizuje downtime, ale z limitem 3 modeli dla uniknięcia kosztów (zgodne z OpenRouter via tech-stack.md).
- **Moduły i Serwisy**: Nowy moduł `fallback-config.ts` w `src/lib/` dla sekwencji modeli. Integracja via `project.service.ts` dla update'ów DB. Testy: Rozszerz Vitest (unit) dla `AIService` i Playwright (E2E) dla endpointu (zgodne z .cursor/rules/).
- **Potencjalne Ryzyka**: Zależność od dostępności modeli free-tier (OpenRouter); monitoruj via logs. Brak wpływu na frontend (komponenty React/Shadcn/ui) poza aktualizacją stanu formularza.
