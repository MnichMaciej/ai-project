-- migration: create feature_flags table
-- purpose: enable feature flag system for gradual feature rollouts
-- affected tables: feature_flags
-- special considerations:
--   - flags are global (shared across all users)
--   - each environment (dev, staging, prod) has its own database instance with specific flag values
--   - flags are boolean (enabled/disabled)
--   - no RLS needed as flags are public configuration

-- create feature_flags table
create table feature_flags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default false,
  description text,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

-- create index for fast lookups by name
create index idx_feature_flags_name on feature_flags(name);

-- apply updated_at trigger to feature_flags table
create trigger update_feature_flags_updated_at
  before update on feature_flags
  for each row
  execute function update_updated_at();

-- insert test data (default: all flags disabled)
insert into feature_flags (name, enabled, description) values
('AI_GENERATION', false, 'AI text generation feature');

-- migration complete

