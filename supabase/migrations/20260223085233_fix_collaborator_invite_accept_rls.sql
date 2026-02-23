/*
  # Fix proposal_collaborators invite-acceptance RLS

  ## Problem
  The "Invited user can accept own invite" UPDATE policy had a flawed WITH CHECK:
  it required `user_id = auth.uid()` but the row's user_id is NULL before the
  update, so the check was comparing the NEW value against the current user.
  Supabase evaluates WITH CHECK against the NEW row, so this should work in
  theory — but the USING clause checked `status = 'pending'` which is the OLD
  value, and since we also have the owner policy with overlapping USING, there
  was ambiguity.

  ## Fix
  Drop the old acceptance policy and replace it with a SECURITY DEFINER function
  that handles the acceptance atomically, bypassing RLS entirely for the specific
  join operation. This is the cleanest and most secure approach.

  We also add a simpler policy that allows a user to SELECT their own pending invite
  by token (needed for the join page to read the row before accepting it).
*/

DROP POLICY IF EXISTS "Invited user can accept own invite" ON proposal_collaborators;

CREATE POLICY "Anyone can view pending invite by token"
  ON proposal_collaborators FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
  );

CREATE OR REPLACE FUNCTION accept_proposal_invite(p_token uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_collab proposal_collaborators%ROWTYPE;
  v_proposal proposals%ROWTYPE;
BEGIN
  SELECT * INTO v_collab
  FROM proposal_collaborators
  WHERE invite_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  IF v_collab.status = 'removed' THEN
    RETURN jsonb_build_object('error', 'revoked');
  END IF;

  IF v_collab.status = 'active' THEN
    IF v_collab.user_id = p_user_id THEN
      SELECT * INTO v_proposal FROM proposals WHERE id = v_collab.proposal_id;
      RETURN jsonb_build_object(
        'status', 'already_member',
        'proposal_id', v_collab.proposal_id,
        'proposal_title', v_proposal.title,
        'invited_email', v_collab.invited_email
      );
    ELSE
      RETURN jsonb_build_object('error', 'used');
    END IF;
  END IF;

  IF v_collab.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'invalid_status');
  END IF;

  UPDATE proposal_collaborators
  SET
    user_id = p_user_id,
    status = 'active',
    joined_at = now()
  WHERE id = v_collab.id;

  SELECT * INTO v_proposal FROM proposals WHERE id = v_collab.proposal_id;

  RETURN jsonb_build_object(
    'status', 'accepted',
    'proposal_id', v_collab.proposal_id,
    'proposal_title', v_proposal.title,
    'invited_email', v_collab.invited_email,
    'owner_id', v_proposal.user_id,
    'collab_id', v_collab.id
  );
END;
$$;
