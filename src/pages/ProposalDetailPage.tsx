import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Proposal, ProposalSection, CommentWithProfile, Profile } from '../types/database';
import { FileText, Edit, MessageSquare, CheckCircle, Clock, ChevronDown, ChevronUp, User, Send } from 'lucide-react';
import { LastEditedBy } from '../components/proposal/LastEditedBy';

export function ProposalDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data: p } = await supabase.from('proposals').select('*').eq('id', id).single();
      setProposal(p);
      const { data: o } = await supabase.from('profiles').select('*').eq('id', p.user_id).single();
      setOwner(o);
      const { data: s } = await supabase.from('proposal_sections').select('*').eq('proposal_id', id);
      setSections(s || []);
      const { data: c } = await supabase.from('comments').select('*, profile:profiles(*)').eq('proposal_id', id).order('created_at');
      setComments(c || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const toggleSection = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !id) return;
    setPosting(true);
    await supabase.from('comments').insert({ proposal_id: id, user_id: user.id, content: newComment });
    setNewComment('');
    await load();
    setPosting(false);
  };

  const getSectionTitle = (t: string) => t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-orange-100 text-orange-700',
      revision_requested: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || ''}`}>{status.replace(/_/g, ' ').toUpperCase()}</span>;
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div></DashboardLayout>;
  if (!proposal) return <DashboardLayout><div className="text-center py-16"><p className="text-gray-500">Proposal not found.</p><Link to="/dashboard" className="text-blue-600 mt-2 inline-block">Back to Dashboard</Link></div></DashboardLayout>;

  const isOwner = user?.id === proposal.user_id;
  const canEdit = isOwner && (proposal.status === 'draft' || proposal.status === 'revision_requested');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
              <p className="text-sm text-gray-500 mb-3">by {owner?.full_name} • Created {new Date(proposal.created_at).toLocaleDateString()}</p>
              <div className="flex items-center gap-2">
                {statusBadge(proposal.status)}
                {proposal.quality_score > 0 && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    Quality: {proposal.quality_score}%
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <Link to={`/proposals/${id}/edit`} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0">
                <Edit className="h-4 w-4" />Edit
              </Link>
            )}
          </div>
        </div>

        {sections.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Proposal Content
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {sections.map(sec => {
                const isOpen = expanded.has(sec.section_type);
                return (
                  <div key={sec.id}>
                    <button onClick={() => toggleSection(sec.section_type)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {sec.completed
                          ? <CheckCircle className="h-4 w-4 text-green-500" />
                          : <Clock className="h-4 w-4 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-900">{getSectionTitle(sec.section_type)}</span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 bg-gray-50 space-y-4">
                        {Object.entries(sec.content).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{value as string}</p>
                          </div>
                        ))}
                        {proposal && (
                          <LastEditedBy proposalId={proposal.id} sectionType={sec.section_type} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            Comments & Feedback ({comments.length})
          </h2>

          <form onSubmit={handlePostComment} className="mb-6">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" placeholder="Add a comment or feedback..." />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={!newComment.trim() || posting} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40">
                <Send className="h-4 w-4" />{posting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-900">{c.profile?.full_name}</span>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                    {c.profile?.role === 'organizer' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Organiser</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
