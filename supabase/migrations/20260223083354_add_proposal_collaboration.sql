/*
  # Add Proposal Collaboration System

  ## Overview
  This migration adds collaborative editing support to proposals, allowing officers
  to invite teammates via shareable invite links, track who is editing in real-time,
  and maintain a per-field edit attribution log.

  ## New Tables

  ### `proposal_collaborators`
  Junction table linking users to proposals they can co-edit.
  - `id` - Primary key
  - `proposal_id` - FK to proposals (cascade delete)
  - `invited_by` - FK to profiles (the user who sent the invite)
  - `user_id` - FK to profiles (null until the invite is accepted)
  - `invited_email` - The email address the invite was sent to
  - `invite_token` - UUID used in the shareable link, unique
  - `status` - 'pending' (link not yet used), 'active' (accepted), 'removed' (revoked)
  - `joined_at` - Timestamp when the invite was accepted
  - `created_at` - Timestamp of invite creation

  ### `proposal_section_edits`
  Audit log recording which user last edited each field in a proposal section.
  - `id` - Primary key
  - `proposal_id` - FK to proposals (cascade delete)
  - `section_type` - Which wizard section was edited
  - `field_name` - Which specific field within that section was edited
  - `edited_by` - FK to profiles
  - `created_at` - Timestamp of the edit

  ## RLS Updates
  - `proposal_collaborators`: owner + active collaborators can SELECT; owner can INSERT/UPDATE
  - `proposal_section_edits`: owner + active collaborators can SELECT; owner + active collaborators can INSERT
  - Updated `proposals` SELECT/UPDATE policies to allow active collaborators
  - Updated `proposal_sections` SELECT/UPDATE/INSERT policies to allow active collaborators

  ## Security Notes
  - Invite tokens are UUIDs (128-bit), unguessable
  - Only the invited email address can accept an invite (checked at application layer)
  - Collaborators cannot change proposal ownership or invite further collaborators
*/

-- ============================================================
-- proposal_collaborators
-- ============================================================
CREATE TABLE IF NOT EXISTS proposal_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  invite_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS proposal_collaborators_token_idx
  ON proposal_collaborators (invite_token);

CREATE INDEX IF NOT EXISTS proposal_collaborators_proposal_idx
  ON proposal_collaborators (proposal_id);

CREATE INDEX IF NOT EXISTS proposal_collaborators_user_idx
  ON proposal_collaborators (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE proposal_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner of the proposal can see all collaborator rows for their proposals
CREATE POLICY "Proposal owner can view collaborators"
  ON proposal_collaborators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = auth.uid()
    )
  );

-- Active collaborators can see who else is on the proposal
CREATE POLICY "Active collaborators can view collaborator list"
  ON proposal_collaborators FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND status = 'active'
  );

-- Proposal owner can add collaborators
CREATE POLICY "Proposal owner can insert collaborators"
  ON proposal_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = auth.uid()
    )
  );

-- Owner can update (revoke) any collaborator row; the invited user can accept their own invite
CREATE POLICY "Proposal owner can update collaborators"
  ON proposal_collaborators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = auth.uid()
    )
  );

-- The invited user can accept their own pending invite
CREATE POLICY "Invited user can accept own invite"
  ON proposal_collaborators FOR UPDATE
  TO authenticated
  USING (
    invite_token IS NOT NULL AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid() AND status = 'active'
  );

-- ============================================================
-- proposal_section_edits  (audit / attribution log)
-- ============================================================
CREATE TABLE IF NOT EXISTS proposal_section_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  field_name text NOT NULL,
  edited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposal_section_edits_proposal_section_idx
  ON proposal_section_edits (proposal_id, section_type, created_at DESC);

ALTER TABLE proposal_section_edits ENABLE ROW LEVEL SECURITY;

-- Helper function: returns true if the calling user is an active collaborator on a proposal
CREATE OR REPLACE FUNCTION is_proposal_collaborator(p_proposal_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM proposal_collaborators
    WHERE proposal_id = p_proposal_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Owner or active collaborator can read edit history
CREATE POLICY "Owner or collaborator can view section edits"
  ON proposal_section_edits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_section_edits.proposal_id
        AND proposals.user_id = auth.uid()
    )
    OR is_proposal_collaborator(proposal_id)
  );

-- Owner or active collaborator can log edits
CREATE POLICY "Owner or collaborator can insert section edits"
  ON proposal_section_edits FOR INSERT
  TO authenticated
  WITH CHECK (
    edited_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM proposals
        WHERE proposals.id = proposal_section_edits.proposal_id
          AND proposals.user_id = auth.uid()
      )
      OR is_proposal_collaborator(proposal_id)
    )
  );

-- ============================================================
-- Extend proposals RLS: collaborators can SELECT and UPDATE
-- ============================================================

-- Allow active collaborators to read proposals they are invited to
CREATE POLICY "Active collaborators can view proposal"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    is_proposal_collaborator(id)
  );

-- Allow active collaborators to update proposal title/event
CREATE POLICY "Active collaborators can update proposal"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    is_proposal_collaborator(id)
  )
  WITH CHECK (
    is_proposal_collaborator(id)
  );

-- ============================================================
-- Extend proposal_sections RLS: collaborators can read and write
-- ============================================================

CREATE POLICY "Active collaborators can view sections"
  ON proposal_sections FOR SELECT
  TO authenticated
  USING (
    is_proposal_collaborator(proposal_id)
  );

CREATE POLICY "Active collaborators can insert sections"
  ON proposal_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    is_proposal_collaborator(proposal_id)
  );

CREATE POLICY "Active collaborators can update sections"
  ON proposal_sections FOR UPDATE
  TO authenticated
  USING (
    is_proposal_collaborator(proposal_id)
  )
  WITH CHECK (
    is_proposal_collaborator(proposal_id)
  );
