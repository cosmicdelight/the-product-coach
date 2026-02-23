/*
  # Fix event_organisers SELECT policy - remove all recursion

  Replace the SELECT policy with a non-recursive version that checks
  membership via the events table (created_by) instead of joining back
  to event_organisers.

  A user can see all organisers on an event if:
  - They are one of those organisers (own row check), OR
  - They own the event (created_by match in events table)
*/

DROP POLICY IF EXISTS "Organisers can view collaborators on their events" ON event_organisers;

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
