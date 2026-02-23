/*
  # Fix proposals UPDATE policy to allow officers to submit their proposals

  ## Problem
  The existing UPDATE policy's WITH CHECK clause only allowed status values of
  'draft' or 'revision_requested', which prevented officers from changing status
  to 'submitted'. This caused the Submit for Review action to silently fail.

  ## Changes
  - Drop the existing UPDATE policy
  - Create a new UPDATE policy that:
    - USING: officer owns the proposal AND current status is 'draft' or 'revision_requested'
    - WITH CHECK: officer owns the proposal AND new status is one of 'draft', 'revision_requested', or 'submitted'
    - Organisers retain full update access (unchanged)
*/

DROP POLICY IF EXISTS "Officers can update own draft or revision_requested proposals" ON proposals;

CREATE POLICY "Officers can update own proposals"
  ON proposals
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id AND status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status]))
    OR
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'organizer'
    ))
  )
  WITH CHECK (
    (auth.uid() = user_id AND status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status, 'submitted'::proposal_status]))
    OR
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'organizer'
    ))
  );
