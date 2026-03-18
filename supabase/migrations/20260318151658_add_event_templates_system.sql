/*
  # Add Event Templates System

  ## Summary
  Introduces a proposal template system where every event must have exactly one template.
  Organisers create and customise templates; officers complete proposals that follow the
  template's structure. The default 6-section structure is created automatically when an
  event is created.

  ## New Tables

  ### event_templates
  One per event. Stores the template name and metadata.
  - id (uuid, pk)
  - event_id (uuid, unique FK → events) — one template per event
  - name (text) — template name
  - description (text)
  - created_by (uuid, FK → profiles)
  - created_at / updated_at

  ### template_sections
  Ordered list of sections for a template (replaces hardcoded SectionType enum for custom templates).
  - id (uuid, pk)
  - template_id (uuid, FK → event_templates)
  - title (text)
  - description (text)
  - section_key (text) — slug used as section identifier in proposal_sections
  - display_order (int)
  - created_at

  ### template_fields
  Individual form fields within a section.
  - id (uuid, pk)
  - section_id (uuid, FK → template_sections)
  - field_key (text) — key stored in proposal_sections.content JSON
  - label (text)
  - placeholder (text)
  - field_type (text) — 'textarea' | 'text'
  - required (bool)
  - display_order (int)
  - ai_prompt_hint (text, nullable) — optional hint for AI prompts
  - created_at

  ## Modified Tables

  ### proposals
  - Add nullable template_id (uuid, FK → event_templates) — links proposal to the event's template

  ## Security
  - RLS enabled on all three new tables
  - Event members (owner + collaborators) can manage their event's template
  - All authenticated users can read templates for non-draft events

  ## Important Notes
  1. event_id on event_templates has a UNIQUE constraint — one template per event
  2. template_sections and template_fields use display_order for rendering order
  3. Deleting sections/fields is handled by cascaded deletes from template
*/

-- ──────────────────────────────────────────────
-- event_templates
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'Proposal Template',
  description text NOT NULL DEFAULT '',
  created_by  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- template_sections
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   uuid NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  title         text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  section_key   text NOT NULL,
  display_order int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- template_fields
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_fields (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
  field_key      text NOT NULL,
  label          text NOT NULL DEFAULT '',
  placeholder    text NOT NULL DEFAULT '',
  field_type     text NOT NULL DEFAULT 'textarea' CHECK (field_type IN ('textarea', 'text')),
  required       boolean NOT NULL DEFAULT true,
  display_order  int NOT NULL DEFAULT 0,
  ai_prompt_hint text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- Add template_id to proposals
-- ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN template_id uuid REFERENCES event_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ──────────────────────────────────────────────
-- RLS: event_templates
-- ──────────────────────────────────────────────

-- Any authenticated user can read templates for non-draft events
CREATE POLICY "Authenticated users can read templates for accessible events"
  ON event_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_templates.event_id
        AND (
          events.status != 'draft'
          OR events.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM event_organisers
            WHERE event_organisers.event_id = events.id
              AND event_organisers.organiser_id = auth.uid()
          )
        )
    )
  );

-- Only event members can insert templates
CREATE POLICY "Event members can create templates"
  ON event_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM event_organisers
      WHERE event_organisers.event_id = event_id
        AND event_organisers.organiser_id = auth.uid()
    )
  );

-- Only event members can update templates
CREATE POLICY "Event members can update templates"
  ON event_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organisers
      WHERE event_organisers.event_id = event_templates.event_id
        AND event_organisers.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_organisers
      WHERE event_organisers.event_id = event_templates.event_id
        AND event_organisers.organiser_id = auth.uid()
    )
  );

-- Only event owners can delete templates
CREATE POLICY "Event owners can delete templates"
  ON event_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_templates.event_id
        AND events.created_by = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- RLS: template_sections (inherit via template → event membership)
-- ──────────────────────────────────────────────

CREATE POLICY "Authenticated users can read template sections"
  ON template_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_templates et
      JOIN events e ON e.id = et.event_id
      WHERE et.id = template_sections.template_id
        AND (
          e.status != 'draft'
          OR e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM event_organisers eo
            WHERE eo.event_id = e.id AND eo.organiser_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Event members can manage template sections"
  ON template_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_templates et
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE et.id = template_sections.template_id
        AND eo.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Event members can update template sections"
  ON template_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_templates et
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE et.id = template_sections.template_id
        AND eo.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_templates et
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE et.id = template_sections.template_id
        AND eo.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Event members can delete template sections"
  ON template_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_templates et
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE et.id = template_sections.template_id
        AND eo.organiser_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- RLS: template_fields (inherit via section → template → event membership)
-- ──────────────────────────────────────────────

CREATE POLICY "Authenticated users can read template fields"
  ON template_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN event_templates et ON et.id = ts.template_id
      JOIN events e ON e.id = et.event_id
      WHERE ts.id = template_fields.section_id
        AND (
          e.status != 'draft'
          OR e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM event_organisers eo
            WHERE eo.event_id = e.id AND eo.organiser_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Event members can manage template fields"
  ON template_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN event_templates et ON et.id = ts.template_id
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE ts.id = template_fields.section_id
        AND eo.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Event members can update template fields"
  ON template_fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN event_templates et ON et.id = ts.template_id
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE ts.id = template_fields.section_id
        AND eo.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN event_templates et ON et.id = ts.template_id
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE ts.id = template_fields.section_id
        AND eo.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Event members can delete template fields"
  ON template_fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN event_templates et ON et.id = ts.template_id
      JOIN event_organisers eo ON eo.event_id = et.event_id
      WHERE ts.id = template_fields.section_id
        AND eo.organiser_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_templates_event_id ON event_templates(event_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_template_id ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_order ON template_sections(template_id, display_order);
CREATE INDEX IF NOT EXISTS idx_template_fields_section_id ON template_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_order ON template_fields(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_proposals_template_id ON proposals(template_id);
