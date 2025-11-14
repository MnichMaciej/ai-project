-- migration: create increment_failed_login_attempts RPC function
-- purpose: increment failed login attempts and lock account after 5 attempts
-- affected tables: users
-- special considerations:
--   - uses SECURITY DEFINER to access auth.users table
--   - finds user by email in auth.users
--   - increments failed_login_attempts in users table
--   - locks account if attempts >= 5
--   - returns current failed attempts count and locked status

-- create function to increment failed login attempts
create or replace function increment_failed_login_attempts(user_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_val uuid;
  current_attempts integer;
  is_locked boolean;
  result jsonb;
begin
  -- find user by email in auth.users
  select id into user_id_val
  from auth.users
  where email = user_email
  limit 1;

  -- if user not found, return default values
  if user_id_val is null then
    return jsonb_build_object(
      'failed_attempts', 1,
      'locked', false
    );
  end if;

  -- get or create user record in users table
  insert into users (id, failed_login_attempts, locked)
  values (user_id_val, 0, false)
  on conflict (id) do nothing;

  -- increment failed attempts (capped at 5)
  -- handle NULL case by using COALESCE
  update users
  set failed_login_attempts = least(COALESCE(failed_login_attempts, 0) + 1, 5),
      locked = (COALESCE(failed_login_attempts, 0) + 1 >= 5)
  where id = user_id_val
  returning failed_login_attempts, locked into current_attempts, is_locked;

  -- ensure we have valid values
  current_attempts := COALESCE(current_attempts, 1);
  is_locked := COALESCE(is_locked, false);

  -- build result
  result := jsonb_build_object(
    'failed_attempts', current_attempts,
    'locked', is_locked
  );

  return result;
end;
$$;

-- grant execute permission to authenticated and anon roles
grant execute on function increment_failed_login_attempts(text) to authenticated;
grant execute on function increment_failed_login_attempts(text) to anon;

-- migration complete

