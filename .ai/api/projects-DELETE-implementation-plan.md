# API Endpoint Implementation Plan: DELETE /api/projects/{id}

## 1. Przegląd punktu końcowego

Endpoint DELETE /api/projects/{id} umożliwia usunięcie projektu należącego do uwierzytelnionego użytkownika. Usunięcie kaskaduje do powiązanych rekordów ai_queries poprzez soft delete (oznaczenie jako usunięte bez fizycznego kasowania, aby zachować logi). Endpoint jest chroniony uwierzytelnieniem i autoryzacją, ograniczony tylko do właściciela projektu. Zgodny z PRD, wspiera zarządzanie projektami użytkownika bez wpływu na dane innych.

## 2. Szczegóły żądania

- Metoda HTTP: DELETE
- Struktura URL: /api/projects/{id}, gdzie {id} to UUID projektu
- Parametry:
  - Wymagane: {id} (UUID projektu, walidowany jako string UUID)
  - Opcjonalne: Brak
- Request Body: Brak (brak JSON w treści żądania)

## 3. Wykorzystywane typy

- Istniejące typy z src/types.ts:
  - ProjectDto: Do pobierania i weryfikacji projektu (użyj do sprawdzenia istnienia i własności).
  - ProjectStatus: Enum do ewentualnej walidacji statusu (choć nie wymagane dla DELETE).
- Nowy typ odpowiedzi (dodaj do src/types.ts):
  ```typescript
  export interface DeleteProjectResponse {
    message: string;
  }
  ```
- Brak Command Modeli (brak ciała żądania); walidacja {id} za pomocą Zod schema w routingu.

## 4. Szczegóły odpowiedzi

- Sukces (200 OK):
  ```json
  {
    "message": "Project deleted"
  }
  ```
- Błędy:
  - 403 Forbidden: `{ "error": "Not owner" }`
  - 404 Not Found: `{ "error": "Project not found" }`
  - 500 Internal Server Error: `{ "error": "Internal server error" }` (ukryj szczegóły dla bezpieczeństwa)
- Dodatkowe kody (zgodne z regułami):
  - 401 Unauthorized: Jeśli middleware nie przesunie (np. brak sesji)
  - 400 Bad Request: Jeśli {id} nie jest walidnym UUID

## 5. Przepływ danych

1. Middleware (src/middleware/index.ts) weryfikuje sesję Supabase i wstrzykuje supabase client do locals.
2. W routingu API (src/pages/api/projects/[id].ts dla DELETE): Wyodrębnij {id} z params, waliduj UUID za pomocą Zod.
3. Pobierz userId z sesji (Astro.locals.session?.user.id).
4. Wywołaj service: projectService.deleteProject(id, userId) – w src/lib/project.service.ts:
   - Użyj supabase.from('projects').select('\*').eq('id', id).single() do pobrania projektu.
   - Sprawdź, czy project.user_id === userId i project istnieje.
   - Jeśli tak, wywołaj supabase.from('projects').delete().eq('id', id) – kaskada ON DELETE CASCADE nie jest tu używana, ale soft delete na ai_queries via trigger (ustaw deleted_at w ai_queries).
   - Zwróć sukces.
5. Odpowiedź JSON z wiadomością sukcesu lub błędem.
   Interakcje: Tylko z Supabase (DB); brak zewnętrznych usług. Użyj supabase z locals dla typowania.

## 6. Względy bezpieczeństwa

- Autoryzacja: W service sprawdź project.user_id === current userId, aby zapobiec IDOR.
- Walidacja: Zod dla {id} (z.string().uuid()); brak ciała, więc brak walidacji JSON.
- Ochrona danych: Nie zwracaj wrażliwych danych w błędach (np. ukryj szczegóły 500). Użyj prepared queries Supabase do uniknięcia SQL injection.

## 7. Rozważania dotyczące wydajności

- Zapytania DB: Pojedyncze select + delete (O(1) złożoność); soft delete na ai_queries via trigger (automatyczne, niskokosztowe).
- Potencjalne wąskie gardła: Wysokie obciążenie Supabase przy masowych usuwaniach – zoptymalizuj przez indeksy na id i user_id (już istnieją jako PK/FK).
- Strategie: Użyj pojedynczej transakcji Supabase jeśli potrzeba atomowości (choć cascade jest obsługiwany). Buforuj sesje w middleware. Dla skalowalności, monitoruj Supabase metrics; unikaj N+1 queries (tu brak relacji ładowanych).
- Wydajność MVP: Niska, jako operacja idempotentna i rzadka.

## 8. Etapy wdrożenia

1. Zaktualizuj src/types.ts: Dodaj DeleteProjectResponse interface.
2. Rozszerz src/lib/project.service.ts: Dodaj metodę deleteProject(id: string, userId: string) z walidacją, fetch, check ownership i delete via supabase.from('projects').delete().eq('id', id). Obsłuż soft delete ai_queries (jeśli trigger nie istnieje, dodaj via migration).
3. Utwórz/rozszerz src/pages/api/projects/[id].ts: Dodaj handler DELETE z walidacją Zod dla params.id, pobraniem userId z locals.session, wywołaniem service i zwrotem JSON (200 lub błąd).
4. Dodaj walidację Zod w src/lib/validators/project.validators.ts: Nowy schema dla DeleteProjectParams { id: z.string().uuid() }.
5. Obsłuż błędy: Użyj try-catch w service/route, loguj via console.error, mapuj na kody 403/404/500 z odpowiednimi wiadomościami.
