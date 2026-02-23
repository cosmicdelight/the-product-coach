/*
  # Fix mutual recursion between events and event_organisers RLS policies

  The events SELECT policy queries event_organisers, and the event_organisers
  SELECT policy queries events - creating an infinite loop.

  Fix:
  - events SELECT: keep checking event_organisers (safe direction)
  - event_organisers SELECT: remove the events join entirely; only allow
    a user to see rows where they are the organiser OR they own the event
    by checking events.created_by WITHOUT going back through event_organisers.

  This breaks the cycle: events -> event_organisers is a one-way check,
  event_organisers -> events.created_by is a simple column check with no
  further policy evaluation needed from event_organisers.
*/

DROP POLICY IF EXISTS "Organisers can view collaborators on their events" ON event_organisers;
DROP POLICY IF EXISTS "Event members can view collaborators" ON event_organisers;

CREATE POLICY "Organisers can view collaborators on their events"
  ON event_organisers FOR SELECT
  TO authenticated
  USING (
    organiser_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organisers.event_id
        AND events.created_by = auth.uid()
    )
  );
