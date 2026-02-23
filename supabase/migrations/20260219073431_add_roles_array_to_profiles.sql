/*
  # Add roles array to profiles

  ## Summary
  Replaces the single `role` column with a `roles` text array so one account
  can hold both 'officer' and 'organizer' roles simultaneously.

  ## Changes
  1. Add new `roles` text[] column defaulting to an empty array
  2. Backfill `roles` from existing `role` values
  3. Set NOT NULL constraint on `roles`
  4. Keep old `role` column in place to avoid breaking existing RLS/policies
     (it will be unused after the migration but safe to leave)

  ## Security
  - No new RLS policies needed; existing profile policies carry over
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'roles'
  ) THEN
    ALTER TABLE profiles ADD COLUMN roles text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

UPDATE profiles
SET roles = ARRAY[role::text]
WHERE roles = '{}' AND role IS NOT NULL;
