/*
  # Fix Demo User Auth Identity

  ## Summary
  The demo auth user was inserted directly into auth.users but without a corresponding
  row in auth.identities. Supabase requires an identity record for email/password login
  to work. This migration adds the missing identity row for the demo user.

  ## Notes
  - Uses ON CONFLICT DO NOTHING so it is safe to run multiple times
  - The identity_data must contain the email field for email provider logins
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@productcoach.app';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Demo user not found';
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', 'demo@productcoach.app'),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;
END $$;
