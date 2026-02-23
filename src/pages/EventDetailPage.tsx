import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { EventFormModal } from '../components/events/EventFormModal';
import { CollaboratorsPanel } from '../components/events/CollaboratorsPanel';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Event, EventStatus, ProposalWithProfile, ProposalStatus } from '../types/database';
import {
  Calendar, ChevronLeft, Pencil, FileText, Clock,
  CheckCircle, AlertCircle, XCircle, TrendingUp, ArrowRight, Archive,
} from 'lucide-react';

const EVENT_STATUS_CONFIG: Record<EventStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  open: { label: 'Open for Submissions', bg: 'bg-green-100', text: 'text-green-700' },
  closed: { label: 'Closed', bg: 'bg-orange-100', text: 'text-orange-700' },
  archived: { label: 'Archived', bg: 'bg-gray-100', text: 'text-gray-500' },
};

const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText className="h-3.5 w-3.5" /> },
  submitted: { label: 'Submitted', bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="h-3.5 w-3.5" /> },
  under_review: { label: 'In Review', bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="h-3.5 w-3.5" /> },
  revision_requested: { label: 'Revision', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="h-3.5 w-3.5" /> },
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [proposals, setProposals] = useState<ProposalWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [proposalFilter, setProposalFilter] = useState<ProposalStatus | 'all'>('all');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) { loadEvent(); loadProposals(); }
  }, [id]);

  const loadEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setEvent(data);
      setIsOwner(data.created_by === user?.id);
    }
    setLoading(false);
  };

  const loadProposals = async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, profile:profiles!proposals_user_id_fkey(*)')
      .eq('event_id', id)
      .neq('status', 'draft')
      .order('updated_at', { ascending: false });
    if (error) console.error('EventDetailPage proposals error:', error);
    setProposals((data as ProposalWithProfile[]) || []);
  };

  const filteredProposals = proposalFilter === 'all'
    ? proposals
    : proposals.filter(p => p.status === proposalFilter);

  const proposalCounts = {
    all: proposals.length,
    submitted: proposals.filter(p => p.status === 'submitted').length,
    under_review: proposals.filter(p => p.status === 'under_review').length,
    revision_requested: proposals.filter(p => p.status === 'revision_requested').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <p className="text-gray-500">Event not found.</p>
          <Link to="/organizer/events" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Back to Events
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusCfg = EVENT_STATUS_CONFIG[event.status];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            to="/organizer/events"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />Events
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
              </div>
              {event.description && (
                <p className="text-gray-500 mb-4 text-sm leading-relaxed">{event.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                {event.start_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {event.end_date && (
                      <> – {new Date(event.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                  </span>
                )}
                {!event.start_date && (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Calendar className="h-4 w-4" />No dates set
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />Edit Event
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Proposals</h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {([
                  ['all', 'All'],
                  ['submitted', 'Submitted'],
                  ['under_review', 'In Review'],
                  ['approved', 'Approved'],
                  ['rejected', 'Rejected'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setProposalFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      proposalFilter === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label} ({proposalCounts[key as keyof typeof proposalCounts] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            {filteredProposals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">No proposals yet</h3>
                <p className="text-sm text-gray-400">
                  {event.status === 'open'
                    ? 'Proposals submitted to this event will appear here.'
                    : 'Open this event to start accepting proposals.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredProposals.map(proposal => {
                  const cfg = PROPOSAL_STATUS_CONFIG[proposal.status];
                  return (
                    <Link
                      key={proposal.id}
                      to={`/proposals/${proposal.id}/review`}
                      className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {proposal.title || 'Untitled Proposal'}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-1.5">
                            by {proposal.profile?.full_name}
                            {proposal.profile?.organization && ` · ${proposal.profile.organization}`}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {proposal.problem_statement || 'No problem statement'}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                      </div>
                      {proposal.quality_score > 0 && (
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                          <TrendingUp className="h-3 w-3" />Quality: {proposal.quality_score}%
                          {proposal.submitted_at && (
                            <span className="ml-3">Submitted {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <CollaboratorsPanel eventId={event.id} ownerId={event.created_by} />
          </div>
        </div>
      </div>

      {showEditModal && (
        <EventFormModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSaved={updated => { setEvent(updated); setShowEditModal(false); }}
        />
      )}
    </DashboardLayout>
  );
}
