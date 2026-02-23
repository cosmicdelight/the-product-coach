import { CheckCircle, AlertTriangle, Lightbulb, HelpCircle, ArrowRight } from 'lucide-react';
import { FeedbackPayload } from '../../../types/chat';

interface Props {
  feedback: FeedbackPayload;
  followUp: string;
  showScore: boolean;
}

function ScoreBadge({ score, scoreLabel }: { score: number; scoreLabel: string }) {
  const color =
    score >= 8 ? 'bg-green-100 text-green-800 border-green-200' :
    score >= 6 ? 'bg-blue-100 text-blue-800 border-blue-200' :
    score >= 4 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
    'bg-red-100 text-red-800 border-red-200';

  const dot =
    score >= 8 ? 'bg-green-500' :
    score >= 6 ? 'bg-blue-500' :
    score >= 4 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${color} mb-3`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span>{score}/10</span>
      {scoreLabel && <span className="font-normal opacity-75">· {scoreLabel}</span>}
    </div>
  );
}

function FeedbackSection({
  icon,
  title,
  items,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tint: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-lg border p-2.5 mb-2 ${tint}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-gray-700">{title}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-700 leading-relaxed flex gap-1.5">
            <span className="flex-shrink-0 mt-0.5 opacity-40">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackResultCard({ feedback, followUp, showScore }: Props) {
  return (
    <div>
      {showScore && feedback.scoreLabel && (
        <ScoreBadge score={feedback.score} scoreLabel={feedback.scoreLabel} />
      )}

      <FeedbackSection
        icon={<CheckCircle className="h-3.5 w-3.5 text-green-600" />}
        title="Strengths"
        items={feedback.strengths}
        tint="bg-green-50 border-green-100"
      />

      <FeedbackSection
        icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
        title="Red Flags"
        items={feedback.redFlags}
        tint="bg-red-50 border-red-100"
      />

      <FeedbackSection
        icon={<Lightbulb className="h-3.5 w-3.5 text-blue-500" />}
        title="Improvements"
        items={feedback.suggestions}
        tint="bg-blue-50 border-blue-100"
      />

      <FeedbackSection
        icon={<HelpCircle className="h-3.5 w-3.5 text-amber-500" />}
        title="Follow-up Questions"
        items={feedback.followUpQuestions}
        tint="bg-amber-50 border-amber-100"
      />

      <FeedbackSection
        icon={<ArrowRight className="h-3.5 w-3.5 text-slate-500" />}
        title="Next Steps"
        items={feedback.nextSteps}
        tint="bg-slate-50 border-slate-100"
      />

      {followUp && (
        <p className="text-xs text-gray-600 italic mt-2 leading-relaxed">{followUp}</p>
      )}
    </div>
  );
}
