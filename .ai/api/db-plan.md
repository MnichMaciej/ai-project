# Database Schema Plan for Portfol.io MVP

## 1. List of Tables with Columns, Data Types, and Constraints

### users

This table stores user accounts, integrated with Supabase Auth for UUID primary keys matching `auth.users.id`. It includes fields for authentication, account locking after failed logins, and audit timestamps.

- `id`: UUID PRIMARY KEY DEFAULT uuid_generate_v4() (references Supabase auth.users.id)
- `email`: VARCHAR(255) NOT NULL UNIQUE (case-insensitive uniqueness enforced via functional index and trigger)
- `password_hash`: VARCHAR(255) NOT NULL
- `failed_login_attempts`: INTEGER DEFAULT 0 CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 5)
- `locked`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

**Triggers and Constraints**:

- Trigger: `update_updated_at` BEFORE UPDATE ON users SET updated_at = CURRENT_TIMESTAMP.
- Trigger: Normalize email to lowercase on INSERT/UPDATE for case-insensitive handling.
- Check constraint: Email format validation (e.g., regex for basic email pattern) can be added, but primarily handled in application logic.
- Unique constraint: On `lower(email)` via functional index.

### projects

This table manages user projects with required fields from PRD (name, description, technologies, status) and optional URLs. Supports CRUD operations per user.

- `id`: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `user_id`: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `name`: VARCHAR(255) NOT NULL
- `description`: TEXT NOT NULL
- `technologies`: TEXT[] NOT NULL (array of technology names)
- `status`: project_status NOT NULL (custom enum type)
- `repo_url`: VARCHAR(2048) (nullable, no URL validation in DB)
- `demo_url`: VARCHAR(2048) (nullable, no URL validation in DB)
- `preview_url`: VARCHAR(2048) (nullable, references Supabase Storage; size limits enforced in app/storage policies)
- `created_at`: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

**Custom Type**:

- `CREATE TYPE project_status AS ENUM ('PLANNING', 'IN_PROGRESS', 'MVP_COMPLETED', 'FINISHED');`

**Triggers and Constraints**:

- Trigger: `update_updated_at` BEFORE UPDATE ON projects SET updated_at = CURRENT_TIMESTAMP.
- Foreign key constraint: `user_id` with ON DELETE CASCADE to automatically remove projects when user is deleted.
- Check constraint: Ensures status is one of the enum values (implicit via enum type).

### ai_queries

This table logs AI queries per project for debugging and limit enforcement (max 5 queries per project). Each query is a separate record; supports soft delete when projects are removed.

- `id`: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `project_id`: UUID NOT NULL REFERENCES projects(id) ON DELETE SET NULL (but soft delete via trigger)
- `query_number`: INTEGER NOT NULL (unique per project, e.g., 1 to 5)
- `file_links`: TEXT[] (array of raw GitHub file URLs, max 8 enforced in app)
- `generated_description`: TEXT
- `generated_technologies`: TEXT[] (array of identified technologies)
- `created_at`: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- `deleted_at`: TIMESTAMPTZ (nullable, for soft delete)

**Triggers and Constraints**:

- Unique constraint: `(project_id, query_number)` to enforce sequential uniqueness per project.
- Check constraint: `query_number >= 1 AND query_number <= 5` (enforces limit per project).
- Trigger: On DELETE from projects, FOR EACH ROW UPDATE ai_queries SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = OLD.id (soft delete for audit retention).
- File size limits (100KB per file) and query limits enforced in application logic, not DB.

**Extensions Required**:

- `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` for `uuid_generate_v4()`.

## 2. Relationships Between Tables

- **users to projects**: One-to-Many (1:N). Each user can have multiple projects, but each project belongs to exactly one user. Enforced via foreign key `projects.user_id` REFERENCES `users.id` with ON DELETE CASCADE to ensure data integrity and automatic cleanup on user deletion (supports PRD account deletion).
- **projects to ai_queries**: One-to-Many (1:N). Each project can have multiple AI queries (up to 5), but each query belongs to exactly one project. Enforced via foreign key `ai_queries.project_id` REFERENCES `projects.id`. Uses soft delete trigger to mark queries as deleted without physical removal, preserving logs for debugging while isolating per-project data.

No many-to-many relationships are required, as technologies are stored as arrays in projects (denormalized for simplicity in MVP; avoids junction table overhead). Schema is normalized to 3NF: no transitive dependencies, with arrays used judiciously for multi-value fields to balance normalization and query performance.

## 3. Indexes

- **users**:
  - Primary key index on `id` (automatic).
  - Unique B-tree index on `email` for fast lookups and enforcement.
  - Functional B-tree index on `lower(email)` for case-insensitive uniqueness and normalization.

- **projects**:
  - Primary key index on `id` (automatic).
  - B-tree index on `user_id` (FK) for efficient joins and per-user queries (e.g., listing projects by user).

- **ai_queries**:
  - Primary key index on `id` (automatic).
  - B-tree index on `(project_id, query_number)` (composite, supports unique constraint and limit checks).
  - Partial B-tree index on `project_id` WHERE `deleted_at IS NULL` (optimizes queries for active records; excludes soft-deleted for performance).
  - No indexes on `created_at` or URLs, as MVP query volume is low (<10k records expected).

These indexes target common access patterns: user authentication (email), project listing by user, and AI limit checks per project. GIN indexes on arrays (e.g., technologies) omitted for MVP simplicity, as full-text search is not required.

## 4. PostgreSQL Row-Level Security (RLS) Policies

RLS is enabled to enforce data isolation in Supabase, aligning with multi-tenant security needs. Policies use `auth.uid()` (from Supabase Auth) to restrict access to user-owned data.

- **Enable RLS on projects**:
  - `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`
  - Policy for SELECT: `CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);`
  - Policy for INSERT: `CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);`
  - Policy for UPDATE: `CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);`
  - Policy for DELETE: `CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);`

- **Enable RLS on ai_queries** (for soft delete filtering and minimal access):
  - `ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;`
  - Policy for SELECT: `CREATE POLICY "Users can view own AI queries" ON ai_queries FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_id) AND deleted_at IS NULL);` (joins to projects for ownership; filters soft-deleted).
  - No INSERT/UPDATE/DELETE policies needed, as app logic handles writes and queries are read-only for debugging (not exposed in UI per PRD).

No RLS on users, as it's managed by Supabase Auth. Policies ensure users only access their own data, preventing cross-user leaks.

## 5. Additional Notes and Design Decisions

- **Alignment with PRD and Session Notes**: The schema fully supports PRD requirements: user auth with email/password and locking (5 failed attempts), project CRUD with required fields (name, description, technologies as array, status enum in English for consistency), optional URLs/preview, empty state (queried via count on projects), and AI integration (up to 5 queries/project, 8 files/query at 100KB each—enforced in app). Account deletion cascades to projects; AI history is logged but not UI-accessible (debug-only). Unresolved issues resolved as follows: Email validation via app (DB check optional); failed_login_attempts/locked reset via app logic (no timed unlock in MVP); enum uses English values for tech alignment; preview_url integrates with Supabase Storage (app enforces image limits, e.g., 100KB via upload policies); no audit logs table (cascade suffices for MVP); soft delete trigger on ai_queries preserves history without app changes.

- **Supabase/Tech Stack Optimization**: UUID PKs match Supabase Auth; TIMESTAMPTZ ensures timezone-aware timestamps for global use. RLS leverages Supabase's auth integration. No partitioning needed for MVP scale. Arrays (TEXT[]) simplify technologies/file_links without joins, performant for small sets. Denormalization (e.g., no separate technologies table) prioritizes simplicity over full 4NF, justified by read-heavy MVP patterns.

- **Best Practices and Scalability**: Normalized to 3NF for integrity; constraints/triggers minimize app-side validation. Indexes focus on hot paths (auth, CRUD); partial index on ai_queries optimizes limit checks. For growth (>10k users), consider GIN on arrays or partitioning on created_at. Schema supports PRD metrics (e.g., SQL queries for user/project counts, AI usage via ai_queries count). Ready for Supabase migrations; test RLS with Supabase edge functions for auth flows.
