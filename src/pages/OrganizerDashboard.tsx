import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { ProposalWithProfile, ProposalStatus } from '../types/database';
import {
  FileText, Clock, CheckCircle, AlertCircle, XCircle,
  TrendingUp, ArrowRight, Calendar, ChevronRight, Plus,
} from 'lucide-react';

interface EventSummary {
  id: string;
  title: string;
  status: string;
  proposal_count: number;
}

export function OrganizerDashboard() {
  const [proposals, setProposals] = useState<ProposalWithProfile[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    await Promise.all([loadProposals(), loadEvents()]);
    setLoading(false);
  };

  const loadProposals = async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, profile:profiles!proposals_user_id_fkey(*)')
      .neq('status', 'draft')
      .order('updated_at', { ascending: false });
    if (error) console.error('OrganizerDashboard load error:', error);
    setProposals(data || []);
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, status, proposals(count)')
      .order('created_at', { ascending: false })
      .limit(4);
    if (error) { console.error('Events load error:', error); return; }
    const mapped: EventSummary[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      proposal_count: row.proposals?.[0]?.count ?? 0,
    }));
    setEvents(mapped);
  };

  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter);

  const counts = {
    all: proposals.length,
    submitted: proposals.filter(p => p.status === 'submitted').length,
    under_review: proposals.filter(p => p.status === 'under_review').length,
    revision_requested: proposals.filter(p => p.status === 'revision_requested').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  const avgScore = proposals.length
    ? Math.round(proposals.reduce((s, p) => s + (p.quality_score || 0), 0) / proposals.length)
    : 0;

  const getStatusBadge = (status: ProposalStatus) => {
    const map: Record<ProposalStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft', icon: <FileText className="h-3.5 w-3.5" /> },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted', icon: <Clock className="h-3.5 w-3.5" /> },
      under_review: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'In Review', icon: <Clock className="h-3.5 w-3.5" /> },
      revision_requested: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Revision', icon: <AlertCircle className="h-3.5 w-3.5" /> },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved', icon: <CheckCircle className="h-3.5 w-3.5" /> },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: <XCircle className="h-3.5 w-3.5" /> },
    };
    const c = map[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.icon}{c.label}
      </span>
    );
  };

  const eventStatusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-orange-100 text-orange-700',
    archived: 'bg-gray-100 text-gray-400',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Dashboard</h1>
          <p className="text-gray-500 mt-1">Review and evaluate proposal submissions across your events</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Submissions', value: proposals.length, icon: <FileText className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Needs Review', value: counts.submitted + counts.under_review, icon: <Clock className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-50' },
            { label: 'Approved', value: counts.approved, icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
            { label: 'Avg Quality', value: `${avgScore}%`, icon: <TrendingUp className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`${bg} p-2 rounded-lg`}>{icon}</div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {!loading && events.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Your Events</h2>
              <Link
                to="/organizer/events"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {events.map(ev => (
                <Link
                  key={ev.id}
                  to={`/organizer/events/${ev.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                      {ev.title}
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${eventStatusColor[ev.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FileText className="h-3 w-3" />{ev.proposal_count}
                    </span>
                  </div>
                </Link>
              ))}
              <Link
                to="/organizer/events"
                className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-blue-600"
              >
                <Calendar className="h-4 w-4" />Manage Events
              </Link>
            </div>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-xl">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">No events yet</p>
                <p className="text-xs text-blue-600">Create an event to start collecting targeted proposals</p>
              </div>
            </div>
            <Link
              to="/organizer/events"
              className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />Create Event
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            ['all', 'All'],
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
                filter === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label} ({counts[key === 'all' ? 'all' : key as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <FileText className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals to review</h3>
            <p className="text-gray-500 text-sm">
              {filter === 'all' ? 'No proposals have been submitted to your events yet.' : `No proposals with status: ${filter.replace('_', ' ')}.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(proposal => (
              <Link
                key={proposal.id}
                to={`/proposals/${proposal.id}/review`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {proposal.title || 'Untitled Proposal'}
                      </h3>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      by {proposal.profile?.full_name} · {proposal.profile?.organization || 'No organisation'}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {proposal.problem_statement || 'No problem statement'}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    {proposal.quality_score > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />Quality: {proposal.quality_score}%
                      </span>
                    )}
                    {proposal.submitted_at && (
                      <span>Submitted {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <span className="text-blue-600 font-medium">Review →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
