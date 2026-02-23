import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Proposal, ProposalStatus, Event, ProposalCollaboratorWithProfile } from '../types/database';
import {
  FileText, Plus, Clock, CheckCircle, AlertCircle, XCircle,
  Edit, TrendingUp, ArrowRight, Trash2, Calendar, ChevronRight, Users,
} from 'lucide-react';

const STATUS_CONFIG: Record<ProposalStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: <Edit className="h-4 w-4" /> },
  submitted: { label: 'Submitted', bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="h-4 w-4" /> },
  under_review: { label: 'In Review', bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="h-4 w-4" /> },
  revision_requested: { label: 'Revision Needed', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <AlertCircle className="h-4 w-4" /> },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="h-4 w-4" /> },
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const COLLAB_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#14b8a6'];

export function OfficerDashboard() {
  const { user, profile } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sharedProposals, setSharedProposals] = useState<Proposal[]>([]);
  const [collaboratorsByProposal, setCollaboratorsByProposal] = useState<Record<string, ProposalCollaboratorWithProfile[]>>({});
  const [openEvents, setOpenEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProposalStatus | 'all' | 'shared'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) { loadProposals(); loadOpenEvents(); }
  }, [user]);

  const loadProposals = async () => {
    if (!user) return;
    try {
      const [{ data: owned }, { data: shared }] = await Promise.all([
        supabase
          .from('proposals')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('proposals')
          .select('*, proposal_collaborators!inner(user_id, status)')
          .eq('proposal_collaborators.user_id', user.id)
          .eq('proposal_collaborators.status', 'active')
          .order('updated_at', { ascending: false }),
      ]);

      const ownedProposals = owned || [];
      const sharedOnlyProposals = (shared || []).filter(
        (p: any) => p.user_id !== user.id
      );

      setProposals(ownedProposals);
      setSharedProposals(sharedOnlyProposals);

      const allIds = [...ownedProposals.map(p => p.id), ...sharedOnlyProposals.map((p: any) => p.id)];
      if (allIds.length > 0) {
        const { data: collabs } = await supabase
          .from('proposal_collaborators')
          .select('*, profile:profiles!proposal_collaborators_user_id_fkey(*)')
          .in('proposal_id', allIds)
          .eq('status', 'active');

        const map: Record<string, ProposalCollaboratorWithProfile[]> = {};
        (collabs || []).forEach((c: ProposalCollaboratorWithProfile) => {
          if (!map[c.proposal_id]) map[c.proposal_id] = [];
          map[c.proposal_id].push(c);
        });
        setCollaboratorsByProposal(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadOpenEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'open')
      .order('end_date', { ascending: true, nullsFirst: false })
      .limit(3);
    setOpenEvents(data || []);
  };

  const deleteProposal = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (error) throw error;
      setProposals(prev => prev.filter(p => p.id !== id));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const mergedProposals = [
    ...proposals,
    ...sharedProposals.filter(sp => !proposals.some(p => p.id === sp.id)),
  ];

  const filtered = filter === 'shared'
    ? sharedProposals
    : filter === 'all'
      ? mergedProposals
      : mergedProposals.filter(p => p.status === filter);

  const counts = {
    all: mergedProposals.length,
    shared: sharedProposals.length,
    draft: mergedProposals.filter(p => p.status === 'draft').length,
    submitted: mergedProposals.filter(p => p.status === 'submitted').length,
    under_review: mergedProposals.filter(p => p.status === 'under_review').length,
    revision_requested: mergedProposals.filter(p => p.status === 'revision_requested').length,
    approved: mergedProposals.filter(p => p.status === 'approved').length,
    rejected: mergedProposals.filter(p => p.status === 'rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.split(' ')[0]}
            </h1>

          </div>
          <Link
            to="/proposals/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Link>
        </div>

        {openEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">Open Events</h2>
              <span className="text-xs text-gray-400">— submit your proposal to one of these</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {openEvents.map(ev => (
                <Link
                  key={ev.id}
                  to="/proposals/new"
                  className="bg-green-50 border border-green-100 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 flex-1">
                      {ev.title}
                    </p>
                    <ChevronRight className="h-4 w-4 text-green-400 group-hover:text-green-600 flex-shrink-0 transition-colors" />
                  </div>
                  {ev.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{ev.description}</p>
                  )}
                  {ev.end_date && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Closes {new Date(ev.end_date).toLocaleDateString()}
                    </p>
                  )}
                  {!ev.end_date && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Open
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'all', label: 'Total', color: 'blue' },
            { key: 'draft', label: 'Drafts', color: 'gray' },
            { key: 'submitted', label: 'Submitted', color: 'blue' },
            { key: 'approved', label: 'Approved', color: 'green' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`bg-white rounded-xl border-2 p-5 text-left transition-all hover:shadow-sm ${
                filter === key ? `border-${color}-500` : 'border-gray-100'
              }`}
            >
              <p className="text-3xl font-bold text-gray-900">{counts[key as keyof typeof counts]}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            ['all', 'All'],
            ['draft', 'Drafts'],
            ['submitted', 'Submitted'],
            ['under_review', 'In Review'],
            ['revision_requested', 'Revisions'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label} ({counts[key === 'all' ? 'all' : key as ProposalStatus]})
            </button>
          ))}
          {sharedProposals.length > 0 && (
            <button
              onClick={() => setFilter('shared')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'shared'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Shared with me ({counts.shared})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <FileText className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No proposals yet' : `No ${filter.replace('_', ' ')} proposals`}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {filter === 'all' ? 'Create your first funding proposal to get started.' : ''}
            </p>
            {filter === 'all' && (
              <Link
                to="/proposals/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />Create First Proposal
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(proposal => {
              const cfg = STATUS_CONFIG[proposal.status];
              const isOwner = proposal.user_id === user?.id;
              const canEdit = isOwner && (proposal.status === 'draft' || proposal.status === 'revision_requested');
              const collabCanEdit = !isOwner && (proposal.status === 'draft' || proposal.status === 'revision_requested');
              const isDraft = isOwner && proposal.status === 'draft';
              const proposalCollabs = collaboratorsByProposal[proposal.id] || [];
              return (
                <div key={proposal.id} className="relative">
                  <Link
                    to={(canEdit || collabCanEdit) ? `/proposals/${proposal.id}/edit` : `/proposals/${proposal.id}`}
                    className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {proposal.title || 'Untitled Proposal'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                          {!isOwner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 flex-shrink-0 border border-sky-100">
                              <Users className="h-3 w-3" />
                              Collaborating
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {proposal.problem_statement || 'No problem statement added yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {proposalCollabs.length > 0 && (
                          <div className="flex -space-x-1.5 mr-1">
                            {proposalCollabs.slice(0, 3).map((c, i) => (
                              <div
                                key={c.id}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white"
                                style={{ backgroundColor: COLLAB_COLORS[i % COLLAB_COLORS.length] }}
                                title={c.profile?.full_name || c.invited_email}
                              >
                                {getInitials(c.profile?.full_name || c.invited_email)}
                              </div>
                            ))}
                            {proposalCollabs.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 ring-2 ring-white">
                                +{proposalCollabs.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        {isDraft && (
                          <button
                            onClick={e => { e.preventDefault(); setConfirmDeleteId(proposal.id); }}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete proposal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                      <div className="flex items-center gap-4">
                        <span>Step {proposal.current_step}/6</span>
                        {proposal.quality_score > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Quality: {proposal.quality_score}%
                          </span>
                        )}
                      </div>
                      <span>Updated {new Date(proposal.updated_at).toLocaleDateString()}</span>
                    </div>

                    {proposal.status === 'revision_requested' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Feedback received — click to view and revise
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-xl">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete proposal?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the proposal and all its content. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProposal(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
