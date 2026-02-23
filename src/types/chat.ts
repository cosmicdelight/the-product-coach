import { SectionType } from './database';

export interface FieldSnapshot {
  label: string;
  value: string;
}

export interface FeedbackPayload {
  score: number;
  scoreLabel: string;
  strengths: string[];
  redFlags: string[];
  suggestions: string[];
  followUpQuestions: string[];
  nextSteps: string[];
}

export type ChatMessageContent =
  | { type: 'text'; text: string }
  | { type: 'feedback'; snapshot: FieldSnapshot[]; snapshotTime: string; feedback: FeedbackPayload; followUp: string }
  | { type: 'get_feedback_trigger'; sectionType: SectionType };

export interface ChatMessage {
  id: string;
  proposal_id: string;
  section_type: SectionType;
  role: 'user' | 'assistant';
  content: ChatMessageContent;
  rating: 1 | -1 | null;
  created_at: string;
}

export interface SectionQuickPrompt {
  label: string;
  message: string;
}

export interface SectionChatConfig {
  welcomeMessage: string;
  quickPrompts: SectionQuickPrompt[];
  fieldLabels: Record<string, string>;
}
