# API Endpoint Implementation Plan: GET /api/projects - List User's Projects

## 1. Przegląd punktu końcowego

This endpoint retrieves a paginated list of projects belonging to the authenticated user, displaying key details such as name, technologies, status, and URLs. It supports sorting by status and is designed for the home page, returning an empty array to trigger an empty state in the UI when no projects exist. The implementation leverages Supabase for data retrieval, ensuring user-specific filtering, and follows Astro's server-side rendering for API routes.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /api/projects
- Parametry:
  - Wymagane: None
  - Opcjonalne:
    - limit: integer (default 50, range 1-100 for pagination)
    - offset: integer (default 0, min 0 for pagination starting point)
    - sort: string (options: \"status:asc\" or \"status:desc\" for ordering by project status)
- Request Body: None

## 3. Wykorzystywane typy

- ProjectDto: Represents individual project data (id, name, description, technologies, status, repoUrl, demoUrl, previewUrl, createdAt, updatedAt), excluding userId for security.
- ProjectsListResponse: Wrapper interface { projects: ProjectDto[]; total: number; } for the full response, including count for pagination metadata.

These types are defined in src/types.ts and align with the database schema from Database[\"public\"][\"Tables\"][\"projects\"][\"Row\"].

## 4. Szczegóły odpowiedzi

- Oczekiwana struktura odpowiedzi (200 OK):
  ```json
  {
    \"projects\": [
      {
        \"id\": \"uuid\",
        \"name\": \"string\",
        \"description\": \"string\",
        \"technologies\": [\"string\"],
        \"status\": \"PLANNING|IN_PROGRESS|MVP_COMPLETED|FINISHED\",
        \"repoUrl\": \"string|null\",
        \"demoUrl\": \"string|null\",
        \"previewUrl\": \"string|null\",
        \"createdAt\": \"timestamp\",
        \"updatedAt\": \"timestamp\"
      }
    ],
    \"total\": integer
  }
  ```
- Kody statusu:
  - 200 OK: Successful retrieval.
  - 400 Bad Request: Invalid query parameters (e.g., invalid limit or sort).
  - 401 Unauthorized: Missing or invalid authentication.
  - 500 Internal Server Error: Database or server failure.

## 5. Przepływ danych

1. Endpoint handler in src/pages/api/projects.astro (or .ts) receives the GET request.
2. Extract user session from Astro.locals using Supabase auth (from src/db/supabase.client.ts).
3. Validate query parameters using Zod schema.
4. Call projectService.fetchUserProjects(userId, { limit, offset, sort }) from src/lib/projectService.ts.
5. Service queries Supabase: SELECT relevant fields FROM projects WHERE userId = $1 ORDER BY status (asc/desc) LIMIT $2 OFFSET $3, plus a COUNT query for total.
6. Map results to ProjectDto array and return ProjectsListResponse.
7. No external services beyond Supabase; use import.meta.env for any config.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Require Supabase session via Astro middleware (src/middleware/index.ts) or locals; redirect unauthenticated to 401.
- Autoryzacja: Filter queries strictly by userId from session to ensure users only access their own projects; rely on Supabase RLS policies for additional enforcement.
- Walidacja danych: Zod for query params to prevent injection; no user input in SQL (use parameterized queries). Sanitize any URLs in response if needed, though read-only.
- Inne: Set export const prerender = false; for dynamic API route. Limit pagination (max 100) to avoid resource exhaustion. No sensitive data exposed (userId omitted).

## 7. Obsługa błędów

- 400 Bad Request: Invalid params (e.g., non-numeric limit) – validate with Zod, return { error: \"Invalid query parameters\" }.
- 401 Unauthorized: No session – return { error: \"Authentication required\" }.
- 500 Internal Server Error: Supabase query failure, connection issues, or unexpected errors – log details (console.error or logger service), return { error: \"Failed to fetch projects\" }. Use try-catch in service and handler.
- Inne scenariusze: Empty results return 200 with empty array; no 404. Handle Supabase errors (e.g., RPC failures) by checking error codes and mapping to appropriate responses. Implement early returns for error conditions.

## 8. Rozważania dotyczące wydajności

- Pagination prevents loading all projects at once; enforce reasonable limits to avoid timeouts.
- Indeksy na Supabase: Ensure indexes on userId, status, createdAt for fast queries (add via Supabase dashboard if missing).
- Caching: Consider Astro's built-in caching or Supabase edge functions for repeated queries, but start without for simplicity.
- Optymalizacja: Use single query with window functions if total count is expensive; monitor query performance with Supabase logs. Limit to 50 default to balance load.

## 9. Etapy wdrożenia

1. Create or update src/lib/project.service.ts: Implement fetchUserProjects function with Supabase query, pagination, sorting, and error handling. Use SupabaseClient from src/db/supabase.client.ts.
2. Define Zod schema in src/lib/validators.ts (or inline): Validate limit, offset, sort; include defaults.
3. Implement endpoint in src/pages/api/projects.ts: Set prerender = false, extract session, validate inputs, call service, return JSON response. Use Astro.locals.supabase.
4. Update src/types.ts if needed (already has DTOs; ensure alignment).
5. Add middleware check in src/middleware/index.ts for auth on /api/\* paths if not present.
6. Test: Manually test with valid/invalid auth, params; verify RLS and user filtering. Use Postman or curl for edge cases (empty list, max pagination).
7. Lint and error handling: Run eslint, add try-catch, log errors. Update README.md with endpoint docs if applicable.
