import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { captureError, mapErrorToUserMessage } from '../services/errorHandling';

type State = 'loading' | 'joining' | 'success' | 'already_member' | 'invalid' | 'wrong_email' | 'error';

export function JoinProposalPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>('loading');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = useCallback(async () => {
    const token = searchParams.get('token');
    if (!token || !id || !user) {
      setState('invalid');
      return;
    }

    setState('joining');

    try {
      const { data, error } = await supabase.rpc('accept_proposal_invite', {
        p_token: token,
        p_user_id: user.id,
      });

      if (error) {
        captureError('proposal', 'accept_invite_rpc_failed', error, { proposalId: id });
        setErrorMessage(mapErrorToUserMessage(error, 'Unable to process this invite right now.'));
        setState('error');
        return;
      }

      const result = data as {
        status?: string;
        error?: string;
        proposal_id?: string;
        proposal_title?: string;
        invited_email?: string;
        owner_id?: string;
        collab_id?: string;
      };

      if (result.error) {
        if (result.error === 'invalid_token' || result.error === 'invalid_status') {
          setState('invalid');
        } else if (result.error === 'revoked') {
          setState('invalid');
          setErrorMessage('This invite has been revoked by the proposal owner.');
        } else if (result.error === 'used') {
          setState('invalid');
          setErrorMessage('This invite link has already been used by someone else.');
        } else {
          setState('error');
        }
        return;
      }

      setProposalTitle(result.proposal_title || 'this proposal');
      setProposalId(result.proposal_id || id);

      if (result.status === 'already_member') {
        setState('already_member');
        return;
      }

      if (result.invited_email && result.invited_email.toLowerCase() !== (user.email || '').toLowerCase()) {
        setState('wrong_email');
        setErrorMessage(
          `This invite was sent to ${result.invited_email}, but you are signed in as ${user.email}. Please sign in with the correct account.`
        );
        return;
      }

      if (result.owner_id) {
        await supabase.from('notifications').insert({
          user_id: result.owner_id,
          type: 'collaborator_joined',
          title: 'New Collaborator Joined',
          message: `${profile?.full_name || user.email} has joined your proposal "${result.proposal_title}".`,
          link: `/proposals/${result.proposal_id}/edit`,
          read: false,
        });
      }

      setState('success');
      setTimeout(() => navigate(`/proposals/${result.proposal_id}/edit`), 1500);
    } catch (e) {
      captureError('proposal', 'accept_invite_failed', e, { proposalId: id });
      setErrorMessage(mapErrorToUserMessage(e, 'Unable to process this invite right now.'));
      setState('error');
    }
  }, [id, navigate, profile?.full_name, searchParams, user]);

  useEffect(() => {
    if (user && id) handleJoin();
  }, [user, id, handleJoin]);

  const targetId = proposalId || id;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          {(state === 'loading' || state === 'joining') && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Joining proposal...</h2>
              <p className="text-sm text-gray-500">Please wait while we verify your invite.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You're in!</h2>
              <p className="text-sm text-gray-500">
                You've joined <strong>{proposalTitle}</strong>. Redirecting you to the editor...
              </p>
            </>
          )}

          {state === 'already_member' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Already a collaborator</h2>
              <p className="text-sm text-gray-500 mb-6">
                You already have access to <strong>{proposalTitle}</strong>.
              </p>
              <Link
                to={`/proposals/${targetId}/edit`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                Open Proposal
              </Link>
            </>
          )}

          {(state === 'invalid' || state === 'wrong_email' || state === 'error') && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {state === 'wrong_email' ? 'Wrong account' : 'Invalid invite'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {errorMessage || 'This invite link is invalid or has expired. Ask the proposal owner to send you a fresh link.'}
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
