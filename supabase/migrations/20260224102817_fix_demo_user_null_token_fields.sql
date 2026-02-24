/*
  # Fix Demo User Null Token Fields

  ## Summary
  The demo user was inserted with NULL values for token fields that Supabase auth
  internally expects to be empty strings (not NULL). This causes a 500 "Database error
  querying schema" when attempting to sign in.

  ## Changes
  - Updates the demo user's token/change fields from NULL to '' (empty string)
  - Sets is_anonymous = false explicitly
  - These match the default values defined on the columns
*/

UPDATE auth.users
SET
  confirmation_token   = COALESCE(confirmation_token, ''),
  recovery_token       = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change               = COALESCE(email_change, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token     = COALESCE(reauthentication_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  is_anonymous = false
WHERE email = 'demo@productcoach.app';
