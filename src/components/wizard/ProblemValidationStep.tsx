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

export function ProblemValidationStep({ onGetFeedback, onFieldsChange }: Props) {
  const { sections, saving, proposal, saveSection, nextStep, previousStep, currentStep, logSectionEdit, updatePresenceField, presenceList } = useWizard();
  const saved = sections['problem_validation'];

  const [impactAssessment, setImpactAssessment] = useState(saved?.content?.impactAssessment || '');
  const [stakeholders, setStakeholders] = useState(saved?.content?.stakeholders || '');
  const [existingWorkarounds, setExistingWorkarounds] = useState(saved?.content?.existingWorkarounds || '');
  const [urgency, setUrgency] = useState(saved?.content?.urgency || '');

  useEffect(() => {
    if (saved?.content) {
      setImpactAssessment(saved.content.impactAssessment || '');
      setStakeholders(saved.content.stakeholders || '');
      setExistingWorkarounds(saved.content.existingWorkarounds || '');
      setUrgency(saved.content.urgency || '');
    }
  }, [saved]);

  useEffect(() => {
    onFieldsChange?.({ impactAssessment, stakeholders, existingWorkarounds, urgency });
  }, [impactAssessment, stakeholders, existingWorkarounds, urgency]);

  const isComplete = !!(impactAssessment.trim() && stakeholders.trim() && existingWorkarounds.trim() && urgency.trim());

  const handleSave = async () => {
    await saveSection('problem_validation', { impactAssessment, stakeholders, existingWorkarounds, urgency }, isComplete);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Problem Validation</h2>
        <p className="text-sm text-gray-500">Validate the problem by assessing its impact and understanding its scope.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Impact Assessment <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="impactAssessment" presenceList={presenceList} />
        </label>
        <textarea
          value={impactAssessment}
          onChange={e => setImpactAssessment(e.target.value)}
          onFocus={() => updatePresenceField('impactAssessment')}
          onBlur={() => { updatePresenceField(null); if (impactAssessment.trim()) logSectionEdit('problem_validation', 'impactAssessment'); }}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="How many users affected? Time or cost impact? Quantify wherever possible."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Key Stakeholders <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="stakeholders" presenceList={presenceList} />
        </label>
        <textarea
          value={stakeholders}
          onChange={e => setStakeholders(e.target.value)}
          onFocus={() => updatePresenceField('stakeholders')}
          onBlur={() => { updatePresenceField(null); if (stakeholders.trim()) logSectionEdit('problem_validation', 'stakeholders'); }}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="List all stakeholders and their interest in solving this problem"
        />
      </div>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Existing Workarounds <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="existingWorkarounds" presenceList={presenceList} />
          </label>
          <textarea
            value={existingWorkarounds}
            onChange={e => setExistingWorkarounds(e.target.value)}
            onFocus={() => updatePresenceField('existingWorkarounds')}
            onBlur={() => { updatePresenceField(null); if (existingWorkarounds.trim()) logSectionEdit('problem_validation', 'existingWorkarounds'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="What solutions or workarounds are people using today?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Urgency & Priority <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="urgency" presenceList={presenceList} />
          </label>
          <textarea
            value={urgency}
            onChange={e => setUrgency(e.target.value)}
            onFocus={() => updatePresenceField('urgency')}
            onBlur={() => { updatePresenceField(null); if (urgency.trim()) logSectionEdit('problem_validation', 'urgency'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="Why solve this now? Consequences of delay?"
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
        <LastEditedBy proposalId={proposal.id} sectionType="problem_validation" />
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
