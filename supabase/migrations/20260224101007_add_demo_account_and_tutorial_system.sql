/*
  # Demo Account and Tutorial System

  ## Summary
  Adds the infrastructure needed to support a public demo account with a guided tutorial experience.

  ## Changes

  ### 1. Modified Tables
  - `profiles`: Added `is_demo` boolean column (default false) to flag the demo user account

  ### 2. New Tables
  - `demo_proposal_snapshots`: Stores the original seeded content for each proposal section,
    enabling the "Reset Demo" feature to restore the demo proposal to its original state.

  ### 3. New Functions
  - `reset_demo_proposal(demo_user_id uuid)`: Restores all demo proposal sections from snapshots.
    Runs as SECURITY DEFINER so the demo user can call it without needing direct write access
    to snapshot rows.

  ## Security
  - RLS enabled on `demo_proposal_snapshots`
  - Demo user can only SELECT their own snapshots (used during reset)
  - Reset is performed via the SECURITY DEFINER function to avoid privilege escalation
  - `is_demo` column on profiles has no RLS impact — it is read-only from the app layer

  ## Notes
  1. The actual demo auth user and seeded proposal data are created separately via the Supabase dashboard or a one-time seed script
  2. The `is_demo` flag is set to false by default for all new users
  3. The snapshot table stores JSON content per section, mirroring the `proposal_sections.content` structure
*/

-- 1. Add is_demo flag to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- 2. Create demo_proposal_snapshots table
CREATE TABLE IF NOT EXISTS demo_proposal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, section_type)
);

ALTER TABLE demo_proposal_snapshots ENABLE ROW LEVEL SECURITY;

-- Demo user can read their own snapshots
CREATE POLICY "Demo user can read own snapshots"
  ON demo_proposal_snapshots FOR SELECT
  TO authenticated
  USING (demo_user_id = auth.uid());

-- 3. Create reset function (SECURITY DEFINER so it can bypass RLS on proposal_sections)
CREATE OR REPLACE FUNCTION reset_demo_proposal(p_demo_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot demo_proposal_snapshots%ROWTYPE;
BEGIN
  -- Verify the caller is actually the demo user
  IF auth.uid() <> p_demo_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify the caller has is_demo = true
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_demo_user_id AND is_demo = true
  ) THEN
    RAISE EXCEPTION 'Not a demo account';
  END IF;

  -- Restore each section from snapshot
  FOR v_snapshot IN
    SELECT * FROM demo_proposal_snapshots WHERE demo_user_id = p_demo_user_id
  LOOP
    UPDATE proposal_sections
    SET
      content = v_snapshot.content,
      completed = v_snapshot.completed,
      updated_at = now()
    WHERE
      proposal_id = v_snapshot.proposal_id
      AND section_type = v_snapshot.section_type;
  END LOOP;

  -- Reset proposal title, status and current_step
  UPDATE proposals
  SET
    title = 'Digital Leave Management System',
    status = 'draft',
    current_step = 1,
    quality_score = 0,
    submitted_at = NULL,
    reviewed_at = NULL,
    assigned_reviewer_id = NULL,
    updated_at = now()
  WHERE user_id = p_demo_user_id;

END;
$$;

-- Grant execute permission to authenticated users (function itself validates the caller is demo)
GRANT EXECUTE ON FUNCTION reset_demo_proposal(uuid) TO authenticated;
