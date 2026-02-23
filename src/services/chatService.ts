import { supabase } from '../lib/supabase';
import { ChatMessage, ChatMessageContent } from '../types/chat';
import { SectionType } from '../types/database';

export async function loadChatMessages(
  proposalId: string,
  sectionType: SectionType
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('proposal_id', proposalId)
    .eq('section_type', sectionType)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []) as ChatMessage[];
}

export async function saveChatMessage(
  proposalId: string,
  sectionType: SectionType,
  role: 'user' | 'assistant',
  content: ChatMessageContent
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ proposal_id: proposalId, section_type: sectionType, role, content })
    .select()
    .single();

  if (error) return null;
  return data as ChatMessage;
}

export async function rateChatMessage(
  messageId: string,
  rating: 1 | -1
): Promise<void> {
  await supabase
    .from('chat_messages')
    .update({ rating })
    .eq('id', messageId);
}

export async function clearChatMessages(
  proposalId: string,
  sectionType: SectionType
): Promise<void> {
  await supabase
    .from('chat_messages')
    .delete()
    .eq('proposal_id', proposalId)
    .eq('section_type', sectionType);
}
