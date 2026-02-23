import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ProposalSectionEditWithProfile } from '../../types/database';
import { Clock } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Props {
  proposalId: string;
  sectionType: string;
}

export function LastEditedBy({ proposalId, sectionType }: Props) {
  const [edit, setEdit] = useState<ProposalSectionEditWithProfile | null>(null);

  useEffect(() => {
    load();
  }, [proposalId, sectionType]);

  const load = async () => {
    const { data } = await supabase
      .from('proposal_section_edits')
      .select('*, profile:profiles(*)')
      .eq('proposal_id', proposalId)
      .eq('section_type', sectionType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setEdit(data as ProposalSectionEditWithProfile);
  };

  if (!edit) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
      <Clock className="h-3 w-3 flex-shrink-0" />
      <span>
        Last edited by{' '}
        <span className="font-medium text-gray-600">{edit.profile?.full_name || 'a team member'}</span>
        {' '}{timeAgo(edit.created_at)}
        {edit.field_name && (
          <span className="text-gray-400">
            {' '}({edit.field_name.replace(/([A-Z])/g, ' $1').trim().toLowerCase()})
          </span>
        )}
      </span>
    </div>
  );
}
