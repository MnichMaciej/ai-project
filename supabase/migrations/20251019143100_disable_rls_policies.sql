-- migration: disable rls policies on projects and ai_queries
-- purpose: remove all row level security policies from projects and ai_queries tables
-- affected tables: projects, ai_queries
-- special considerations: 
--   - this migration disables data isolation that was enforced via rls
--   - tables will be accessible without row level security restrictions
--   - use with caution in production environments

-- ============================================================================
-- drop rls policies from projects table
-- ============================================================================

-- drop all select policies for projects
drop policy if exists "anon users can view own projects" on projects;
drop policy if exists "authenticated users can view own projects" on projects;

-- drop all insert policies for projects
drop policy if exists "anon users can insert own projects" on projects;
drop policy if exists "authenticated users can insert own projects" on projects;

-- drop all update policies for projects
drop policy if exists "anon users can update own projects" on projects;
drop policy if exists "authenticated users can update own projects" on projects;

-- drop all delete policies for projects
drop policy if exists "anon users can delete own projects" on projects;
drop policy if exists "authenticated users can delete own projects" on projects;

-- disable row level security on projects table
alter table projects disable row level security;

-- ============================================================================
-- drop rls policies from ai_queries table
-- ============================================================================

-- drop all select policies for ai_queries
drop policy if exists "anon users can view own ai queries" on ai_queries;
drop policy if exists "authenticated users can view own ai queries" on ai_queries;

-- disable row level security on ai_queries table
alter table ai_queries disable row level security;

-- migration complete
-- note: rls is now disabled on projects and ai_queries tables

