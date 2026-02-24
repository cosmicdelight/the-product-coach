import { useState, useEffect } from 'react';
import { useWizard } from '../../contexts/ProposalWizardContext';
import { aiService } from '../../services/aiService';
import { CheckCircle, Circle, Sparkles, Loader, MessageSquare } from 'lucide-react';
import { StepNav } from './StepNav';
import { PresenceIndicator } from '../proposal/PresenceIndicator';
import { LastEditedBy } from '../proposal/LastEditedBy';
import { TutorialTarget } from '../tutorial/TutorialTarget';

const SECTION_LABELS: Record<string, string> = {
  problem_identification: 'Problem Identification',
  problem_validation: 'Problem Validation',
  user_research: 'User Research',
  opportunity_framing: 'Opportunity Framing',
  success_definition: 'Success Definition',
};

interface Props {
  onGetFeedback?: () => void;
  onFieldsChange?: (fields: Record<string, string>) => void;
}

export function ExecutiveSummaryStep({ onGetFeedback, onFieldsChange }: Props) {
  const { sections, proposal, saving, saveSection, submitProposal, previousStep, currentStep, logSectionEdit, updatePresenceField, presenceList } = useWizard();
  const saved = sections['executive_summary'];

  const [summary, setSummary] = useState(saved?.content?.summary || '');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (saved?.content?.summary) setSummary(saved.content.summary);
  }, [saved]);

  useEffect(() => {
    onFieldsChange?.({ summary });
  }, [summary]);

  const completedSections = Object.keys(SECTION_LABELS).filter(k => sections[k]?.completed);
  const allComplete = completedSections.length === Object.keys(SECTION_LABELS).length;

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const pi = sections['problem_identification']?.content || {};
      const pv = sections['problem_validation']?.content || {};
      const ur = sections['user_research']?.content || {};
      const of = sections['opportunity_framing']?.content || {};
      const sd = sections['success_definition']?.content || {};

      const result = await aiService.generateSuggestion('executive_summary', '', {
        problemStatement: pi.problemStatement || '',
        affectedUsers: pi.affectedUsers || '',
        currentImpact: pi.currentImpact || '',
        impactAssessment: pv.impactAssessment || '',
        stakeholders: pv.stakeholders || '',
        existingWorkarounds: pv.existingWorkarounds || '',
        urgency: pv.urgency || '',
        targetUsers: ur.targetUsers || '',
        researchFindings: ur.researchFindings || '',
        userNeeds: ur.userNeeds || '',
        hmwStatement: of.hmwStatement || '',
        rootCauses: of.rootCauses || '',
        opportunityScope: of.opportunityScope || '',
        designConstraints: of.designConstraints || '',
        desiredOutcomes: sd.desiredOutcomes || '',
        doneWell: sd.doneWell || '',
        earlySignals: sd.earlySignals || '',
        outOfScope: sd.outOfScope || '',
      });
      setSummary(result);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    await saveSection('executive_summary', { summary }, !!summary.trim());
  };

  const handleSubmit = async () => {
    await handleSave();
    setSubmitting(true);
    try {
      await submitProposal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Executive Summary</h2>
        <p className="text-sm text-gray-500">Create a compelling summary — this is the first thing reviewers will read.</p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Proposal Completion Checklist</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SECTION_LABELS).map(([key, label]) => {
            const done = sections[key]?.completed;
            return (
              <div key={key} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${done ? 'bg-green-50 text-green-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
                {done
                  ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  : <Circle className="h-4 w-4 flex-shrink-0" />}
                <span className="text-xs">{label}</span>
              </div>
            );
          })}
        </div>
        {!allComplete && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-3">
            Complete all sections above before submitting. You can still save your summary as a draft.
          </p>
        )}
      </div>

      <TutorialTarget tutorialId="wizard-executive-summary">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Executive Summary <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="summary" presenceList={presenceList} />
          </label>
          <button
            onClick={handleGenerateAI}
            disabled={generating || !allComplete}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          onFocus={() => updatePresenceField('summary')}
          onBlur={() => { updatePresenceField(null); if (summary.trim()) logSectionEdit('executive_summary', 'summary'); }}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="A concise overview covering: the problem, who is affected, the opportunity framing, and what success looks like for those people..."
        />
        <p className="text-xs text-gray-400 mt-1">Target 200–300 words. Focus on the problem and its human impact.</p>
      </TutorialTarget>

      {onGetFeedback && (
        <div className="flex justify-end">
          <button
            onClick={onGetFeedback}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Get Feedback
          </button>
        </div>
      )}

      {proposal && (
        <LastEditedBy proposalId={proposal.id} sectionType="executive_summary" />
      )}

      <TutorialTarget tutorialId="wizard-submit-btn">
        <StepNav
          currentStep={currentStep}
          canProceed={!!summary.trim()}
          saving={saving || submitting}
          onSave={handleSave}
          onSaveAndContinue={handleSubmit}
          onBack={previousStep}
          isLastStep
          submitLabel={submitting ? 'Submitting...' : allComplete ? 'Submit for Review' : 'Save Draft'}
        />
      </TutorialTarget>
    </div>
  );
}
