/*
  # Fix mutable search_path on functions

  ## Summary
  Adds `SET search_path = public` to all functions that had a mutable search_path.
  This prevents search_path injection attacks where a malicious user could create
  objects in a schema that appears earlier in the search_path.

  ## Functions fixed
  - handle_event_created
  - is_proposal_collaborator
  - auth_user_is_event_organiser
  - auth_user_owns_event
  - accept_proposal_invite
  - get_collaborated_proposal_ids
  - update_updated_at_column
*/

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_event_created()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO event_organisers (event_id, organiser_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_proposal_collaborator(p_proposal_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM proposal_collaborators
    WHERE proposal_id = p_proposal_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_is_event_organiser(p_event_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_organisers
    WHERE event_id = p_event_id
      AND organiser_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_owns_event(p_event_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
      AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_collaborated_proposal_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT proposal_id
  FROM proposal_collaborators
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.accept_proposal_invite(p_token uuid, p_user_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
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
