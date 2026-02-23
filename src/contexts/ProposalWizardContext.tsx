import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  Proposal, ProposalSection, SectionType,
  ProposalCollaboratorWithProfile, PresenceUser,
} from '../types/database';

const PRESENCE_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

function getPresenceColor(index: number): string {
  return PRESENCE_COLORS[index % PRESENCE_COLORS.length];
}

interface WizardContextType {
  proposal: Proposal | null;
  sections: Record<string, ProposalSection>;
  currentStep: number;
  loading: boolean;
  saving: boolean;
  isCollaborator: boolean;
  collaborators: ProposalCollaboratorWithProfile[];
  presenceList: PresenceUser[];
  saveSection: (sectionType: SectionType, content: Record<string, any>, completed: boolean) => Promise<void>;
  updateTitle: (title: string) => Promise<void>;
  updateEventId: (eventId: string | null) => Promise<void>;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  submitProposal: () => Promise<void>;
  inviteCollaborator: (email: string) => Promise<{ inviteUrl: string; collaboratorId: string }>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  logSectionEdit: (sectionType: SectionType, fieldName: string) => Promise<void>;
  updatePresenceField: (fieldName: string | null) => void;
  refreshCollaborators: () => Promise<void>;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const STEP_SECTION_MAP: Record<number, SectionType> = {
  1: 'problem_identification',
  2: 'problem_validation',
  3: 'user_research',
  4: 'opportunity_framing',
  5: 'success_definition',
  6: 'executive_summary',
};

export function ProposalWizardProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<Record<string, ProposalSection>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [collaborators, setCollaborators] = useState<ProposalCollaboratorWithProfile[]>([]);
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);
  const savedRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const proposalRef = useRef<Proposal | null>(null);
  const currentStepRef = useRef(1);

  useEffect(() => {
    proposalRef.current = proposal;
  }, [proposal]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (id) {
      loadProposal(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (proposal && !savedRef.current) {
        supabase.from('proposals').delete().eq('id', proposal.id);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [proposal]);

  const setupPresenceChannel = (proposalId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`proposal:${proposalId}`, {
      config: { presence: { key: user?.id || 'anon' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<Omit<PresenceUser, 'userId'> & { user_id: string }>();
        const users: PresenceUser[] = [];
        let colorIndex = 0;
        Object.entries(state).forEach(([, presences]) => {
          presences.forEach((p) => {
            if (p.user_id !== user?.id) {
              users.push({
                userId: p.user_id,
                fullName: (p as any).fullName || 'Team Member',
                avatarUrl: (p as any).avatarUrl || null,
                currentSection: (p as any).currentSection || '',
                editingField: (p as any).editingField || null,
                color: getPresenceColor(colorIndex++),
              });
            }
          });
        });
        setPresenceList(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user && profile) {
          await channel.track({
            user_id: user.id,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            currentSection: STEP_SECTION_MAP[currentStepRef.current] || '',
            editingField: null,
          });
        }
      });

    channelRef.current = channel;
  };

  const loadProposal = async (proposalId: string) => {
    savedRef.current = true;
    try {
      const { data: p, error } = await supabase.from('proposals').select('*').eq('id', proposalId).maybeSingle();
      if (error || !p) {
        console.error('Error loading proposal:', error);
        setLoading(false);
        return;
      }
      setProposal(p);
      setCurrentStep(p.current_step);
      currentStepRef.current = p.current_step;

      const isOwner = p.user_id === user?.id;
      setIsCollaborator(!isOwner);

      const { data: s } = await supabase.from('proposal_sections').select('*').eq('proposal_id', proposalId);
      const map: Record<string, ProposalSection> = {};
      s?.forEach(sec => { map[sec.section_type] = sec; });
      setSections(map);

      await loadCollaborators(proposalId);
      setupPresenceChannel(proposalId);
    } catch (e) {
      console.error('Error loading proposal:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCollaborators = async (proposalId: string) => {
    const { data, error } = await supabase
      .from('proposal_collaborators')
      .select('*, profile:profiles!proposal_collaborators_user_id_fkey(*)')
      .eq('proposal_id', proposalId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true });
    console.log('[loadCollaborators] proposalId:', proposalId);
    console.log('[loadCollaborators] data:', data);
    console.log('[loadCollaborators] error:', error);
    setCollaborators((data || []) as ProposalCollaboratorWithProfile[]);
  };

  const refreshCollaborators = useCallback(async () => {
    if (proposalRef.current) {
      await loadCollaborators(proposalRef.current.id);
    }
  }, []);

  const updatePresenceField = useCallback((fieldName: string | null) => {
    if (!channelRef.current) return;
    channelRef.current.track({
      user_id: user?.id,
      fullName: profile?.full_name,
      avatarUrl: profile?.avatar_url,
      currentSection: STEP_SECTION_MAP[currentStepRef.current] || '',
      editingField: fieldName,
    });
  }, [user, profile]);

  const ensureProposalExists = async (): Promise<Proposal> => {
    if (proposal) return proposal;
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('proposals')
      .insert({ user_id: user.id, title: 'Untitled Proposal', problem_statement: '', status: 'draft', current_step: 1 })
      .select()
      .single();
    if (error) throw error;
    setProposal(data);
    navigate(`/proposals/${data.id}/edit`, { replace: true });
    setupPresenceChannel(data.id);
    return data;
  };

  const saveSection = async (sectionType: SectionType, content: Record<string, any>, completed: boolean) => {
    setSaving(true);
    try {
      const p = await ensureProposalExists();
      savedRef.current = true;
      const { data, error } = await supabase
        .from('proposal_sections')
        .upsert(
          { proposal_id: p.id, section_type: sectionType, content, completed },
          { onConflict: 'proposal_id,section_type' }
        )
        .select()
        .single();
      if (error) throw error;
      setSections(prev => ({ ...prev, [sectionType]: data }));

      const proposalUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (sectionType === 'problem_identification' && content.problemStatement) {
        proposalUpdates.problem_statement = content.problemStatement;
      }
      await supabase.from('proposals').update(proposalUpdates).eq('id', p.id);
      if (proposalUpdates.problem_statement) {
        setProposal(prev => prev ? { ...prev, problem_statement: proposalUpdates.problem_statement } : null);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateTitle = async (title: string) => {
    const p = await ensureProposalExists();
    savedRef.current = true;
    await supabase.from('proposals').update({ title }).eq('id', p.id);
    setProposal(prev => prev ? { ...prev, title } : null);
  };

  const updateEventId = async (eventId: string | null) => {
    const p = await ensureProposalExists();
    savedRef.current = true;
    await supabase.from('proposals').update({ event_id: eventId }).eq('id', p.id);
    setProposal(prev => prev ? { ...prev, event_id: eventId } : null);
  };

  const goToStep = async (step: number) => {
    if (!proposal || step < 1 || step > 6) return;
    await supabase.from('proposals').update({ current_step: step }).eq('id', proposal.id);
    setCurrentStep(step);
    currentStepRef.current = step;
    setProposal(prev => prev ? { ...prev, current_step: step } : null);
    if (channelRef.current) {
      channelRef.current.track({
        user_id: user?.id,
        fullName: profile?.full_name,
        avatarUrl: profile?.avatar_url,
        currentSection: STEP_SECTION_MAP[step] || '',
        editingField: null,
      });
    }
  };

  const nextStep = () => { if (currentStep < 6) goToStep(currentStep + 1); };
  const previousStep = () => { if (currentStep > 1) goToStep(currentStep - 1); };

  const submitProposal = async () => {
    if (!proposal) return;
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', proposal.id);
    if (error) throw error;
    savedRef.current = true;
    setProposal(prev => prev ? { ...prev, status: 'submitted' } : null);

    const activeCollabs = collaborators.filter(c => c.status === 'active' && c.user_id && c.user_id !== user?.id);
    if (activeCollabs.length > 0) {
      await supabase.from('notifications').insert(
        activeCollabs.map(c => ({
          user_id: c.user_id!,
          type: 'collaborator_submitted',
          title: 'Proposal Submitted',
          message: `"${proposal.title}" was submitted by ${profile?.full_name || 'a team member'}.`,
          link: `/proposals/${proposal.id}`,
          read: false,
        }))
      );
    }

    navigate('/officer/dashboard');
  };

  const inviteCollaborator = async (email: string): Promise<{ inviteUrl: string; collaboratorId: string }> => {
    const p = await ensureProposalExists();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('proposal_collaborators')
      .insert({
        proposal_id: p.id,
        invited_by: user.id,
        invited_email: email.trim().toLowerCase(),
      })
      .select()
      .single();

    if (error) throw error;
    await loadCollaborators(p.id);

    const origin = window.location.origin;
    const inviteUrl = `${origin}/proposals/${p.id}/join?token=${data.invite_token}`;
    return { inviteUrl, collaboratorId: data.id };
  };

  const removeCollaborator = async (collaboratorId: string) => {
    const { error } = await supabase
      .from('proposal_collaborators')
      .update({ status: 'removed' })
      .eq('id', collaboratorId);
    if (error) throw error;
    if (proposalRef.current) {
      await loadCollaborators(proposalRef.current.id);
    }
  };

  const logSectionEdit = async (sectionType: SectionType, fieldName: string) => {
    if (!user || !proposal) return;
    await supabase.from('proposal_section_edits').insert({
      proposal_id: proposal.id,
      section_type: sectionType,
      field_name: fieldName,
      edited_by: user.id,
    });
  };

  return (
    <WizardContext.Provider value={{
      proposal,
      sections,
      currentStep,
      loading,
      saving,
      isCollaborator,
      collaborators,
      presenceList,
      saveSection,
      updateTitle,
      updateEventId,
      goToStep,
      nextStep,
      previousStep,
      submitProposal,
      inviteCollaborator,
      removeCollaborator,
      logSectionEdit,
      updatePresenceField,
      refreshCollaborators,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be inside ProposalWizardProvider');
  return ctx;
}
