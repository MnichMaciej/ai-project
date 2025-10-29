# API Endpoint Implementation Plan: POST /api/projects/{id}/ai-generate

## 1. Przegląd punktu końcowego

This endpoint generates a project description and identifies technologies using AI via Openrouter.ai, based on provided GitHub file links. It enforces limits on the number of queries per project (max 5), files per query (max 8), and file sizes (max 100KB each). Upon success, it populates the project's description and technologies fields in the database and logs the query details to the ai_queries table for auditing and limit enforcement. The endpoint is protected by authentication and authorization to ensure only the project owner can invoke it.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: /api/projects/{id}/ai-generate
- Parametry:
  - Wymagane: Path parameter `id` (string, UUID of the project)
  - Opcjonalne: None (no query params)
- Request Body: JSON object with the following structure:

  ```json
  {
    "fileLinks": [
      "https://raw.githubusercontent.com/user/repo/main/file1.js",
      "https://raw.githubusercontent.com/user/repo/main/file2.py"
    ]
  }
  ```

  - `fileLinks`: Array of strings (raw GitHub URLs), required, max 8 items.

## 3. Wykorzystywane typy

- **GenerateProjectAIRequest** (from src/types.ts): Defines the request body with `fileLinks: string[]`.
- **GenerateProjectAIResponse** (from src/types.ts): Defines the response body with `description: string`, `technologies: string[]`, and `queryCount: number`.
- **ProjectDto** and **UpdateProjectDto** (from src/types.ts): Used for fetching and updating the project entity.
- **ProjectStatus** enum (from src/types.ts): Ensures valid status values if needed for project updates.
- Zod schemas: A new schema in src/lib/validators/project.validators.ts for validating `GenerateProjectAIRequest`, including array length (max 8) and URL format checks.
- Supabase types: Use `SupabaseClient` from src/db/supabase.client.ts for database interactions.

## 4. Szczegóły odpowiedzi

- Success Response (200 OK):
  - Body: JSON matching GenerateProjectAIResponse
    ```json
    {
      "description": "Generated project description based on provided files.",
      "technologies": ["React", "TypeScript", "Node.js"],
      "queryCount": 3
    }
    ```
  - Message: "AI generation complete" (optional in body or headers if needed).
- Error Responses:
  - 400 Bad Request: Invalid input (e.g., too many files, invalid URLs, file too large).
  - 401 Unauthorized: Missing or invalid authentication.
  - 403 Forbidden: User not the project owner.
  - 404 Not Found: Project not found.
  - 429 Too Many Requests: Exceeded 5 queries per project.
  - 500 Internal Server Error: AI service failure or database error.

## 5. Przepływ danych

2. Extract project ID from path and fetch the project from Supabase (projects table) to verify existence and ownership.
3. Validate request body using Zod schema: check fileLinks array length (<=8), validate each as valid GitHub raw URL, fetch each file content to check size (<=100KB).
4. Check query limit: Count existing ai_queries for the project (where deleted_at IS NULL); if >=5, return 429.
5. If valid, prepare mocked utils that will mock actions: fetching file contents from GitHub URLs and generates fake AI query and ai response with technologies array and description
6. Parse AI response: Extract description and technologies array.
7. Increment query_number: Find max query_number for project +1.
8. Insert log into ai_queries table: project_id, query_number, file_links, generated_description, generated_technologies.
9. Update projects table: Set description and technologies (use UpdateProjectDto).
10. Return success response with generated data and updated queryCount.

## 6. Względy bezpieczeństwa

- **Authorization**: After fetching project, verify `project.user_id === session.user.id` to ensure ownership (403 if not).
- **Input Validation**: Zod for request body (array length, URL regex for GitHub raw links). Fetch and check file sizes to prevent large payloads.
- **Rate Limiting**: Enforced via DB count on ai_queries (max 5/project). Consider global rate limiting if needed via middleware.
- **CORS and CSRF**: Handled by Astro defaults; ensure API routes are not pre-rendered (export const prerender = false).

## 7. Obsługa błędów

- **Validation Errors (400)**: Zod issues (e.g., invalid JSON, too many files), file fetch failures (e.g., 404 on GitHub), oversized files. Return specific message: "Too many files (>8) or file too large (>100KB)".
- **Auth Errors (401)**: No session or invalid token. Use Supabase's auth error handling.
- **Authz Errors (403)**: Mismatch in user_id. Message: "Not owner".
- **Not Found (404)**: Project ID not in DB. Message: "Not Found".
- **Rate Limit (429)**: Query count >=5. Message: "AI limit reached (5 queries/project)".
- **General**: Use try-catch blocks with early returns. No stack traces in responses. For DB errors, rollback transactions if used (Supabase supports via client).

## 8. Rozważania dotyczące wydajności

- **Bottlenecks**: File fetching (8 files, up to 100KB each ~800KB total) and AI call (latency 1-5s). Sequential fetches may add delay.
- **Optimizations**:
  - DB queries: Index on ai_queries.project_id and projects.user_id for fast counts/fetches.
  - Limit payload: Stream file contents if possible, but fetch full for AI.
- **Scalability**: Supabase handles DB scaling; monitor Openrouter usage for quotas. For high traffic, queue AI requests.
- **Metrics**: Log query duration and success rate in ai_queries.created_at for monitoring.

## 9. Etapy wdrożenia

1. **Setup and Types**: Extend src/types.ts if needed (already has request/response DTOs). Add Zod schema to src/lib/validators/project.validators.ts for GenerateProjectAIRequest (validate array maxLength 8, each string as URL regex for GitHub raw).
2. **Service Layer**: Create or extend src/lib/ai.service.ts (new if none) for AI logic: fetchFilesFromGitHub(fileLinks), callOpenrouterAI(filesContent, prompt), parseAIResponse. Extract project update logic to src/lib/project.service.ts (updateProjectDescriptionAndTech).
3. **API Route**: In src/pages/api/projects/[id]/ai-generate.ts: Set prerender = false. Get supabase from context.locals. Fetch project, validate ownership. Parse/validate body with Zod. Check query count via supabase.from('ai_queries').select('count').eq('project_id', id).is('deleted_at', null).
4. **Implement Flow**: Fetch files in parallel, check sizes. Get next query_number. Call AI service. Insert to ai_queries. Update project. Return response.
5. **Error Handling**: Wrap in try-catch; map errors to status codes/messages. Use guard clauses for early returns.
6. **Testing**: Unit tests for service functions (mock fetch, Openrouter). Integration tests for endpoint (mock Supabase, GitHub). Cover limits, errors, success.
7. **DB Updates**: Ensure ai_queries table exists (via Supabase migration if not). Add indexes if needed.
8. **Environment**: Add OPENROUTER_API_KEY to .env; ensure server-side access.
9. **Lint and Deploy**: Run ESLint/Prettier. Test locally with Supabase local. Deploy to production, monitor logs.
