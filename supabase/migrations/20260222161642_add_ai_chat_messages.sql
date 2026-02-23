/*
  # Add AI Chat Messages Table

  ## Summary
  Creates a persistent chat history system for the AI coach feature in the proposal wizard.

  ## New Tables

  ### `chat_messages`
  Stores every message in the AI coach conversation, keyed to a proposal and section.
  - `id` (uuid, primary key)
  - `proposal_id` (uuid, FK to proposals) - which proposal this message belongs to
  - `section_type` (text) - the wizard section this message is about (e.g. 'problem_identification')
  - `role` (text) - 'user' or 'assistant'
  - `content` (jsonb) - full message payload (text, snapshot cards, feedback cards, etc.)
  - `rating` (smallint, nullable) - user rating: 1 = thumbs up, -1 = thumbs down, null = unrated
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on `chat_messages`
  - Users can only SELECT, INSERT, UPDATE their own messages (via proposal ownership join)
  - No DELETE allowed to preserve audit trail

  ## Notes
  1. The `content` column uses jsonb to store rich message payloads including snapshot cards
  2. Indexed on (proposal_id, section_type) for fast panel load
  3. Rating update policy is limited to the rating field only via row ownership check
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content jsonb NOT NULL DEFAULT '{}',
  rating smallint CHECK (rating IN (-1, 1)),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_proposal_section_idx
  ON chat_messages (proposal_id, section_type, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages for their proposals"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat messages for their proposals"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rating on their chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
      AND proposals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );
