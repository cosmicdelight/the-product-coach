import { useState } from 'react';
import { Sparkles, Loader, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Lightbulb, HelpCircle, ArrowRight } from 'lucide-react';
import { SectionType } from '../../types/database';
import { aiService, ValidationCoachResult } from '../../services/aiService';

const RUBRIC_TOOLTIPS: Partial<Record<SectionType, string>> = {
  problem_validation: 'Score: user count (+2), TAM scale (+2), named stakeholders (+2), workaround friction (+2), urgency (+2). -1 per red flag (missing interviews, no source citation, etc.)',
  user_research: 'Score: named user groups (+2), participant count (+2), verbatim quotes (+2), pain points (+1), open questions (+1), specific needs (+1), prioritised needs (+1). -1 per red flag.',
  opportunity_framing: 'Score: well-formed HMW (+2), specific root cause (+2), scoped audience/context (+2), named constraints (+2), GovTech/public sector context (+2). -1 per red flag (generic HMW, no constraints, scope too broad).',
  success_definition: 'Score: outcome-oriented language (+2), observable change for users (+2), measurable early signal (+2), explicit out-of-scope (+2), alignment to problem statement (+2). -1 per red flag (solution language, vague outcomes, no out-of-scope).',
};

const STEP_LABELS: Partial<Record<SectionType, string>> = {
  problem_validation: 'Problem Maturity',
  user_research: 'Research Depth',
  opportunity_framing: 'Opportunity Clarity',
  success_definition: 'Outcome Clarity',
};

interface Props {
  sectionType: SectionType;
  inputValue: string;
  additionalContext?: Record<string, string>;
  emptyHint?: string;
}

function parseValidationResult(raw: string): ValidationCoachResult | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.__type === 'validation_coach') return parsed as ValidationCoachResult;
    return null;
  } catch {
    return null;
  }
}

function ScoreBadge({ score, scoreLabel, sectionType }: { score: number; scoreLabel: string; sectionType: SectionType }) {
  const color =
    score >= 8 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
    score >= 6 ? 'bg-blue-100 text-blue-800 border-blue-200' :
    score >= 4 ? 'bg-amber-100 text-amber-800 border-amber-200' :
    'bg-red-100 text-red-800 border-red-200';

  const barColor =
    score >= 8 ? 'bg-emerald-500' :
    score >= 6 ? 'bg-blue-500' :
    score >= 4 ? 'bg-amber-500' :
    'bg-red-500';

  const label = STEP_LABELS[sectionType] ?? 'Section Score';
  const tooltipText = RUBRIC_TOOLTIPS[sectionType] ?? 'Score based on specificity, evidence, quantification, and GovTech alignment. -1 per red flag.';

  return (
    <div className="flex items-center gap-3">
      <div className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${color} cursor-default`}>
        <span>{label}</span>
        <span className="font-bold">{score}/10</span>
        <span className="text-xs font-medium opacity-75">— {scoreLabel}</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-72 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-24">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  items,
  tint,
  numbered,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tint: string;
  numbered?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-lg p-3 ${tint}`}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700 leading-snug">
            <span className="shrink-0 mt-0.5 text-gray-400 font-mono text-xs">
              {numbered ? `${i + 1}.` : '·'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValidationCoachPanel({ result, sectionType }: { result: ValidationCoachResult; sectionType: SectionType }) {
  return (
    <div className="space-y-3 pt-1">
      <ScoreBadge score={result.score} scoreLabel={result.scoreLabel} sectionType={sectionType} />

      <Section
        icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
        title="Strengths"
        items={result.strengths}
        tint="bg-emerald-50 border border-emerald-100"
      />

      <Section
        icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
        title="Red Flags"
        items={result.redFlags}
        tint="bg-amber-50 border border-amber-100"
      />

      <Section
        icon={<Lightbulb className="h-3.5 w-3.5 text-blue-600" />}
        title="Suggested Improvements"
        items={result.suggestions}
        tint="bg-blue-50 border border-blue-100"
        numbered
      />

      <Section
        icon={<HelpCircle className="h-3.5 w-3.5 text-slate-600" />}
        title="Follow-up Questions to Probe Deeper"
        items={result.followUpQuestions}
        tint="bg-slate-50 border border-slate-200"
        numbered
      />

      <Section
        icon={<ArrowRight className="h-3.5 w-3.5 text-gray-600" />}
        title="Next Steps"
        items={result.nextSteps}
        tint="bg-gray-50 border border-gray-200"
        numbered
      />
    </div>
  );
}

export function AISuggestionBox({ sectionType, inputValue, additionalContext, emptyHint }: Props) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleGenerate = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    try {
      const result = await aiService.generateSuggestion(sectionType, inputValue, additionalContext);
      setSuggestion(result);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  const validationResult = suggestion ? parseValidationResult(suggestion) : null;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI Coach</span>
        </div>
        <div className="flex items-center gap-2">
          {suggestion && (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-700">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={!inputValue.trim() || loading}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? 'Analysing...' : suggestion ? 'Regenerate' : 'Get AI Help'}
          </button>
        </div>
      </div>

      {suggestion && expanded && (
        <div className="px-4 pb-4 border-t border-blue-100">
          {validationResult ? (
            <ValidationCoachPanel result={validationResult} sectionType={sectionType} />
          ) : (
            <>
              <p className="text-xs text-blue-600 font-medium mb-2 mt-3">Suggestions & Guidance</p>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{suggestion}</div>
            </>
          )}
        </div>
      )}

      {!suggestion && !loading && (
        <div className="px-4 pb-3 border-t border-blue-100">
          <p className="text-xs text-gray-500 mt-2">
            {emptyHint ?? 'Fill in the field above, then click "Get AI Help" for suggestions.'}
          </p>
        </div>
      )}
    </div>
  );
}
