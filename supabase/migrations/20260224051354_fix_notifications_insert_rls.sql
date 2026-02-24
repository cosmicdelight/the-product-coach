/*
  # Fix notifications INSERT policy (always-true bypass)

  ## Summary
  The "System can create notifications" INSERT policy had `WITH CHECK (true)`,
  which allowed any authenticated user to insert notifications for any user_id —
  effectively bypassing row-level security.

  This migration replaces it with a service-role-only approach: unauthenticated
  service role inserts are allowed (used by triggers/edge functions), and
  authenticated users cannot insert notifications directly.

  The policy is dropped and replaced with one that restricts inserts to the
  service role only by removing the authenticated policy entirely.
  Notifications are only created server-side via SECURITY DEFINER functions
  or service role calls.
*/

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT NULL,
  p_proposal_id uuid DEFAULT NULL,
  p_event_id uuid DEFAULT NULL
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data, proposal_id, event_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_data, p_proposal_id, p_event_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
