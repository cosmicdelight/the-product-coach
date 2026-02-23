import { useState, useEffect } from 'react';
import { useWizard } from '../../contexts/ProposalWizardContext';
import { StepNav } from './StepNav';
import { MessageSquare } from 'lucide-react';
import { PresenceIndicator } from '../proposal/PresenceIndicator';
import { LastEditedBy } from '../proposal/LastEditedBy';

interface Props {
  onGetFeedback?: () => void;
  onFieldsChange?: (fields: Record<string, string>) => void;
}

export function SuccessDefinitionStep({ onGetFeedback, onFieldsChange }: Props) {
  const { sections, saving, proposal, saveSection, nextStep, previousStep, currentStep, logSectionEdit, updatePresenceField, presenceList } = useWizard();
  const saved = sections['success_definition'];

  const [desiredOutcomes, setDesiredOutcomes] = useState(saved?.content?.desiredOutcomes || '');
  const [doneWell, setDoneWell] = useState(saved?.content?.doneWell || '');
  const [earlySignals, setEarlySignals] = useState(saved?.content?.earlySignals || '');
  const [outOfScope, setOutOfScope] = useState(saved?.content?.outOfScope || '');

  useEffect(() => {
    if (saved?.content) {
      setDesiredOutcomes(saved.content.desiredOutcomes || '');
      setDoneWell(saved.content.doneWell || '');
      setEarlySignals(saved.content.earlySignals || '');
      setOutOfScope(saved.content.outOfScope || '');
    }
  }, [saved]);

  useEffect(() => {
    onFieldsChange?.({ desiredOutcomes, doneWell, earlySignals, outOfScope });
  }, [desiredOutcomes, doneWell, earlySignals, outOfScope]);

  const isComplete = !!(desiredOutcomes.trim() && doneWell.trim() && earlySignals.trim() && outOfScope.trim());

  const handleSave = async () => {
    await saveSection('success_definition', { desiredOutcomes, doneWell, earlySignals, outOfScope }, isComplete);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Success Definition</h2>
        <p className="text-sm text-gray-500">Define what a successful outcome looks like before thinking about solutions.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Desired Outcomes <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="desiredOutcomes" presenceList={presenceList} />
        </label>
        <textarea
          value={desiredOutcomes}
          onChange={e => setDesiredOutcomes(e.target.value)}
          onFocus={() => updatePresenceField('desiredOutcomes')}
          onBlur={() => { updatePresenceField(null); if (desiredOutcomes.trim()) logSectionEdit('success_definition', 'desiredOutcomes'); }}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="What changes in the world if this problem is solved? Describe the end state for affected people."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          What Does "Done Well" Look Like? <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="doneWell" presenceList={presenceList} />
        </label>
        <textarea
          value={doneWell}
          onChange={e => setDoneWell(e.target.value)}
          onFocus={() => updatePresenceField('doneWell')}
          onBlur={() => { updatePresenceField(null); if (doneWell.trim()) logSectionEdit('success_definition', 'doneWell'); }}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="If this went better than expected, what would you observe? How would affected users describe the difference?"
        />
      </div>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Early Signals of Success <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="earlySignals" presenceList={presenceList} />
          </label>
          <textarea
            value={earlySignals}
            onChange={e => setEarlySignals(e.target.value)}
            onFocus={() => updatePresenceField('earlySignals')}
            onBlur={() => { updatePresenceField(null); if (earlySignals.trim()) logSectionEdit('success_definition', 'earlySignals'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="What small, observable changes in the near term would indicate you are on the right track?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Explicitly Out of Scope <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="outOfScope" presenceList={presenceList} />
          </label>
          <textarea
            value={outOfScope}
            onChange={e => setOutOfScope(e.target.value)}
            onFocus={() => updatePresenceField('outOfScope')}
            onBlur={() => { updatePresenceField(null); if (outOfScope.trim()) logSectionEdit('success_definition', 'outOfScope'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="What are you NOT trying to solve with this proposal? What boundaries does this problem scope not include?"
          />
        </div>
      </div>

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
        <LastEditedBy proposalId={proposal.id} sectionType="success_definition" />
      )}

      <StepNav
        currentStep={currentStep}
        canProceed={isComplete}
        saving={saving}
        onSave={handleSave}
        onSaveAndContinue={async () => { await handleSave(); nextStep(); }}
        onBack={previousStep}
      />
    </div>
  );
}
