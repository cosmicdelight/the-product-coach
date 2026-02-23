/*
  # Fix collaborator RLS: break recursion and restore proposal access

  ## Problems
  1. The "Active collaborators can view all collaborators on proposal" policy
     queries proposal_collaborators from within itself, causing infinite recursion.
  2. The proposals SELECT policy does not include collaborators, so active
     collaborators cannot load the proposal at all.

  ## Fix
  1. Create a SECURITY DEFINER function `get_collaborated_proposal_ids` that
     returns all proposal IDs where the current user is an active collaborator,
     bypassing RLS to avoid recursion.
  2. Replace the recursive collaborators SELECT policy with one that uses this function.
  3. Add a proposal SELECT policy so active collaborators can view the proposals
     they are collaborating on.
*/

-- Function to safely get proposal IDs where current user is an active collaborator
CREATE OR REPLACE FUNCTION get_collaborated_proposal_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT proposal_id
  FROM proposal_collaborators
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Active collaborators can view all collaborators on proposal" ON proposal_collaborators;

-- New non-recursive policy: collaborators can see all rows for proposals they collaborate on
CREATE POLICY "Active collaborators can view all collaborators on proposal"
  ON proposal_collaborators
  FOR SELECT
  TO authenticated
  USING (
    proposal_id IN (SELECT get_collaborated_proposal_ids())
  );

-- Allow active collaborators to view the proposals they collaborate on
DROP POLICY IF EXISTS "Active collaborators can view collaborated proposals" ON proposals;

CREATE POLICY "Active collaborators can view collaborated proposals"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT get_collaborated_proposal_ids())
  );
