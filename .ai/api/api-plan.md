# REST API Plan

## 1. Resources

- **users**: Maps to the `users` table in the database. Handles user accounts, registration, login, locking, and deletion. Integrated with Supabase Auth for core authentication, with custom fields for failed attempts and locking.
- **projects**: Maps to the `projects` table. Represents user projects with CRUD operations. Each project belongs to a user (via `userId` foreign key with ON DELETE CASCADE).
- **ai_queries**: Maps to the `ai_queries` table (internal, not directly exposed for CRUD). Logs AI generations per project for limit enforcement and auditing. Accessed indirectly via project AI endpoint.

## 2. Endpoints

### projects Resource

- **Method**: GET  
  **Path**: /api/projects  
  **Description**: Lists user's projects (shows name, technologies, status). Used for home page; empty array triggers empty state in UI. Supports optional pagination.  
  **Query Params**: limit=integer (default 50), offset=integer, sort=status:asc/desc  
  **Request JSON**: None  
  **Response JSON**:

  ```json
  {
    "projects": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "technologies": ["string"],
        "status": "PLANNING|IN_PROGRESS|MVP_COMPLETED|FINISHED",
        "repoUrl": "string|null",
        "demoUrl": "string|null",
        "previewUrl": "string|null",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ],
    "total": integer
  }
  ```

  **Success Codes/Messages**: 200 OK  
  **Error Codes/Messages**:
  - 401 Unauthorized - "Authentication required"
  - 500 Internal Server Error - "Failed to fetch projects"

- **Method**: POST  
  **Path**: /api/projects  
  **Description**: Creates a new project for the authenticated user.  
  **Query Params**: None  
  **Request JSON**:

  ```json
  {
    "name": "string (required, max 255)",
    "description": "string (required)",
    "technologies": ["string"] (required, array min 1),
    "status": "PLANNING|IN_PROGRESS|MVP_COMPLETED|FINISHED" (required),
    "repoUrl": "string|null",
    "demoUrl": "string|null",
    "previewUrl": "string|null (Supabase Storage URL)"
  }
  ```

  **Response JSON**: Single project object (as in list)  
  **Success Codes/Messages**: 201 Created - "Project created"  
  **Error Codes/Messages**:
  - 400 Bad Request - "Missing required fields or invalid status"
  - 401 Unauthorized
  - 500 Internal Server Error

- **Method**: PATCH  
  **Path**: /api/projects/{id}  
  **Description**: Updates an existing project (partial update). Only owner can edit.  
  **Query Params**: None  
  **Request JSON**: Partial of create payload (e.g., {"description": "updated"})  
  **Response JSON**: Updated project object  
  **Success Codes/Messages**: 200 OK - "Project updated"  
  **Error Codes/Messages**:
  - 400 Bad Request - "Invalid update"
  - 403 Forbidden - "Not owner"
  - 404 Not Found
  - 500 Internal Server Error

- **Method**: DELETE  
  **Path**: /api/projects/{id}  
  **Description**: Deletes a project (cascades to ai_queries soft delete). Only owner.  
  **Query Params**: None  
  **Request JSON**: None  
  **Response JSON**:

  ```json
  {
    "message": "Project deleted"
  }
  ```

  **Success Codes/Messages**: 200 OK  
  **Error Codes/Messages**:
  - 403 Forbidden - "Not owner"
  - 404 Not Found
  - 500 Internal Server Error

- **Method**: POST  
  **Path**: /api/projects/{id}/ai-generate  
  **Description**: Generates project description/technologies via AI (Openrouter). Enforces limits: 5 queries/project, 8 files, 100KB/file. Populates project fields on success; logs to ai_queries.  
  **Query Params**: None  
  **Request JSON**:
  ```json
  {
    "fileLinks": ["string"] (array, max 8, raw GitHub URLs)
  }
  ```
  **Response JSON**:
  ```json
  {
    "description": "generated string",
    "technologies": ["string"],
    "queryCount": integer (current after this)
  }
  ```
  **Success Codes/Messages**: 200 OK - "AI generation complete"  
  **Error Codes/Messages**:
  - 400 Bad Request - "Too many files (>8) or file too large (>100KB)"
  - 429 Too Many Requests - "AI limit reached (5 queries/project)"
  - 401 Unauthorized
  - 403 Forbidden - "Not owner"
  - 404 Not Found
  - 500 Internal Server Error - "AI service failed"

## 3. Authentication and Authorization

- **Mechanism**: Supabase Auth (email/password only, per PRD 3.1). Uses JWT access tokens in Authorization: Bearer header for protected endpoints. On register/login, return session with tokens. Supabase handles password hashing/storage in auth.users; sync to custom users table for locking (via Supabase edge function or app logic).
- **Implementation Details**: All endpoints except public (none in MVP) require valid token. Verify via Supabase SDK: supabase.auth.getUser(token). Authorization: Enforce userId = auth.uid() from token (leverage DB RLS policies). For locking: On failed login, update users.failedLoginAttempts++; if ==5, set locked=true. Block login if locked. Rate limiting: Use Supabase or middleware for AI endpoints (e.g., 5/min per project). No OAuth in MVP.

## 4. Validation and Business Logic

- **Validation per Resource**:
  - **users**: Email (unique, format regex); password (min 8 chars, uppercase/lowercase/number/special); confirmPassword match; failedAttempts (0-5); locked (bool). Enforced in app + DB constraints (unique email, check constraints).
  - **projects**: name (required, max 255); description (required); technologies (required array, min 1, strings); status (enum validation); URLs (optional, valid URL format app-side); previewUrl (Supabase Storage, image <1MB app-enforced). DB: NOT NULL, enum type.
  - **ai_queries** (internal): queryNumber (1-5 unique per project); fileLinks (array <=8); Validate file sizes by HEAD request before AI call. DB: unique (projectId, queryNumber), check queryNumber <=5.
- **Business Logic Implementation**:
  - **Auth/Locking**: In login/register: Use Supabase.signUp/signInWithPassword; on failure, atomic update to users table (increment attempts, lock if needed). Reset attempts on success.
  - **Project CRUD**: Use Supabase.from('projects').insert/select/update/delete with RLS ensuring ownership. For create/list/edit/delete: Set userId = auth.uid(); validate required fields pre-insert.
  - **Empty State**: Client-side: If GET /projects returns empty, show UI with CTA to POST /projects.
  - **AI Integration**: In POST /ai-generate: Check count(ai_queries WHERE projectId = id AND deletedAt IS NULL) <5; fetch file sizes; if valid, call Openrouter API (prompt: "Analyze code in these files: [links]. Generate project description and tech stack."); Update project description/technologies; Insert to ai_queries with queryNumber = count+1. Limits: Server-side block, client disable button on 5.
  - **Deletion Cascade**: Supabase handles ON DELETE CASCADE for projects; trigger soft-deletes ai_queries. Account delete: Supabase.auth.signOut() + delete from users (cascades).
  - **General**: Error handling: Custom errors with user-friendly messages (e.g., no stack traces). Logging: Console/DB for failures. Performance: Indexes used by Supabase queries; pagination for lists if >50 items.
