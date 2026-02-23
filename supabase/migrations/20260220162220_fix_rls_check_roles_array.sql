/*
  # Fix RLS policies to check roles array in addition to role column

  ## Problem
  The existing RLS policies on proposals check `profiles.role = 'organizer'`
  but users who gained the organizer role via the roles array may still have `role = 'officer'`
  as their primary role. The `roles` column is text[], so we cast for the contains check.

  ## Changes
  - Update the proposals SELECT policy to also check if 'organizer' is in the roles text array
  - Update the proposals UPDATE policy similarly
*/

-- Fix proposals SELECT policy
DROP POLICY IF EXISTS "Officers can view own proposals" ON proposals;
CREATE POLICY "Officers can view own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = user_id)
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (
            profiles.role = 'organizer'
            OR profiles.roles @> ARRAY['organizer'::text]
          )
      )
    )
  );

-- Fix proposals UPDATE policy
DROP POLICY IF EXISTS "Officers can update own proposals" ON proposals;
CREATE POLICY "Officers can update own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    (
      (auth.uid() = user_id)
      AND (status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status]))
    )
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (
            profiles.role = 'organizer'
            OR profiles.roles @> ARRAY['organizer'::text]
          )
      )
    )
  )
  WITH CHECK (
    (
      (auth.uid() = user_id)
      AND (status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status, 'submitted'::proposal_status]))
    )
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (
            profiles.role = 'organizer'
            OR profiles.roles @> ARRAY['organizer'::text]
          )
      )
    )
  );
