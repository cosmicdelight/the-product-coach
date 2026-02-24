/*
  # Fix RLS policies: wrap auth.uid() in (select auth.uid())

  ## Summary
  Replaces all direct `auth.uid()` calls in RLS policies with `(select auth.uid())`
  to prevent re-evaluation per row. This is the Supabase-recommended pattern for
  optimal query performance at scale (avoids the "Auth RLS Initialization Plan" warning).

  ## Tables affected
  - profiles (insert, update)
  - proposals (select, insert, update, delete)
  - proposal_sections (select, insert, update, delete)
  - comments (select, insert, update, delete)
  - proposal_reviews (select, insert, update, delete)
  - approval_workflow (select, insert)
  - ai_suggestions (select, insert, update)
  - templates (select, insert, update, delete)
  - notifications (select, update, delete)
  - events (select, insert, delete)
  - event_organisers (select, insert, delete)
  - chat_messages (select, insert, update)
  - proposal_collaborators (insert, update)
  - proposal_section_edits (select, insert)
*/

-- ============================================================
-- profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- proposals
-- ============================================================
DROP POLICY IF EXISTS "Officers can view own proposals" ON public.proposals;
CREATE POLICY "Officers can view own proposals"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (
    ((select auth.uid()) = user_id) OR (
      (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (select auth.uid())
          AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
      )) AND (
        event_id IS NULL OR EXISTS (
          SELECT 1 FROM event_organisers
          WHERE event_organisers.event_id = proposals.event_id
            AND event_organisers.organiser_id = (select auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "Officers can create proposals" ON public.proposals;
CREATE POLICY "Officers can create proposals"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Officers can update own proposals" ON public.proposals;
CREATE POLICY "Officers can update own proposals"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (
    (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status])))
    OR (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    ))
  )
  WITH CHECK (
    ((((select auth.uid()) = user_id) AND (status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status, 'submitted'::proposal_status])))
    OR (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    )))
  );

DROP POLICY IF EXISTS "Officers can delete own draft proposals" ON public.proposals;
CREATE POLICY "Officers can delete own draft proposals"
  ON public.proposals FOR DELETE
  TO authenticated
  USING (((select auth.uid()) = user_id) AND (status = 'draft'::proposal_status));

-- ============================================================
-- proposal_sections
-- ============================================================
DROP POLICY IF EXISTS "Users can view proposal sections" ON public.proposal_sections;
CREATE POLICY "Users can view proposal sections"
  ON public.proposal_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND (
          proposals.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid())
              AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
          )
        )
    )
  );

DROP POLICY IF EXISTS "Officers can create sections for own proposals" ON public.proposal_sections;
CREATE POLICY "Officers can create sections for own proposals"
  ON public.proposal_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Officers can update sections in own editable proposals" ON public.proposal_sections;
CREATE POLICY "Officers can update sections in own editable proposals"
  ON public.proposal_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND proposals.user_id = (select auth.uid())
        AND proposals.status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND proposals.user_id = (select auth.uid())
        AND proposals.status = ANY (ARRAY['draft'::proposal_status, 'revision_requested'::proposal_status])
    )
  );

DROP POLICY IF EXISTS "Officers can delete sections from own proposals" ON public.proposal_sections;
CREATE POLICY "Officers can delete sections from own proposals"
  ON public.proposal_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND proposals.user_id = (select auth.uid())
        AND proposals.status = 'draft'::proposal_status
    )
  );

-- ============================================================
-- comments
-- ============================================================
DROP POLICY IF EXISTS "Users can view comments on accessible proposals" ON public.comments;
CREATE POLICY "Users can view comments on accessible proposals"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = comments.proposal_id
        AND (
          proposals.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid())
              AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
          )
        )
    ))
    AND (
      is_private = false
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (select auth.uid())
          AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.uid()) = user_id)
    AND EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = comments.proposal_id
        AND (
          proposals.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid())
              AND profiles.role = 'organizer'::user_role
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- proposal_reviews
-- ============================================================
DROP POLICY IF EXISTS "Organizers and proposal owners can view reviews" ON public.proposal_reviews;
CREATE POLICY "Organizers and proposal owners can view reviews"
  ON public.proposal_reviews FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    ))
    OR (EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_reviews.proposal_id
        AND proposals.user_id = (select auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Organizers can create reviews" ON public.proposal_reviews;
CREATE POLICY "Organizers can create reviews"
  ON public.proposal_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.uid()) = reviewer_id)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'organizer'::user_role
    )
  );

DROP POLICY IF EXISTS "Reviewers can update own reviews" ON public.proposal_reviews;
CREATE POLICY "Reviewers can update own reviews"
  ON public.proposal_reviews FOR UPDATE
  TO authenticated
  USING (
    ((select auth.uid()) = reviewer_id)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    )
  )
  WITH CHECK (
    ((select auth.uid()) = reviewer_id)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    )
  );

DROP POLICY IF EXISTS "Reviewers can delete own reviews" ON public.proposal_reviews;
CREATE POLICY "Reviewers can delete own reviews"
  ON public.proposal_reviews FOR DELETE
  TO authenticated
  USING (
    ((select auth.uid()) = reviewer_id)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    )
  );

-- ============================================================
-- approval_workflow
-- ============================================================
DROP POLICY IF EXISTS "Organisers can view workflow entries" ON public.approval_workflow;
DROP POLICY IF EXISTS "Users can view workflow for accessible proposals" ON public.approval_workflow;
CREATE POLICY "Users can view workflow for accessible proposals"
  ON public.approval_workflow FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = approval_workflow.proposal_id
        AND (
          proposals.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid())
              AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
          )
        )
    )
  );

DROP POLICY IF EXISTS "System can create workflow records" ON public.approval_workflow;
DROP POLICY IF EXISTS "Organisers can insert workflow entries" ON public.approval_workflow;
CREATE POLICY "Organisers can insert workflow entries"
  ON public.approval_workflow FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.uid()) = changed_by)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    )
  );

-- ============================================================
-- ai_suggestions
-- ============================================================
DROP POLICY IF EXISTS "Users can view AI suggestions for accessible proposals" ON public.ai_suggestions;
CREATE POLICY "Users can view AI suggestions for accessible proposals"
  ON public.ai_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = ai_suggestions.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create AI suggestions for own proposals" ON public.ai_suggestions;
CREATE POLICY "Users can create AI suggestions for own proposals"
  ON public.ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = ai_suggestions.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update AI suggestions for own proposals" ON public.ai_suggestions;
CREATE POLICY "Users can update AI suggestions for own proposals"
  ON public.ai_suggestions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = ai_suggestions.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = ai_suggestions.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- templates
-- ============================================================
DROP POLICY IF EXISTS "Users can view public templates" ON public.templates;
CREATE POLICY "Users can view public templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING ((is_public = true) OR (created_by = (select auth.uid())));

DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
CREATE POLICY "Users can create templates"
  ON public.templates FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

-- ============================================================
-- notifications
-- ============================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- events
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view open events" ON public.events;
CREATE POLICY "Authenticated users can view open events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    (status <> 'draft'::event_status)
    OR (created_by = (select auth.uid()))
    OR auth_user_is_event_organiser(id)
  );

DROP POLICY IF EXISTS "Organisers can create events" ON public.events;
CREATE POLICY "Organisers can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.uid()) = created_by)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND (profiles.role = 'organizer'::user_role OR profiles.roles @> ARRAY['organizer'::text])
    )
  );

DROP POLICY IF EXISTS "Event owners can delete events" ON public.events;
CREATE POLICY "Event owners can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- ============================================================
-- event_organisers
-- ============================================================
DROP POLICY IF EXISTS "Organisers can view collaborators on their events" ON public.event_organisers;
CREATE POLICY "Organisers can view collaborators on their events"
  ON public.event_organisers FOR SELECT
  TO authenticated
  USING (
    (organiser_id = (select auth.uid()))
    OR auth_user_owns_event(event_id)
  );

DROP POLICY IF EXISTS "Event owners can add collaborators" ON public.event_organisers;
CREATE POLICY "Event owners can add collaborators"
  ON public.event_organisers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organisers.event_id
        AND events.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Event owners can remove collaborators" ON public.event_organisers;
CREATE POLICY "Event owners can remove collaborators"
  ON public.event_organisers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organisers.event_id
        AND events.created_by = (select auth.uid())
    )
  );

-- ============================================================
-- chat_messages
-- ============================================================
DROP POLICY IF EXISTS "Users can view chat messages for their proposals" ON public.chat_messages;
CREATE POLICY "Users can view chat messages for their proposals"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert chat messages for their proposals" ON public.chat_messages;
CREATE POLICY "Users can insert chat messages for their proposals"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update rating on their chat messages" ON public.chat_messages;
CREATE POLICY "Users can update rating on their chat messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = chat_messages.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- proposal_collaborators
-- ============================================================
DROP POLICY IF EXISTS "Proposal owner can view collaborators" ON public.proposal_collaborators;
CREATE POLICY "Proposal owner can view collaborators"
  ON public.proposal_collaborators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Proposal owner can insert collaborators" ON public.proposal_collaborators;
CREATE POLICY "Proposal owner can insert collaborators"
  ON public.proposal_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    (invited_by = (select auth.uid()))
    AND EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Proposal owner can update collaborators" ON public.proposal_collaborators;
CREATE POLICY "Proposal owner can update collaborators"
  ON public.proposal_collaborators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_collaborators.proposal_id
        AND proposals.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- proposal_section_edits
-- ============================================================
DROP POLICY IF EXISTS "Owner or collaborator can view section edits" ON public.proposal_section_edits;
CREATE POLICY "Owner or collaborator can view section edits"
  ON public.proposal_section_edits FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_section_edits.proposal_id
        AND proposals.user_id = (select auth.uid())
    ))
    OR is_proposal_collaborator(proposal_id)
  );

DROP POLICY IF EXISTS "Owner or collaborator can insert section edits" ON public.proposal_section_edits;
CREATE POLICY "Owner or collaborator can insert section edits"
  ON public.proposal_section_edits FOR INSERT
  TO authenticated
  WITH CHECK (
    (edited_by = (select auth.uid()))
    AND (
      (EXISTS (
        SELECT 1 FROM proposals
        WHERE proposals.id = proposal_section_edits.proposal_id
          AND proposals.user_id = (select auth.uid())
      ))
      OR is_proposal_collaborator(proposal_id)
    )
  );
