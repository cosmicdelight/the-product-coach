/*
  # Fix RLS on all remaining tables to check roles array

  ## Problem
  proposal_sections, comments, proposal_reviews, and approval_workflow tables
  all have policies checking `profiles.role = 'organizer'` but not the roles text array.
  Users with organizer in their roles array but officer as their primary role are blocked.

  ## Changes
  - proposal_sections: update view policy
  - comments: update view policy
  - proposal_reviews: update view, update, delete policies; add insert policy fix
  - approval_workflow: update view policy
*/

-- Helper macro: organizer check condition used throughout
-- EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'organizer' OR profiles.roles @> ARRAY['organizer']))

-- proposal_sections
DROP POLICY IF EXISTS "Users can view proposal sections" ON proposal_sections;
CREATE POLICY "Users can view proposal sections"
  ON proposal_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND (
          proposals.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND (
                profiles.role = 'organizer'
                OR profiles.roles @> ARRAY['organizer'::text]
              )
          )
        )
    )
  );

-- comments
DROP POLICY IF EXISTS "Users can view comments on accessible proposals" ON comments;
CREATE POLICY "Users can view comments on accessible proposals"
  ON comments FOR SELECT
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM proposals
        WHERE proposals.id = comments.proposal_id
          AND (
            proposals.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
                AND (
                  profiles.role = 'organizer'
                  OR profiles.roles @> ARRAY['organizer'::text]
                )
            )
          )
      )
    )
    AND (
      is_private = false
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (
            profiles.role = 'organizer'
            OR profiles.roles @> ARRAY['organizer'::text]
          )
      )
    )
  );

-- proposal_reviews: view
DROP POLICY IF EXISTS "Organizers and proposal owners can view reviews" ON proposal_reviews;
CREATE POLICY "Organizers and proposal owners can view reviews"
  ON proposal_reviews FOR SELECT
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
    OR EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_reviews.proposal_id
        AND proposals.user_id = auth.uid()
    )
  );

-- proposal_reviews: update
DROP POLICY IF EXISTS "Reviewers can update own reviews" ON proposal_reviews;
CREATE POLICY "Reviewers can update own reviews"
  ON proposal_reviews FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role = 'organizer'
          OR profiles.roles @> ARRAY['organizer'::text]
        )
    )
  )
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role = 'organizer'
          OR profiles.roles @> ARRAY['organizer'::text]
        )
    )
  );

-- proposal_reviews: delete
DROP POLICY IF EXISTS "Reviewers can delete own reviews" ON proposal_reviews;
CREATE POLICY "Reviewers can delete own reviews"
  ON proposal_reviews FOR DELETE
  TO authenticated
  USING (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role = 'organizer'
          OR profiles.roles @> ARRAY['organizer'::text]
        )
    )
  );

-- approval_workflow
DROP POLICY IF EXISTS "Users can view workflow for accessible proposals" ON approval_workflow;
CREATE POLICY "Users can view workflow for accessible proposals"
  ON approval_workflow FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = approval_workflow.proposal_id
        AND (
          proposals.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND (
                profiles.role = 'organizer'
                OR profiles.roles @> ARRAY['organizer'::text]
              )
          )
        )
    )
  );
