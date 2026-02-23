export type UserRole = 'officer' | 'organizer';

export type ProposalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'rejected';

export type NotificationType =
  | 'comment'
  | 'status_change'
  | 'review_assigned'
  | 'revision_request'
  | 'approval'
  | 'rejection'
  | 'collaborator_joined'
  | 'collaborator_submitted'
  | 'collaborator_invited';

export type SectionType =
  | 'problem_identification'
  | 'problem_validation'
  | 'user_research'
  | 'opportunity_framing'
  | 'success_definition'
  | 'executive_summary';

export interface Profile {
  id: string;
  role: UserRole;
  roles: UserRole[];
  full_name: string;
  avatar_url: string | null;
  organization: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}

export type EventStatus = 'draft' | 'open' | 'closed' | 'archived';

export interface Event {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventOrganiser {
  event_id: string;
  organiser_id: string;
  role: 'owner' | 'collaborator';
  joined_at: string;
}

export interface EventWithOrganisers extends Event {
  event_organisers: (EventOrganiser & { profile: Profile })[];
  proposal_count?: number;
}

export interface Proposal {
  id: string;
  user_id: string;
  event_id: string | null;
  title: string;
  problem_statement: string;
  solution_overview: string;
  status: ProposalStatus;
  quality_score: number;
  current_step: number;
  assigned_reviewer_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalSection {
  id: string;
  proposal_id: string;
  section_type: SectionType;
  content: Record<string, any>;
  ai_generated: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  proposal_id: string;
  user_id: string;
  parent_id: string | null;
  section_type: SectionType | null;
  content: string;
  is_resolved: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProposalReview {
  id: string;
  proposal_id: string;
  reviewer_id: string;
  overall_score: number | null;
  feasibility_score: number | null;
  impact_score: number | null;
  innovation_score: number | null;
  decision: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  proposal_id: string;
  from_status: ProposalStatus;
  to_status: ProposalStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  proposal_id: string;
  section_type: SectionType;
  prompt: string;
  suggestion: string;
  accepted: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface CommentWithProfile extends Comment {
  profile: Profile;
}

export interface ProposalWithProfile extends Proposal {
  profile: Profile;
}

export type CollaboratorStatus = 'pending' | 'active' | 'removed';

export interface ProposalCollaborator {
  id: string;
  proposal_id: string;
  invited_by: string;
  user_id: string | null;
  invited_email: string;
  invite_token: string;
  status: CollaboratorStatus;
  joined_at: string | null;
  created_at: string;
}

export interface ProposalCollaboratorWithProfile extends ProposalCollaborator {
  profile: Profile | null;
}

export interface ProposalSectionEdit {
  id: string;
  proposal_id: string;
  section_type: string;
  field_name: string;
  edited_by: string;
  created_at: string;
}

export interface ProposalSectionEditWithProfile extends ProposalSectionEdit {
  profile: Profile;
}

export interface PresenceUser {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  currentSection: string;
  editingField: string | null;
  color: string;
}
