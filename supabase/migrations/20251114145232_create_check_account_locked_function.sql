-- migration: create check_account_locked RPC function
-- purpose: check if account is locked by email before allowing password reset
-- affected tables: users
-- special considerations:
--   - uses SECURITY DEFINER to access auth.users table
--   - finds user by email in auth.users
--   - checks locked status in users table
--   - returns locked status without revealing if email exists (for security)

-- create function to check if account is locked by email
create or replace function check_account_locked(user_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_val uuid;
  is_locked boolean;
  result jsonb;
begin
  -- find user by email in auth.users
  select id into user_id_val
  from auth.users
  where email = user_email
  limit 1;

  -- if user not found, return not locked (for security, don't reveal if email exists)
  if user_id_val is null then
    return jsonb_build_object(
      'locked', false,
      'exists', false
    );
  end if;

  -- check locked status in users table
  select locked into is_locked
  from users
  where id = user_id_val;

  -- handle NULL case (user exists but no record in users table yet)
  is_locked := COALESCE(is_locked, false);

  -- build result
  result := jsonb_build_object(
    'locked', is_locked,
    'exists', true
  );

  return result;
end;
$$;

-- grant execute permission to authenticated and anon roles
grant execute on function check_account_locked(text) to authenticated;
grant execute on function check_account_locked(text) to anon;

-- migration complete

