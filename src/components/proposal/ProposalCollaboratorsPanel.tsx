import { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, X, Clock, Link2, Trash2, Crown } from 'lucide-react';
import { useWizard } from '../../contexts/ProposalWizardContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ProposalCollaboratorWithProfile, PresenceUser, Profile } from '../../types/database';
import { captureError, mapErrorToUserMessage } from '../../services/errorHandling';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function PresenceDot({ isOnline, color }: { isOnline: boolean; color?: string }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white"
      style={{ backgroundColor: isOnline ? (color || '#10b981') : '#d1d5db' }}
      title={isOnline ? 'Currently in editor' : 'Offline'}
    />
  );
}

function AvatarChip({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white text-xs"
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

interface MemberRowProps {
  name: string;
  subtext?: string;
  isYou: boolean;
  isOwner: boolean;
  isOnline: boolean;
  presenceColor?: string;
  onlineSection?: string;
  onRemove?: () => void;
  removing?: boolean;
  isPending?: boolean;
  avatarColor: string;
}

function MemberRow({
  name, subtext, isYou, isOwner, isOnline, presenceColor, onlineSection,
  onRemove, removing, isPending, avatarColor,
}: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="relative flex-shrink-0">
        <AvatarChip name={name} color={avatarColor} />
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot isOnline={isOnline} color={presenceColor} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">
            {isYou ? `${name} (you)` : name}
          </p>
          {isOwner && <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" aria-label="Owner" />}
        </div>
        <div className="mt-0.5">
          {isPending ? (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Awaiting
            </span>
          ) : isYou && isOnline ? (
            <span className="text-xs text-emerald-600">Currently editing</span>
          ) : onlineSection ? (
            <span className="text-xs text-emerald-600">
              Editing: {onlineSection.replace(/_/g, ' ')}
            </span>
          ) : (
            <span className="text-xs text-gray-400">{subtext || ''}</span>
          )}
        </div>
      </div>
      {onRemove && !isOwner && (
        <button
          onClick={onRemove}
          disabled={removing}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 disabled:opacity-40"
          title="Remove collaborator"
        >
          {removing ? (
            <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

interface InviteFormProps {
  onInvite: (email: string) => Promise<{ inviteUrl: string }>;
  onClose: () => void;
}

function InviteForm({ onInvite, onClose }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { inviteUrl: url } = await onInvite(email);
      setInviteUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inviteUrl) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Invite link for {email}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                copied ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Send this link to {email}. It can only be used once.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setInviteUrl(null); setEmail(''); }}
            className="flex-1 text-xs py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Invite another
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-xs py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="teammate@example.com"
        className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        autoFocus
        required
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 text-xs py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex-1 text-xs py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-40"
        >
          {loading ? 'Creating...' : 'Create Link'}
        </button>
      </div>
    </form>
  );
}

const AVATAR_COLORS = [
  '#64748b', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getPresenceForUser(userId: string | null | undefined, presenceList: PresenceUser[]) {
  if (!userId) return undefined;
  return presenceList.find(p => p.userId === userId);
}

export function ProposalCollaboratorsPanel() {
  const { proposal, collaborators, presenceList, inviteCollaborator, removeCollaborator } = useWizard();
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwner = proposal?.user_id === user?.id;
  const canManage = isOwner;

  useEffect(() => {
    if (!proposal?.user_id) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', proposal.user_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOwnerProfile(data as Profile);
      });
  }, [proposal?.user_id]);

  const active = collaborators.filter(c => c.status === 'active');
  const pending = collaborators.filter(c => c.status === 'pending');

  const handleRemove = async (id: string) => {
    setRemoving(id);
    setActionError(null);
    try {
      await removeCollaborator(id);
    } catch (error) {
      captureError('proposal', 'remove_collaborator_failed', error, { collaboratorId: id });
      setActionError(mapErrorToUserMessage(error, 'Unable to remove collaborator right now.'));
    } finally {
      setRemoving(null);
      setConfirmRemoveId(null);
    }
  };

  const handleCopyLink = async (collab: ProposalCollaboratorWithProfile) => {
    const origin = window.location.origin;
    const url = `${origin}/proposals/${proposal?.id}/join?token=${collab.invite_token}`;
    setActionError(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(collab.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      captureError('proposal', 'copy_invite_link_failed', error, { collaboratorId: collab.id });
      setActionError('Unable to copy invite link. Please copy it manually.');
    }
  };

  const ownerName = ownerProfile?.full_name || proposal?.user_id?.slice(0, 8) || 'Owner';
  const ownerPresence = getPresenceForUser(proposal?.user_id, presenceList);

  return (
    <div className="space-y-1 pt-3">
      {canManage && !showInviteForm && (
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        </div>
      )}

      {showInviteForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Link2 className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Generate invite link</span>
          </div>
          <InviteForm onInvite={inviteCollaborator} onClose={() => setShowInviteForm(false)} />
        </div>
      )}

      {proposal && (
        <MemberRow
          name={ownerName}
          subtext={ownerProfile?.organization || ownerProfile?.job_title || undefined}
          isYou={proposal.user_id === user?.id}
          isOwner={true}
          isOnline={proposal.user_id === user?.id || !!ownerPresence}
          presenceColor={ownerPresence?.color || (proposal.user_id === user?.id ? '#10b981' : undefined)}
          onlineSection={ownerPresence?.currentSection}
          avatarColor={avatarColor(0)}
        />
      )}

      {active.map((collab, i) => {
        const presence = getPresenceForUser(collab.user_id, presenceList);
        const isYou = collab.user_id === user?.id;
        const name = collab.profile?.full_name || collab.invited_email;
        return (
          <MemberRow
            key={collab.id}
            name={name}
            subtext={collab.profile?.organization || collab.invited_email}
            isYou={isYou}
            isOwner={false}
            isOnline={isYou || !!presence}
            presenceColor={presence?.color || (isYou ? '#10b981' : undefined)}
            onlineSection={presence?.currentSection}
            onRemove={canManage ? () => setConfirmRemoveId(collab.id) : undefined}
            removing={removing === collab.id}
            avatarColor={avatarColor(i + 1)}
          />
        );
      })}

      {pending.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Pending Invites</p>
          {pending.map(collab => (
            <div key={collab.id} className="flex items-center gap-2.5 py-2">
              <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate font-medium">{collab.invited_email}</p>
                <p className="text-xs text-amber-600">Awaiting acceptance</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopyLink(collab)}
                  className={`p-1.5 rounded-lg transition-all text-xs ${
                    copiedId === collab.id
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="Copy invite link"
                >
                  {copiedId === collab.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {canManage && (
                  <button
                    onClick={() => setConfirmRemoveId(collab.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Cancel invite"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2 mt-2">
          {actionError}
        </p>
      )}

      {active.length === 0 && pending.length === 0 && !showInviteForm && isOwner && (
        <p className="text-xs text-gray-400 text-center py-2">
          Only you have access. Invite a teammate to collaborate.
        </p>
      )}

      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-xl">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Remove collaborator?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              They will lose access to this proposal immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemoveId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(confirmRemoveId)}
                disabled={removing === confirmRemoveId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {removing === confirmRemoveId ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
