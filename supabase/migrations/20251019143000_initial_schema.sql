-- migration: initial schema for portfol.io mvp
-- purpose: create users, projects, and ai_queries tables with rls policies
-- affected tables: users, projects, ai_queries
-- special considerations: 
--   - uses supabase auth (auth.users) for authentication
--   - users table stores additional user data and references auth.users.id
--   - uses soft delete for ai_queries via trigger
--   - enforces data isolation via rls policies on projects and ai_queries

-- enable required extensions
create extension if not exists "uuid-ossp";

-- create custom enum type for project status
create type project_status as enum ('PLANNING', 'IN_PROGRESS', 'MVP_COMPLETED', 'FINISHED');

-- ============================================================================
-- users table
-- ============================================================================
-- stores additional user data and references supabase auth.users
-- authentication (email, password) is handled by supabase auth
-- includes account locking after failed login attempts
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  failed_login_attempts integer default 0 check (failed_login_attempts >= 0 and failed_login_attempts <= 5),
  locked boolean default false,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

-- trigger function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$ language plpgsql;

-- apply updated_at trigger to users table
create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at();

-- ============================================================================
-- projects table
-- ============================================================================
-- manages user projects with required fields and optional urls
-- supports crud operations per user with cascade delete
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(255) not null,
  description text not null,
  technologies text[] not null,
  status project_status not null,
  repo_url varchar(2048),
  demo_url varchar(2048),
  preview_url varchar(2048),
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

-- create index on user_id for efficient joins and per-user queries
create index projects_user_id_idx on projects (user_id);

-- apply updated_at trigger to projects table
create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at();

-- enable row level security on projects
alter table projects enable row level security;

-- rls policy: users can view their own projects (anon role)
create policy "anon users can view own projects"
  on projects
  for select
  to anon
  using (auth.uid() = user_id);

-- rls policy: users can view their own projects (authenticated role)
create policy "authenticated users can view own projects"
  on projects
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: users can insert their own projects (anon role)
create policy "anon users can insert own projects"
  on projects
  for insert
  to anon
  with check (auth.uid() = user_id);

-- rls policy: users can insert their own projects (authenticated role)
create policy "authenticated users can insert own projects"
  on projects
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: users can update their own projects (anon role)
create policy "anon users can update own projects"
  on projects
  for update
  to anon
  using (auth.uid() = user_id);

-- rls policy: users can update their own projects (authenticated role)
create policy "authenticated users can update own projects"
  on projects
  for update
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: users can delete their own projects (anon role)
create policy "anon users can delete own projects"
  on projects
  for delete
  to anon
  using (auth.uid() = user_id);

-- rls policy: users can delete their own projects (authenticated role)
create policy "authenticated users can delete own projects"
  on projects
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- ai_queries table
-- ============================================================================
-- logs ai queries per project for debugging and limit enforcement
-- max 5 queries per project with soft delete support
create table ai_queries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete set null,
  query_number integer not null check (query_number >= 1 and query_number <= 5),
  file_links text[],
  generated_description text,
  generated_technologies text[],
  created_at timestamptz default current_timestamp,
  deleted_at timestamptz,
  -- enforce unique query_number per project
  constraint ai_queries_project_query_unique unique (project_id, query_number)
);

-- create composite index on project_id and query_number
create index ai_queries_project_query_idx on ai_queries (project_id, query_number);

-- create partial index on active (non-deleted) queries for performance
create index ai_queries_active_idx on ai_queries (project_id) where deleted_at is null;

-- trigger function for soft delete when project is deleted
-- note: this trigger marks ai_queries as deleted without physical removal
-- preserves logs for debugging while isolating per-project data
create or replace function soft_delete_ai_queries()
returns trigger as $$
begin
  update ai_queries
  set deleted_at = current_timestamp
  where project_id = old.id and deleted_at is null;
  return old;
end;
$$ language plpgsql;

-- apply soft delete trigger when projects are deleted
create trigger soft_delete_ai_queries_trigger
  before delete on projects
  for each row
  execute function soft_delete_ai_queries();

-- enable row level security on ai_queries
alter table ai_queries enable row level security;

-- rls policy: users can view their own ai queries (anon role)
-- joins to projects table to verify ownership and filters soft-deleted records
create policy "anon users can view own ai queries"
  on ai_queries
  for select
  to anon
  using (
    auth.uid() in (
      select user_id from projects where id = project_id
    )
    and deleted_at is null
  );

-- rls policy: users can view their own ai queries (authenticated role)
-- joins to projects table to verify ownership and filters soft-deleted records
create policy "authenticated users can view own ai queries"
  on ai_queries
  for select
  to authenticated
  using (
    auth.uid() in (
      select user_id from projects where id = project_id
    )
    and deleted_at is null
  );

-- migration complete

