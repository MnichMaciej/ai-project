# API Endpoint Implementation Plan: PATCH /api/projects/{id}

## 1. Przegląd punktu końcowego

Endpoint PATCH /api/projects/{id} służy do częściowej aktualizacji istniejącego projektu, umożliwiając modyfikację wybranych pól takich jak nazwa, opis, technologie, status czy URL-e. Dostępny wyłącznie dla właściciela projektu (autoryzacja na podstawie user_id z sesji Supabase). Zapewnia zgodność z PRD poprzez walidację danych i automatyczne ustawianie updated_at via trigger DB. Integruje się z tabelą projects w Supabase, zwracając zaktualizowany obiekt bez wrażliwych danych.

## 2. Szczegóły żądania

- Metoda HTTP: PATCH
- Struktura URL: /api/projects/{id} (gdzie {id} to UUID projektu)
- Parametry:
  - Wymagane: {id} (path parameter, UUID)
  - Opcjonalne: Brak query params
- Request Body: JSON obiekt zgodny z UpdateProjectDto (Partial<CreateProjectDto>), np. {"description": "Zaktualizowany opis", "status": "IN_PROGRESS"}. Co najmniej jedno pole musi być podane; pola opcjonalne: name (string, max 255), description (string), technologies (string[]), status (ProjectStatus enum), repoUrl/demoUrl/previewUrl (string | null, format URL).

## 3. Wykorzystywane typy

- UpdateProjectDto: Partial<CreateProjectDto> – do walidacji i przetwarzania ciała żądania (wszystkie pola opcjonalne).
- ProjectDto: Pełny obiekt projektu do odpowiedzi (id, name, description, technologies, status, repoUrl, demoUrl, previewUrl, createdAt, updatedAt; bez userId).
- Wewnętrznie: Typy Supabase z database.types.ts (np. Project dla zapytań DB). Użyć Zod schemas w src/lib/validators/project.validators.ts dla walidacji (np. updateProjectSchema).

## 4. Szczegóły odpowiedzi

- Sukces: 200 OK, JSON: ProjectDto (zaktualizowany projekt), kèm meta {"message": "Project updated"}.
- Błędy:
  - 400 Bad Request: {"error": "Invalid update", "details": ["specific validation errors"]}.
  - 403 Forbidden: {"error": "Not owner"}.
  - 404 Not Found: {"error": "Project not found"}.
  - 500 Internal Server Error: {"error": "Internal server error"}.
  - 401 Unauthorized: {"error": "Unauthorized"} (dodatkowy dla braku sesji).

## 5. Przepływ danych

1. Walidacja wejścia w API route (Zod na body i {id}).
2. Pobranie sesji Supabase z locals.get('supabase') lub middleware.
3. Wywołanie projectService.updateProject(id, updateData, userId z sesji):
   - Sprawdź istnienie i własność (select user_id from projects where id = $1).
   - Waliduj dane (Zod).
   - Update w Supabase (supabase.from('projects').update(updateData).eq('id', id).eq('user_id', userId); trigger updated_at automatycznie).
   - Pobierz zaktualizowany rekord (select bez user_id).
4. Zwróć ProjectDto. Brak interakcji z zewnętrznymi usługami poza Supabase.

## 6. Względy bezpieczeństwa

- Autoryzacja: W service sprawdzić, czy request user.id == project.user_id; zwracać 403 jeśli nie.
- Walidacja: Użyć Zod do sanitizacji input (zapobiega injection); walidować URL-e (Zod.url() opcjonalnie); ograniczyć technologies do max 10 elementów.
- Dane: Nie eksponować userId w response; używać Supabase RLS policies na tabeli projects (już disabled w migracji, ale monitorować).
- Inne: Brak CSRF w API (Astro obsługuje); rate limiting via middleware dla /api/projects; HTTPS enforced.

## 7. Obsługa błędów

- 400: Błędy walidacji Zod (np. invalid status, pusty body) – zbierać details i zwracać array błędów.
- 403: Mismatch user_id – logować do console bez sensitive data.
- 404: Brak rekordu w DB – zwracać standard message.
- 500: Wyjątki Supabase (np. constraint fail) lub nieobsłużone – catch w service/route, logować console.error({error, userId, projectId}), zwracać generic message.
- Używać try-catch w service; early returns dla błędów; custom error types jeśli potrzeba (np. AppError z kodem).

## 8. Rozważania dotyczące wydajności

- Zapytania DB: Pojedyncze update + select (O(1) dla UUID index); brak N+1.
- Walidacja: Zod szybka dla partial objects.
- Potencjalne wąskie gardła: Duże technologies arrays – ograniczyć do 10; Supabase latency – użyć eq() dla precyzji.
- Optymalizacja: Prerender = false w route; cache response jeśli potrzeba (ale rzadkie użycie); monitorować via Supabase dashboard.

## 9. Etapy wdrożenia

1. Zaktualizuj src/lib/validators/project.validators.ts: Dodaj Zod schema dla UpdateProjectDto (opcjonalne pola z .optional(), refine na co najmniej jedno pole).
2. Rozszerz src/lib/project.service.ts: Dodaj async updateProject(id: string, data: UpdateProjectDto, userId: string): Promise<ProjectDto> – z walidacją właściciela, update, fetch i mapowaniem do DTO.
3. Utwórz/aktualizuj src/pages/api/projects.ts: Dodaj handler PATCH – waliduj {id} i body (zod), pobierz user z sesji, wywołaj service, zwróć response lub error.
4. Waliduj lintery (ESLint/Prettier) i typy (TypeScript); commit z opisem zmian.
5. Opcjonalnie: rozważ RLS enable dla projects jeśli security wzrośnie.
