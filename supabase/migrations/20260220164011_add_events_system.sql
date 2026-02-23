/*
  # Add Events System

  ## Summary
  Introduces a first-class "event" concept (e.g. hackathons) that organisers
  can create and manage. Officers submit proposals to specific events.
  Multiple organisers can collaborate on the same event.

  ## New Tables

  ### events
  - id (uuid, pk)
  - title (text, not null)
  - description (text)
  - status: draft | open | closed | archived
  - start_date (timestamptz)
  - end_date (timestamptz)
  - created_by (uuid, fk → profiles)
  - created_at / updated_at

  ### event_organisers
  Junction table allowing multiple organisers to collaborate on an event.
  - event_id (uuid, fk → events)
  - organiser_id (uuid, fk → profiles)
  - role: owner | collaborator
  - joined_at (timestamptz)
  - Primary key is (event_id, organiser_id)

  ## Modified Tables

  ### proposals
  - Add nullable event_id (uuid, fk → events)

  ## Security
  - RLS enabled on both new tables
  - Organisers can view/manage events they own or collaborate on
  - All authenticated users can view open/closed/archived events (for browsing)
  - Officers can view open events to choose when submitting
  - Proposals RLS updated: organisers only see proposals belonging to events they are a member of
*/

-- ──────────────────────────────────────────────
-- event_status enum
-- ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('draft', 'open', 'closed', 'archived');
  END IF;
END $$;

-- ──────────────────────────────────────────────
-- events table
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  status       event_status NOT NULL DEFAULT 'draft',
  start_date   timestamptz,
  end_date     timestamptz,
  created_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- event_organisers junction table
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_organisers (
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organiser_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, organiser_id)
);

ALTER TABLE event_organisers ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- Add event_id to proposals
-- ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ──────────────────────────────────────────────
-- RLS: events
-- ──────────────────────────────────────────────

-- Any authenticated user can view non-draft events (for browsing / submitting proposals)
CREATE POLICY "Authenticated users can view open events"
  ON events FOR SELECT
  TO authenticated
  USING (
    status != 'draft'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_organisers
      WHERE event_organisers.event_id = events.id
        AND event_organisers.organiser_id = auth.uid()
    )
  );

-- Only organisers can create events
CREATE POLICY "Organisers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.role = 'organizer' OR profiles.roles @> ARRAY['organizer'::text])
    )
  );

-- Event members (owner + collaborators) can update an event
CREATE POLICY "Event members can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organisers
      WHERE event_organisers.event_id = events.id
        AND event_organisers.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_organisers
      WHERE event_organisers.event_id = events.id
        AND event_organisers.organiser_id = auth.uid()
    )
  );

-- Only the event owner (created_by) can delete an event
CREATE POLICY "Event owners can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ──────────────────────────────────────────────
-- RLS: event_organisers
-- ──────────────────────────────────────────────

-- Members of an event can view all organisers on that event
CREATE POLICY "Event members can view collaborators"
  ON event_organisers FOR SELECT
  TO authenticated
  USING (
    organiser_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_organisers eo2
      WHERE eo2.event_id = event_organisers.event_id
        AND eo2.organiser_id = auth.uid()
    )
  );

-- Only event owners can add collaborators
CREATE POLICY "Event owners can add collaborators"
  ON event_organisers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND events.created_by = auth.uid()
    )
  );

-- Only event owners can remove collaborators
CREATE POLICY "Event owners can remove collaborators"
  ON event_organisers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organisers.event_id
        AND events.created_by = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- When an event is created, auto-insert the creator as owner
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_event_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO event_organisers (event_id, organiser_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_created ON events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION handle_event_created();

-- ──────────────────────────────────────────────
-- Updated proposals SELECT policy:
-- officers see own proposals;
-- organisers see proposals belonging to their events
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Officers can view own proposals" ON proposals;

CREATE POLICY "Officers can view own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (profiles.role = 'organizer' OR profiles.roles @> ARRAY['organizer'::text])
      )
      AND (
        event_id IS NULL
        OR EXISTS (
          SELECT 1 FROM event_organisers
          WHERE event_organisers.event_id = proposals.event_id
            AND event_organisers.organiser_id = auth.uid()
        )
      )
    )
  );

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_organisers_organiser ON event_organisers(organiser_id);
CREATE INDEX IF NOT EXISTS idx_proposals_event_id ON proposals(event_id);
