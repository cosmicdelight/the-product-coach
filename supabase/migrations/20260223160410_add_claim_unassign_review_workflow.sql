/*
  # Add claim / unassign review workflow

  ## Summary
  Enables organisers to "claim" a submitted proposal for review (setting
  assigned_reviewer_id and transitioning status to under_review) and to
  "unassign" it (clearing assigned_reviewer_id and reverting status to
  submitted).

  ## Changes

  ### proposals table
  - No schema changes needed; `assigned_reviewer_id` column already exists.
  - The existing organiser UPDATE RLS policy already permits organisers to
    update any proposal, so no policy changes are required for the core claim/
    unassign flow.

  ### Organiser SELECT visibility
  - Organisers can currently see proposals where event_id IS NULL OR they are
    listed as an event organiser. This covers both linked and unlinked proposals.
  - No change required.

  ### approval_workflow
  - Ensure organisers can INSERT rows for claim and unassign transitions.
    The existing INSERT policy (if any) may restrict to proposal owners; we
    add a separate policy for organisers.
*/

DO $$
BEGIN
  -- Allow organisers to log claim / unassign workflow entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'approval_workflow'
      AND policyname = 'Organisers can insert workflow entries'
  ) THEN
    CREATE POLICY "Organisers can insert workflow entries"
      ON approval_workflow
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = changed_by
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND (
              profiles.role = 'organizer'
              OR profiles.roles @> ARRAY['organizer'::text]
            )
        )
      );
  END IF;
END $$;

-- Ensure organisers can also SELECT from approval_workflow (for any existing
-- select policies that may only cover proposal owners)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'approval_workflow'
      AND policyname = 'Organisers can view workflow entries'
  ) THEN
    CREATE POLICY "Organisers can view workflow entries"
      ON approval_workflow
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND (
              profiles.role = 'organizer'
              OR profiles.roles @> ARRAY['organizer'::text]
            )
        )
      );
  END IF;
END $$;
