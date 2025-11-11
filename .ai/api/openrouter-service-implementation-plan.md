# OpenRouter Service Implementation Plan

## 1. Opis usługi

Usługa OpenRouter jest klasą TypeScriptową odpowiedzialną za integrację z API OpenRouter.ai, umożliwiającą generowanie odpowiedzi opartych na dużych modelach językowych (LLM) w kontekście czatów. Usługa obsługuje wysyłanie wiadomości systemowych i użytkownika, wybór modelu, konfigurację parametrów modelu oraz strukturyzowane odpowiedzi w formacie JSON za pomocą schematu JSON Schema. Jest zaprojektowana do użycia w aplikacji opartej na Astro 5 z TypeScript 5, React 19 i Supabase jako backendem. Usługa zapewnia bezpieczną obsługę kluczy API, retry mechanizmy na błędy oraz walidację odpowiedzi, integrując się z istniejącą strukturą projektu w `./src/lib/services/openrouter.ts`.

## 2. Opis konstruktora

Konstruktor inicjalizuje instancję usługi z wymaganymi konfiguracjami:

- **Parametry**:
  - `apiKey: string` – Klucz API OpenRouter (przechowywany bezpiecznie jako zmienna środowiskowa `OPENROUTER_API_KEY`).
  - `baseUrl?: string` (opcjonalny) – Bazowy URL API, domyślnie `https://openrouter.ai/api/v1`.
  - `defaultModel?: string` (opcjonalny) – Domyślny model LLM, np. `openai/gpt-4o-mini`.

- **Funkcjonalność**:
  - Waliduje obecność `apiKey` i rzuca błąd, jeśli brak.
  - Ustawia domyślne wartości dla opcjonalnych parametrów.
  - Inicjalizuje wewnętrzny klient HTTP (używając `fetch` lub biblioteki jak Axios dla lepszej obsługi błędów).
  - Konfiguruje nagłówki HTTP, w tym `Authorization: Bearer ${apiKey}` i `Content-Type: application/json`.

Przykład użycia:
```typescript
const openRouterService = new OpenRouterService(process.env.OPENROUTER_API_KEY!);
```

## 3. Publiczne metody i pola

- **Pola publiczne**:
  - Brak – Wszystkie pola są prywatne dla enkapsulacji.

- **Metody publiczne**:
  - `async generateResponse(messages: Message[], options?: GenerateOptions): Promise<GenerateResponse>`  
    Wysyła zapytanie do API OpenRouter i zwraca wygenerowaną odpowiedź. Obsługuje wiadomości systemowe i użytkownika, opcjonalnie strukturyzowane odpowiedzi via `responseFormat`.
    
    Parametry:
    - `messages: Message[]` – Tablica obiektów `{ role: 'system' | 'user' | 'assistant', content: string }`.
    - `options?: GenerateOptions` – Opcje obejmujące `model`, `parameters` (np. temperature, maxTokens), `responseFormat` (JSON Schema).
    
    Zwraca: `{ content: string, structuredData?: any, usage?: { promptTokens: number, completionTokens: number } }`.

  - `getAvailableModels(): Promise<ModelInfo[]>`  
    Pobiera listę dostępnych modeli z API OpenRouter dla dynamicznego wyboru.

  - `validateSchema(schema: JsonSchema): boolean`  
    Waliduje podany schemat JSON przed wysłaniem do API.

## 4. Prywatne metody i pola

- **Pola prywatne**:
  - `_apiKey: string` – Przechowywany klucz API.
  - `_baseUrl: string` – Bazowy URL API.
  - `_defaultModel: string` – Domyślny model.
  - `_httpClient: any` – Wewnętrzny klient HTTP.

- **Metody prywatne**:
  - `private async _makeRequest(endpoint: string, body: any): Promise<any>`  
    Wykonuje żądanie HTTP do API, z automatycznym retry (do 3 prób) na błędy sieciowe i obsługą rate limitów.

  - `private _buildRequestBody(messages: Message[], options: GenerateOptions): any`  
    Konstruuje ciało żądania zgodne z API OpenRouter, w tym `model`, `messages`, `temperature`, `response_format`.

  - `private _parseResponse(response: any): GenerateResponse`  
    Parsuje surową odpowiedź API, wyciąga treść, strukturyzowane dane (jeśli `responseFormat` użyty) i metadane użycia tokenów. Waliduje strukturyzowane dane przeciwko schematowi.

## 5. Obsługa błędów

Usługa implementuje kompleksową obsługę błędów:

- **Scenariusze błędów**:
  1. Brak lub nieważny klucz API – Rzuć `OpenRouterError` z komunikatem "Invalid API key".
  2. Błędy sieciowe (np. timeout, brak połączenia) – Retry z exponencyjnym backoffem (1s, 2s, 4s).
  3. Błędy API (4xx/5xx) – Mapuj kody błędów OpenRouter (np. 429: rate limit, 401: autentykacja) na custom błędy z przyjaznymi komunikatami.
  4. Nieprawidłowa odpowiedź modelu (np. niepasująca do schematu JSON) – Waliduj i rzuć `ValidationError` z szczegółami.
  5. Przekroczenie limitu tokenów lub parametrów – Sprawdź przed wysłaniem i ostrzeż użytkownika.
  6. Błędy parsowania (np. nie-JSON w structured response) – Użyj try-catch i fallback do surowej treści.

- **Najlepsze praktyki**:
  - Użyj custom klas błędów dziedziczących po `Error` (np. `OpenRouterError`, `ValidationError`).
  - Loguj błędy używając console.error.
  - Zwracaj user-friendly komunikaty, np. "Serwis AI jest chwilowo niedostępny, spróbuj później."

## 6. Kwestie bezpieczeństwa

- **Bezpieczeństwo kluczy API**: Nigdy nie hardkoduj kluczy; używaj zmiennych środowiskowych ładowanych via `import.meta.env` w Astro. W production, ogranicz dostęp do klucza tylko dla serwerowych endpointów ( `./src/pages/api` ).
- **Walidacja wejścia**: Sanitizuj wiadomości użytkownika przed wysłaniem (np. uciekaj specjalne znaki), aby uniknąć injection attacks.
- **Rate Limiting**: Implementuj klient-side throttling, aby nie przekraczać limitów OpenRouter (np. max 60 zapytań/min).
- **CORS i HTTPS**: Upewnij się, że wszystkie żądania idą przez HTTPS; w Astro middleware (`./src/middleware/index.ts`) dodaj nagłówki bezpieczeństwa.
- **Dane wrażliwe**: Nie wysyłaj poufnych danych użytkownika do API bez zgody; maskuj w logach.
- **Audyt**: Regularnie rotuj klucze API i monitoruj użycie via dashboard OpenRouter.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie środowiska
- Dodaj zmienną środowiskową `OPENROUTER_API_KEY` do `.env` (dla dev) i konfiguracji deploymentu (np. Vercel/Netlify).
- Zainstaluj zależności: Brak nowych, użyj wbudowanego `fetch`. Opcjonalnie dodaj `zod` dla walidacji schematów: `npm install zod`.
- Utwórz plik `./src/lib/services/openrouter.ts` dla klasy usługi.

### Krok 2: Implementacja konstruktora i pól prywatnych
- Zdefiniuj interfejsy w `./src/types.ts`: `Message`, `GenerateOptions`, `JsonSchema`, `GenerateResponse`, `ModelInfo`.
- Zaimplementuj konstruktor z walidacją i inicjalizacją `_httpClient` (użyj `fetch`).
- Dodaj prywatne pola jak opisano.

### Krok 3: Implementacja metod prywatnych
- Zaimplementuj `_makeRequest` z retry logiką (użyj pętli while z backoffem).
- Zaimplementuj `_buildRequestBody`: Obsługuj `messages` (system/user), `model` (domyślny lub z opcji), `parameters` (temperature: 0.7, max_tokens: 1000), `response_format` jeśli podany.
- Zaimplementuj `_parseResponse`: Użyj `JSON.parse` dla structured data i waliduj z `zod` lub manualnie.

### Krok 4: Implementacja metod publicznych
- `generateResponse`: Buduj ciało, wyślij żądanie, parsuj odpowiedź. Przykłady użycia elementów:
  - **Komunikat systemowy**: `{ role: 'system', content: 'Jesteś pomocnym asystentem.' }` jako pierwszy w `messages`.
  - **Komunikat użytkownika**: `{ role: 'user', content: 'Wyjaśnij quantum computing.' }`.
  - **Nazwa modelu**: `options.model = 'anthropic/claude-3.5-sonnet'`.
  - **Parametry modelu**: `options.parameters = { temperature: 0.5, max_tokens: 500 }`.
  - **Response_format (strukturyzowane odpowiedzi)**: 
    ```typescript
    options.responseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'response-schema',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            examples: { type: 'array', items: { type: 'string' } }
          },
          required: ['explanation', 'examples'],
          additionalProperties: false
        }
      }
    };
    ```
    W `_buildRequestBody` dodaj do ciała żądania: `response_format: options.responseFormat`.
- `getAvailableModels`: Wyślij GET do `/models` endpointu.
- `validateSchema`: Użyj prostej rekurencyjnej funkcji lub `zod` do sprawdzenia schematu.

### Krok 5: Integracja z istniejącym kodem
- W `./src/components/ai/AISection.tsx` lub podobnym, zainicjuj usługę i wywołaj `generateResponse` w hooku jak `useAIGeneration.ts`.
- Dodaj endpoint API w `./src/pages/api/ai/generate.ts` dla serwer-side wywołań, aby ukryć klucz API.
