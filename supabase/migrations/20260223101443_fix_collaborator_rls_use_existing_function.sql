/*
  # Fix collaborator RLS: use existing is_proposal_collaborator function

  ## Problem
  The get_collaborated_proposal_ids() function approach may have edge cases.
  Switch to using the well-tested is_proposal_collaborator() function which
  already works correctly for proposal_sections access.

  ## Fix
  Replace the SELECT policy on proposal_collaborators to use
  is_proposal_collaborator(proposal_id) directly, matching the same pattern
  used by proposal_sections.
*/

DROP POLICY IF EXISTS "Active collaborators can view all collaborators on proposal" ON proposal_collaborators;

CREATE POLICY "Active collaborators can view all collaborators on proposal"
  ON proposal_collaborators
  FOR SELECT
  TO authenticated
  USING (
    is_proposal_collaborator(proposal_id)
  );
