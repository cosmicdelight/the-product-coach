/*
  # Add missing indexes for unindexed foreign keys

  ## Summary
  Adds covering indexes for foreign key columns that were missing indexes.
  This improves query performance for JOIN operations and cascading operations.

  ## New Indexes
  - `ai_suggestions.proposal_id` - for lookups by proposal
  - `approval_workflow.changed_by` - for lookups by user who made changes
  - `comments.parent_id` - for threaded comment lookups
  - `proposal_collaborators.invited_by` - for lookups by inviter
  - `proposal_reviews.reviewer_id` - for lookups by reviewer
  - `proposal_section_edits.edited_by` - for lookups by editor
  - `templates.created_by` - for lookups by creator
*/

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_proposal_id ON public.ai_suggestions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflow_changed_by ON public.approval_workflow(changed_by);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_proposal_collaborators_invited_by ON public.proposal_collaborators(invited_by);
CREATE INDEX IF NOT EXISTS idx_proposal_reviews_reviewer_id ON public.proposal_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_proposal_section_edits_edited_by ON public.proposal_section_edits(edited_by);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);
