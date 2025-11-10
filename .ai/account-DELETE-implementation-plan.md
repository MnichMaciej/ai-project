# API Endpoint Implementation Plan: DELETE /api/account

## 1. Przegląd punktu końcowego

This endpoint allows an authenticated user to delete their account, which includes removing the user record from the database and cascading deletion of all associated projects via Supabase's ON DELETE CASCADE. AI queries related to the projects are soft-deleted via a database trigger to preserve audit logs without physical removal. Upon successful deletion, the user's session is signed out. The endpoint ensures data integrity and security by leveraging Supabase authentication and Row-Level Security (RLS) policies.

## 2. Szczegóły żądania

- Metoda HTTP: DELETE
- Struktura URL: `/api/account`
- Parametry:
  - Wymagane: None (authentication handled via middleware)
  - Opcjonalne: None
- Request Body: None (empty body expected)

## 3. Wykorzystywane typy

- **DeleteAccountResponse**: 
  ```typescript
  export interface DeleteAccountResponse {
    success: boolean;
  }
  ```
  This DTO represents the success response body. Add this to `src/types.ts` if not already present.

No additional Command Models or DTOs are required, as there is no request body. Reuse existing `UserDto` from `src/types.ts` internally if needed for validation.

## 3. Szczegóły odpowiedzi

- Success Response:
  - Status Code: 200 OK
  - Body: `{ success: true }` (JSON)

- Error Responses:
  - 401 Unauthorized: `{ error: "Authentication required" }` (JSON)
  - 500 Internal Server Error: `{ error: "Failed to delete user" }` (JSON)

All responses are in JSON format. Use Zod for response validation if extending error handling.

## 4. Przepływ danych

1. **Authentication Check**: Middleware (`src/middleware/index.ts`) verifies the user's session using `supabase.auth.getUser()`. If no user, redirect or return 401.
2. **User Retrieval**: In the endpoint handler, access the authenticated user from `Astro.locals.user`.
3. **Session Sign-Out**: Call `supabase.auth.signOut()` to invalidate the session.
4. **Database Deletion**: Use Supabase client (from `context.locals`) to execute `DELETE FROM users WHERE id = $1` with the user's ID. This triggers:
   - ON DELETE CASCADE on `projects` table, removing all user projects.
   - Database trigger on `ai_queries` to soft-delete (set `deleted_at = CURRENT_TIMESTAMP`) instead of physical deletion.
5. **Response**: Return 200 with `{ success: true }` if deletion succeeds.
6. **External Interactions**: No external services (e.g., OpenRouter) are involved. All operations are within Supabase.

Extract deletion logic to a new service: `src/lib/services/account.service.ts` with a method like `deleteUserAccount(userId: string)`.

## 5. Względy bezpieczeństwa

- **Authentication**: Enforced by middleware using `@supabase/ssr` and `createSupabaseServerInstance`. Only authenticated users can access the endpoint.
- **Authorization**: RLS policies on `users`, `projects`, and `ai_queries` ensure the user can only delete their own data (USING `auth.uid() = user_id`). The endpoint should verify `Astro.locals.user.id` matches the deletion target.
- **Input Validation**: No inputs, but validate user existence before deletion. Use prepared statements to prevent SQL injection (handled by Supabase client).
- **Data Privacy**: Soft-delete preserves AI queries for audit without exposing them. Cascade deletion prevents orphaned data. Use secure cookies for session management (httpOnly, secure, sameSite='lax').
- **Rate Limiting**: Consider Supabase's built-in limits; no additional needed for MVP.
- **Potential Risks**: Ensure no cross-user deletion by strictly using authenticated user ID. Log deletion attempts for compliance.

## 6. Obsługa błędów

- **401 Unauthorized**: User not authenticated (middleware or `getUser()` fails). Message: "Authentication required".
- **404 Not Found**: If user record not found (optional enhancement; spec uses 500 for failure).
- **500 Internal Server Error**: Database deletion fails (e.g., constraint violation, Supabase error). Message: "Failed to delete user". Log full error details server-side.
- **Other Errors**: Zod validation (if added) returns 400 for invalid states. Use try-catch in service layer for graceful handling. Implement custom error types (e.g., `AccountDeletionError`) per coding practices. Log errors using console.error or a dedicated logger; no separate errors table mentioned, so use Supabase logs.

Early returns for error conditions: Check auth first, then user existence, then deletion.

## 7. Rozważania dotyczące wydajności

- **Low Volume**: Account deletion is infrequent; no performance bottlenecks expected.
- **Cascade Operations**: Supabase handles cascades efficiently; soft-delete trigger is lightweight.
- **Optimization Strategies**: Use indexed queries (e.g., on `users.id`). For large projects (unlikely in MVP), monitor query time. No pagination needed.
- **Scalability**: Supabase auto-scales; consider batching if extending to bulk deletions (not required).

## 8. Etapy wdrożenia

1. **Update Types**: Add `DeleteAccountResponse` to `src/types.ts` if missing. Ensure `UserDto` supports deletion context.

2. **Create Account Service**: In `src/lib/services/account.service.ts`, implement `async deleteUserAccount(supabase: SupabaseClient<Database>, userId: string): Promise<void>`. Include signOut and DB delete with error handling. Use guard clauses for early returns.

3. **Implement API Endpoint**: Create `src/pages/api/account.ts` (DELETE handler). Use `export const DELETE: APIRoute`. Get Supabase from `context.locals.supabase` (extend middleware to set it). Call service, handle response.

4. **Middleware Enhancement**: Ensure `src/middleware/index.ts` sets `locals.supabase` and `locals.user`. Protect `/api/account` (not in PUBLIC_PATHS).

5. **Validation and Error Handling**: Add Zod schema for response if needed. Implement try-catch with specific error mapping. Use early returns for auth checks.

6. **Database Verification**: Confirm RLS policies and triggers in Supabase (from db-plan). Test cascade and soft-delete.

7. **Testing**:
   - Unit: Vitest for service method (mock Supabase).
   - E2E: Playwright test for authenticated deletion flow, verify projects gone, AI queries soft-deleted, session cleared.
   - Integration: Test with real Supabase (local or staging).

8. **Logging and Monitoring**: Add console.error for failures. Update README or API docs if applicable.

9. **Deployment**: Ensure env vars (SUPABASE_URL, KEY) in Vercel. Run migrations if trigger changes needed.

10. **Review**: Lint fixes, TypeScript compliance. Follow clean code guidelines (error handling first, no nested ifs).
