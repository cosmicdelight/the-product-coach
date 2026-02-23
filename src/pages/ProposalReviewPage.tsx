import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Proposal, ProposalSection, Profile } from '../types/database';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

export function ProposalReviewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [revisionModal, setRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  const [overallScore, setOverallScore] = useState(75);
  const [feasibilityScore, setFeasibilityScore] = useState(75);
  const [impactScore, setImpactScore] = useState(75);
  const [innovationScore, setInnovationScore] = useState(75);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    if (!id) return;
    try {
      const { data: p } = await supabase.from('proposals').select('*').eq('id', id).single();
      setProposal(p);
      const { data: o } = await supabase.from('profiles').select('*').eq('id', p.user_id).single();
      setOwner(o);
      const { data: s } = await supabase.from('proposal_sections').select('*').eq('proposal_id', id);
      setSections(s || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: 'approved' | 'rejected' | 'revision_requested', notes?: string) => {
    if (!id || !user || !proposal) return;
    setSubmitting(true);
    try {
      const avgScore = Math.round((overallScore + feasibilityScore + impactScore + innovationScore) / 4);

      await supabase.from('proposal_reviews').insert({
        proposal_id: id,
        reviewer_id: user.id,
        overall_score: overallScore,
        feasibility_score: feasibilityScore,
        impact_score: impactScore,
        innovation_score: innovationScore,
        decision,
        review_notes: reviewNotes,
      });

      await supabase.from('proposals').update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        quality_score: avgScore,
      }).eq('id', id);

      await supabase.from('approval_workflow').insert({
        proposal_id: id,
        from_status: proposal.status,
        to_status: decision,
        changed_by: user.id,
        reason: reviewNotes || notes,
      });

      if (decision === 'revision_requested' && notes) {
        await supabase.from('comments').insert({
          proposal_id: id,
          user_id: user.id,
          content: `**Revisions Requested:**\n\n${notes}`,
        });
      }

      const { data: collabs } = await supabase
        .from('proposal_collaborators')
        .select('user_id')
        .eq('proposal_id', id)
        .eq('status', 'active');

      const collaboratorIds = (collabs || [])
        .map((c: any) => c.user_id)
        .filter((uid: string) => uid && uid !== proposal.user_id);

      const notifyUserIds = [proposal.user_id, ...collaboratorIds];
      const notificationType = decision === 'approved' ? 'approval' : decision === 'rejected' ? 'rejection' : 'revision_request';
      const decisionLabel = decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Revision Requested';

      if (notifyUserIds.length > 0) {
        await supabase.from('notifications').insert(
          notifyUserIds.map(uid => ({
            user_id: uid,
            type: notificationType,
            title: `Proposal ${decisionLabel}`,
            message: `"${proposal.title}" has been ${decision.replace(/_/g, ' ')}.${decision === 'revision_requested' ? ' Revisions have been requested.' : ''}`,
            link: `/proposals/${id}`,
            read: false,
          }))
        );
      }

      navigate('/organizer/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getSectionTitle = (t: string) => t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const avgScore = Math.round((overallScore + feasibilityScore + impactScore + innovationScore) / 4);

  if (loading) return <DashboardLayout><div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div></DashboardLayout>;
  if (!proposal) return <DashboardLayout><div className="text-center py-16 text-gray-500">Proposal not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/organizer/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{proposal.title}</h1>
          <p className="text-sm text-gray-500">by {owner?.full_name} • Submitted {proposal.submitted_at ? new Date(proposal.submitted_at).toLocaleDateString() : 'N/A'}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-bold text-gray-900">Scoring</h2>
            {[
              { label: 'Overall Quality', value: overallScore, set: setOverallScore, color: 'blue' },
              { label: 'Feasibility', value: feasibilityScore, set: setFeasibilityScore, color: 'green' },
              { label: 'Impact', value: impactScore, set: setImpactScore, color: 'orange' },
              { label: 'Innovation', value: innovationScore, set: setInnovationScore, color: 'teal' },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{value}%</span>
                </div>
                <input type="range" min="0" max="100" value={value} onChange={e => set(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Average Score</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{avgScore}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Review Notes</h2>
            <textarea
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Overall observations, strengths, and general feedback..."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Proposal Content</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sections.map(sec => {
              const isOpen = expanded.has(sec.section_type);
              return (
                <div key={sec.id}>
                  <button onClick={() => toggleSection(sec.section_type)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-900">{getSectionTitle(sec.section_type)}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 bg-gray-50 space-y-3">
                      {Object.entries(sec.content).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{value as string}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Make a Decision</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleDecision('approved')}
              disabled={submitting}
              className="flex flex-col items-center gap-3 p-5 border-2 border-green-200 bg-green-50 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-40"
            >
              <CheckCircle className="h-8 w-8 text-green-600" />
              <span className="font-semibold text-green-900 text-sm">Approve</span>
            </button>

            <button
              onClick={() => setRevisionModal(true)}
              disabled={submitting}
              className="flex flex-col items-center gap-3 p-5 border-2 border-yellow-200 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors disabled:opacity-40"
            >
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <span className="font-semibold text-yellow-900 text-sm">Request Revisions</span>
            </button>

            <button
              onClick={() => handleDecision('rejected')}
              disabled={submitting}
              className="flex flex-col items-center gap-3 p-5 border-2 border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-40"
            >
              <XCircle className="h-8 w-8 text-red-600" />
              <span className="font-semibold text-red-900 text-sm">Reject</span>
            </button>
          </div>
        </div>
      </div>

      {revisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Request Revisions</h3>
            <p className="text-sm text-gray-500 mb-4">Specify what needs to be changed. This will be posted as a comment visible to the officer.</p>
            <textarea
              value={revisionNotes}
              onChange={e => setRevisionNotes(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Describe the revisions needed in detail..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRevisionModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => { setRevisionModal(false); handleDecision('revision_requested', revisionNotes); }}
                disabled={!revisionNotes.trim() || submitting}
                className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-xl text-sm font-semibold hover:bg-yellow-700 disabled:opacity-40"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
