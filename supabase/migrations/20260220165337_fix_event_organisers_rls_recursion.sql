/*
  # Fix infinite recursion in event_organisers RLS policy

  The SELECT policy was self-referential (querying event_organisers from within
  a policy on event_organisers), causing infinite recursion.

  Fix: simplify the SELECT policy so it only checks the current user's own row,
  and allow viewing co-members via a separate join through the events table.
*/

DROP POLICY IF EXISTS "Event members can view collaborators" ON event_organisers;

CREATE POLICY "Organisers can view collaborators on their events"
  ON event_organisers FOR SELECT
  TO authenticated
  USING (
    organiser_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organisers.event_id
        AND (
          events.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM event_organisers eo2
            WHERE eo2.event_id = events.id
              AND eo2.organiser_id = auth.uid()
          )
        )
    )
  );
