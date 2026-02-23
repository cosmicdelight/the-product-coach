/*
  # Break mutual RLS recursion using security definer functions

  events SELECT policy -> queries event_organisers -> triggers event_organisers SELECT policy
  event_organisers SELECT policy -> queries events -> triggers events SELECT policy
  = infinite loop

  Solution: create SECURITY DEFINER helper functions that bypass RLS when doing
  the cross-table lookups, breaking the recursion cycle.
*/

CREATE OR REPLACE FUNCTION auth_user_is_event_organiser(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_organisers
    WHERE event_id = p_event_id
      AND organiser_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_owns_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
      AND created_by = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can view open events" ON events;
DROP POLICY IF EXISTS "Event members can update events" ON events;
DROP POLICY IF EXISTS "Organisers can view collaborators on their events" ON event_organisers;

CREATE POLICY "Authenticated users can view open events"
  ON events FOR SELECT
  TO authenticated
  USING (
    status <> 'draft'
    OR created_by = auth.uid()
    OR auth_user_is_event_organiser(id)
  );

CREATE POLICY "Event members can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth_user_is_event_organiser(id))
  WITH CHECK (auth_user_is_event_organiser(id));

CREATE POLICY "Organisers can view collaborators on their events"
  ON event_organisers FOR SELECT
  TO authenticated
  USING (
    organiser_id = auth.uid()
    OR auth_user_owns_event(event_id)
  );
