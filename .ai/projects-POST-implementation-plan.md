# API Endpoint Implementation Plan: POST /api/projects

## 1. Przegląd punktu końcowego

This endpoint allows authenticated users to create a new project in their personal workspace. It inserts a project record into the Supabase 'projects' table, associating it with the current user's ID, and returns the created project details. The functionality supports the MVP by enabling project initialization with essential fields (name, description, technologies, status) and optional URLs for repository, demo, and preview assets. It adheres to REST principles, uses server-side rendering in Astro for the API route, and extracts business logic to a dedicated service for maintainability.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: /api/projects
- Parametry:
  - Wymagane: Brak parametrów query.
  - Opcjonalne: Brak parametrów query.
- Request Body: JSON object conforming to CreateProjectDto:
  ```json
  {
    "name": "string (required, max 255 chars)",
    "description": "string (required)",
    "technologies": ["string"] (required array, min 1 item),
    "status": "PLANNING|IN_PROGRESS|MVP_COMPLETED|FINISHED" (required enum),
    "repoUrl": "string|null (optional)",
    "demoUrl": "string|null (optional)",
    "previewUrl": "string|null (optional, Supabase Storage URL)"
  }
  ```
  Content-Type must be application/json. Body size limited implicitly by Astro/Supabase defaults.

## 3. Wykorzystywane typy

- CreateProjectDto: For request body parsing and validation (from src/types.ts; includes required fields: name, description, technologies, status; optional: repoUrl, demoUrl, previewUrl).
- ProjectDto: For response serialization (from src/types.ts; full project entity excluding userId for security, includes id, name, description, technologies, status, repoUrl, demoUrl, previewUrl, createdAt, updatedAt).
- ProjectStatus: Enum for status validation (from src/types.ts, matching DB custom type).
- SupabaseClient: For DB interactions (imported from src/db/supabase.client.ts, used via Astro.locals).

Zod schema (CreateProjectSchema) in src/lib/validators/project.validators.ts for runtime validation, ensuring type safety with TypeScript.

## 4. Szczegóły odpowiedzi

- Success: 201 Created
  - Body: Single ProjectDto object (e.g., { id: "uuid", name: "...", description: "...", technologies: [...], status: "PLANNING", repoUrl: null, demoUrl: null, previewUrl: null, createdAt: "ISO string", updatedAt: "ISO string" }).
  - Message: Optional "Project created" in response body or headers.
- Errors:
  - 400 Bad Request: { error: "Missing required fields or invalid status" } – for validation failures.
  - 401 Unauthorized: { error: "Unauthorized" } – for missing/invalid auth.
  - 500 Internal Server Error: { error: "Internal server error" } – for DB or unexpected failures (no stack traces exposed).
    Response always JSON, with CORS handled by Astro defaults.

## 5. Przepływ danych

1. API handler (src/pages/api/projects.ts) receives POST request.
2. Extract Supabase client from Astro.locals.supabase; validate auth session – if invalid, return 401.
3. Parse and validate request body using Zod (CreateProjectSchema) against CreateProjectDto – if invalid, return 400.
4. Call projectService.createProject(createDto, userId) from src/lib/project.service.ts:
   - Map DTO to DB insert object (camelCase to snake_case if needed, but Supabase uses camelCase via JS client).
   - Insert into 'projects' table using supabase.from('projects').insert({ ...data, user_id: userId }).select().
   - Handle DB trigger for created_at/updated_at automatically.
5. On success, map DB result to ProjectDto (exclude user_id) and return 201 with JSON.
6. No external services beyond Supabase; technologies stored as TEXT[] array directly.

Data flow is synchronous, server-side only; no client-side hydration needed for this API route (prerender = false).

## 6. Względy bezpieczeństwa

- Use DEFAULT_USER_ID instead of request authorization flow
- Authorization: Scope to authenticated user only – insert with explicit user_id from session to prevent tampering; no cross-user access.
- Input Validation: Zod for schema enforcement (e.g., URL format for optional fields via z.string().url().nullable(), array min length); prevents injection and oversized data.
- Data Exposure: Response uses ProjectDto excluding user_id; no sensitive fields returned.
- Other: Supabase RLS policies (if enabled later) for row-level security on projects (e.g., user_id = auth.uid()); URL fields not sanitized beyond validation to avoid XSS, but since server-rendered, safe. Rate limiting via Astro middleware if abuse detected. No CSRF risk in API context.

## 7. Obsługa błędów

- Validation Errors (Zod): Catch ZodError, return 400 with user-friendly message aggregating issues (e.g., "Invalid status value").
- Auth Errors: Supabase auth failure → 401 "Unauthorized".
- DB Errors: Supabase insert failure (e.g., constraint violation) → log error details server-side (console.error with stack), return 500 "Internal server error".
- Unexpected Errors: Wrap service call in try-catch; log full error, return 500 without exposing internals.
- Edge Cases: Empty technologies array (400 via Zod); Invalid enum status (400); Null non-nullable fields (400); DB connection issues (500).
  Use early returns in handler/service for error paths; no deep nesting. Custom error types optional for future (e.g., AppError extending Error).

## 8. Rozważania dotyczące wydajności

- Low overhead: Single DB insert (O(1) time); Zod validation is fast for small payloads.
- Potential Bottlenecks: Supabase latency on cold starts (mitigate with connection pooling via Supabase client); Large description/text (but TEXT type handles efficiently).
- Optimization Strategies: Index on user_id for future queries (add if not present); Batch inserts unnecessary here. Use select() minimally (only needed fields). Monitor with Supabase dashboard; cache not needed for create op. Scale via Supabase's managed PostgreSQL.

## 9. Etapy wdrożenia

1. Update src/lib/validators/project.validators.ts: Define Zod schema (CreateProjectSchema) matching CreateProjectDto with constraints (max length, min array, enum, nullable URLs).
2. Extend src/lib/project.service.ts: Add createProject method – input: CreateProjectDto, userId; validate inputs early, insert via supabase.from('projects').insert({...}).select('id, name, description, technologies, status, repoUrl, demoUrl, previewUrl, createdAt, updatedAt'), map to ProjectDto, handle errors with logging and throws.
3. Implement src/pages/api/projects.ts: Export POST handler with prerender = false; get supabase from locals; auth check; body parse with Zod; call service; return 201 JSON or error responses.
4. Update src/types.ts if needed (already has DTOs); ensure camelCase consistency.
5. Lint and TypeScript: Run eslint/ts checks; Fix any issues per guidelines.
