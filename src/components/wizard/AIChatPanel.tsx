import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ThumbsUp, ThumbsDown, Sparkles, Trash2, MessageSquare, Loader } from 'lucide-react';
import { SectionType } from '../../types/database';
import { ChatMessage, ChatMessageContent, FieldSnapshot } from '../../types/chat';
import { SECTION_CHAT_CONFIG } from '../../config/sectionChatConfig';
import { getFeedbackForSection, buildFeedbackFromResult, buildFollowUpFromResult, getChatReply } from '../../services/aiService';
import { loadChatMessages, saveChatMessage, rateChatMessage, clearChatMessages } from '../../services/chatService';
import { FeedbackSnapshotCard } from './chat/FeedbackSnapshotCard';
import { FeedbackResultCard } from './chat/FeedbackResultCard';

const SECTION_LABELS: Record<SectionType, string> = {
  problem_identification: 'Problem Identification',
  problem_validation: 'Problem Validation',
  user_research: 'User Research',
  opportunity_framing: 'Opportunity Framing',
  success_definition: 'Success Definition',
  executive_summary: 'Executive Summary',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function RatingButtons({
  messageId,
  currentRating,
  onRate,
}: {
  messageId: string;
  currentRating: 1 | -1 | null;
  onRate: (id: string, r: 1 | -1) => void;
}) {
  return (
    <div className="flex items-center gap-1 mt-2">
      <button
        onClick={() => onRate(messageId, 1)}
        className={`p-1 rounded transition-colors ${currentRating === 1 ? 'text-green-600' : 'text-gray-300 hover:text-gray-500'}`}
        title="Helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onRate(messageId, -1)}
        className={`p-1 rounded transition-colors ${currentRating === -1 ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}
        title="Not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MessageBubble({
  message,
  sectionLabel,
  onRate,
}: {
  message: ChatMessage;
  sectionLabel: string;
  onRate: (id: string, r: 1 | -1) => void;
}) {
  const isUser = message.role === 'user';
  const content = message.content;

  if (content.type === 'get_feedback_trigger') {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-blue-600 text-white text-xs px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">
          Get Feedback
        </div>
      </div>
    );
  }

  if (isUser && content.type === 'text') {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-blue-600 text-white text-xs px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%]">
          {content.text}
        </div>
      </div>
    );
  }

  if (content.type === 'feedback') {
    const showScore = content.feedback.scoreLabel !== '';
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-3 max-w-full w-full shadow-sm">
          <FeedbackSnapshotCard
            snapshot={content.snapshot}
            snapshotTime={content.snapshotTime}
            sectionLabel={sectionLabel}
          />
          <FeedbackResultCard
            feedback={content.feedback}
            followUp={content.followUp}
            showScore={showScore}
          />
          <RatingButtons messageId={message.id} currentRating={message.rating} onRate={onRate} />
        </div>
      </div>
    );
  }

  if (content.type === 'text' && !isUser) {
    return (
      <div className="flex justify-start mb-3">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[92%] shadow-sm">
          <p
            className="text-xs text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content.text) }}
          />
          <RatingButtons messageId={message.id} currentRating={message.rating} onRate={onRate} />
        </div>
      </div>
    );
  }

  return null;
}

interface Props {
  proposalId: string | null;
  sectionType: SectionType;
  fieldValues: Record<string, string>;
  onGetFeedbackRef?: (fn: () => void) => void;
}

export function AIChatPanel({ proposalId, sectionType, fieldValues, onGetFeedbackRef }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [ratedIds, setRatedIds] = useState<Record<string, 1 | -1>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevSectionRef = useRef<SectionType | null>(null);

  const config = SECTION_CHAT_CONFIG[sectionType];
  const sectionLabel = SECTION_LABELS[sectionType];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  const addLocalMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const makeLocalMessage = useCallback((
    role: 'user' | 'assistant',
    content: ChatMessageContent
  ): ChatMessage => ({
    id: `local-${Date.now()}-${Math.random()}`,
    proposal_id: proposalId ?? '',
    section_type: sectionType,
    role,
    content,
    rating: null,
    created_at: new Date().toISOString(),
  }), [proposalId, sectionType]);

  useEffect(() => {
    if (!proposalId) return;

    async function init() {
      setLoading(true);
      setInitialized(false);
      const history = await loadChatMessages(proposalId!, sectionType);
      setMessages(history);

      if (history.length === 0) {
        const welcomeMsg = makeLocalMessage('assistant', { type: 'text', text: config.welcomeMessage });
        addLocalMessage(welcomeMsg);
        if (proposalId) {
          const saved = await saveChatMessage(proposalId, sectionType, 'assistant', { type: 'text', text: config.welcomeMessage });
          if (saved) {
            setMessages(prev => prev.map(m => m.id === welcomeMsg.id ? saved : m));
          }
        }
      }

      setLoading(false);
      setInitialized(true);
    }

    init();
  }, [proposalId, sectionType]);

  useEffect(() => {
    if (prevSectionRef.current && prevSectionRef.current !== sectionType && initialized) {
      const greeting = makeLocalMessage('assistant', { type: 'text', text: config.welcomeMessage });
      addLocalMessage(greeting);
      if (proposalId) {
        saveChatMessage(proposalId, sectionType, 'assistant', { type: 'text', text: config.welcomeMessage }).then(saved => {
          if (saved) setMessages(prev => prev.map(m => m.id === greeting.id ? saved : m));
        });
      }
    }
    prevSectionRef.current = sectionType;
  }, [sectionType]);

  useEffect(() => {
    if (initialized) scrollToBottom();
  }, [messages, initialized]);

  const triggerFeedback = useCallback(async () => {
    if (!proposalId || loading || thinking) return;

    const hasContent = Object.values(fieldValues).some(v => v.trim().length > 0);
    if (!hasContent) {
      const hint = makeLocalMessage('assistant', { type: 'text', text: "Your fields are empty. Fill in the section first, then click **Get Feedback**." });
      addLocalMessage(hint);
      if (proposalId) saveChatMessage(proposalId, sectionType, 'assistant', { type: 'text', text: "Your fields are empty. Fill in the section first, then click **Get Feedback**." });
      return;
    }

    const triggerContent: ChatMessageContent = { type: 'get_feedback_trigger', sectionType };
    const triggerMsg = makeLocalMessage('user', triggerContent);
    addLocalMessage(triggerMsg);
    if (proposalId) {
      const saved = await saveChatMessage(proposalId, sectionType, 'user', triggerContent);
      if (saved) setMessages(prev => prev.map(m => m.id === triggerMsg.id ? saved : m));
    }

    setThinking(true);

    await new Promise(resolve => setTimeout(resolve, 400));

    const snapshotTime = formatTime(new Date().toISOString());
    const fieldLabels = config.fieldLabels;
    const snapshot: FieldSnapshot[] = Object.entries(fieldLabels)
      .map(([key, label]) => ({ label, value: fieldValues[key] ?? '' }))
      .filter(f => f.value.trim().length > 0);

    const result = getFeedbackForSection(sectionType, fieldValues);

    const feedbackPayload = result
      ? buildFeedbackFromResult(result)
      : { score: 0, scoreLabel: '', strengths: [], redFlags: [], suggestions: [], followUpQuestions: [], nextSteps: [] };

    const followUp = result ? buildFollowUpFromResult(result) : 'Would you like to ask me anything about this section?';

    const responseContent: ChatMessageContent = {
      type: 'feedback',
      snapshot,
      snapshotTime,
      feedback: feedbackPayload,
      followUp,
    };

    const responseMsg = makeLocalMessage('assistant', responseContent);
    addLocalMessage(responseMsg);
    setThinking(false);

    if (proposalId) {
      const saved = await saveChatMessage(proposalId, sectionType, 'assistant', responseContent);
      if (saved) setMessages(prev => prev.map(m => m.id === responseMsg.id ? saved : m));
    }
  }, [proposalId, sectionType, fieldValues, config, loading, thinking]);

  useEffect(() => {
    if (onGetFeedbackRef) onGetFeedbackRef(triggerFeedback);
  }, [triggerFeedback, onGetFeedbackRef]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading || thinking) return;
    setInput('');

    const userContent: ChatMessageContent = { type: 'text', text: text.trim() };
    const userMsg = makeLocalMessage('user', userContent);
    addLocalMessage(userMsg);

    if (proposalId) {
      const saved = await saveChatMessage(proposalId, sectionType, 'user', userContent);
      if (saved) setMessages(prev => prev.map(m => m.id === userMsg.id ? saved : m));
    }

    setThinking(true);

    const history = messages
      .filter(m => m.content.type === 'text')
      .map(m => ({
        role: m.role,
        text: (m.content as { type: 'text'; text: string }).text,
      }));
    history.push({ role: 'user', text: text.trim() });

    const reply = await getChatReply(history, sectionType, fieldValues);

    const replyContent: ChatMessageContent = { type: 'text', text: reply };
    const replyMsg = makeLocalMessage('assistant', replyContent);
    addLocalMessage(replyMsg);
    setThinking(false);

    if (proposalId) {
      const saved = await saveChatMessage(proposalId, sectionType, 'assistant', replyContent);
      if (saved) setMessages(prev => prev.map(m => m.id === replyMsg.id ? saved : m));
    }
  }, [messages, sectionType, fieldValues, proposalId, loading, thinking]);

  const handleRate = useCallback(async (id: string, r: 1 | -1) => {
    setRatedIds(prev => ({ ...prev, [id]: r }));
    setMessages(prev => prev.map(m => m.id === id ? { ...m, rating: r } : m));
    if (!id.startsWith('local-')) await rateChatMessage(id, r);
  }, []);

  const handleClear = useCallback(async () => {
    setShowClearConfirm(false);
    setMessages([]);
    if (proposalId) await clearChatMessages(proposalId, sectionType);
    const welcomeMsg = makeLocalMessage('assistant', { type: 'text', text: config.welcomeMessage });
    addLocalMessage(welcomeMsg);
    if (proposalId) {
      const saved = await saveChatMessage(proposalId, sectionType, 'assistant', { type: 'text', text: config.welcomeMessage });
      if (saved) setMessages(prev => prev.map(m => m.id === welcomeMsg.id ? saved : m));
    }
  }, [proposalId, sectionType, config]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">AI Coach</p>
            <p className="text-xs text-blue-600 font-medium leading-none mt-0.5">{sectionLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {showClearConfirm && (
        <div className="mx-3 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex-shrink-0">
          <p className="text-xs text-red-700 mb-2">Clear all chat history for this section?</p>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-red-700"
            >
              Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="text-xs text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-3 pt-3 pb-1 min-h-0"
        role="log"
        aria-live="polite"
        aria-label="AI coach conversation"
      >
        {loading && (
          <div className="flex justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">No messages yet. Fill in the section and click <strong>Get Feedback</strong>.</p>
          </div>
        )}

        {!loading && messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={{ ...msg, rating: ratedIds[msg.id] ?? msg.rating }}
            sectionLabel={sectionLabel}
            onRate={handleRate}
          />
        ))}

        {thinking && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-3 pb-1 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
          {config.quickPrompts.map(qp => (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.message)}
              disabled={thinking}
              className="flex-shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3 flex-shrink-0">
        <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={thinking}
            rows={1}
            placeholder="Ask anything about this section..."
            className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed max-h-24 overflow-auto"
            style={{ minHeight: '1.5rem' }}
            aria-label="Chat input"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
