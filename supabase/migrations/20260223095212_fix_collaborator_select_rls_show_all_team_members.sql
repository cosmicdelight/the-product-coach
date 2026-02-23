/*
  # Fix proposal_collaborators SELECT RLS to show all team members

  ## Problem
  The current "Active collaborators can view collaborator list" policy only allows
  a collaborator to see their OWN row (user_id = auth.uid()). This means a collaborator
  cannot see other team members in the Team panel.

  ## Fix
  Replace the policy so that any active collaborator on a proposal can see ALL
  collaborator rows for that same proposal.
*/

DROP POLICY IF EXISTS "Active collaborators can view collaborator list" ON proposal_collaborators;

CREATE POLICY "Active collaborators can view all collaborators on proposal"
  ON proposal_collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposal_collaborators pc2
      WHERE pc2.proposal_id = proposal_collaborators.proposal_id
        AND pc2.user_id = auth.uid()
        AND pc2.status = 'active'
    )
  );
