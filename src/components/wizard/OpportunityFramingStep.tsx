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

export function OpportunityFramingStep({ onGetFeedback, onFieldsChange }: Props) {
  const { sections, saving, proposal, saveSection, nextStep, previousStep, currentStep, logSectionEdit, updatePresenceField, presenceList } = useWizard();
  const saved = sections['opportunity_framing'];

  const [hmwStatement, setHmwStatement] = useState(saved?.content?.hmwStatement || '');
  const [rootCauses, setRootCauses] = useState(saved?.content?.rootCauses || '');
  const [opportunityScope, setOpportunityScope] = useState(saved?.content?.opportunityScope || '');
  const [designConstraints, setDesignConstraints] = useState(saved?.content?.designConstraints || '');

  useEffect(() => {
    if (saved?.content) {
      setHmwStatement(saved.content.hmwStatement || '');
      setRootCauses(saved.content.rootCauses || '');
      setOpportunityScope(saved.content.opportunityScope || '');
      setDesignConstraints(saved.content.designConstraints || '');
    }
  }, [saved]);

  useEffect(() => {
    onFieldsChange?.({ hmwStatement, rootCauses, opportunityScope, designConstraints });
  }, [hmwStatement, rootCauses, opportunityScope, designConstraints]);

  const isComplete = !!(hmwStatement.trim() && rootCauses.trim() && opportunityScope.trim() && designConstraints.trim());

  const handleSave = async () => {
    await saveSection('opportunity_framing', { hmwStatement, rootCauses, opportunityScope, designConstraints }, isComplete);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Opportunity Framing</h2>
        <p className="text-sm text-gray-500">Define the opportunity space by articulating the core problem in an actionable way.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          How Might We Statement <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="hmwStatement" presenceList={presenceList} />
        </label>
        <textarea
          value={hmwStatement}
          onChange={e => setHmwStatement(e.target.value)}
          onFocus={() => updatePresenceField('hmwStatement')}
          onBlur={() => { updatePresenceField(null); if (hmwStatement.trim()) logSectionEdit('opportunity_framing', 'hmwStatement'); }}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder='Frame the problem as an opportunity: "How Might We [action] for [who] so that [outcome]?"'
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Root Cause(s) <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="rootCauses" presenceList={presenceList} />
        </label>
        <textarea
          value={rootCauses}
          onChange={e => setRootCauses(e.target.value)}
          onFocus={() => updatePresenceField('rootCauses')}
          onBlur={() => { updatePresenceField(null); if (rootCauses.trim()) logSectionEdit('opportunity_framing', 'rootCauses'); }}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="What is driving this problem at its core? What systemic or process factors create this situation?"
        />
      </div>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Opportunity Scope <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="opportunityScope" presenceList={presenceList} />
          </label>
          <textarea
            value={opportunityScope}
            onChange={e => setOpportunityScope(e.target.value)}
            onFocus={() => updatePresenceField('opportunityScope')}
            onBlur={() => { updatePresenceField(null); if (opportunityScope.trim()) logSectionEdit('opportunity_framing', 'opportunityScope'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="Who specifically would benefit, in what context, and how often does this situation arise?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Design Constraints <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="designConstraints" presenceList={presenceList} />
          </label>
          <textarea
            value={designConstraints}
            onChange={e => setDesignConstraints(e.target.value)}
            onFocus={() => updatePresenceField('designConstraints')}
            onBlur={() => { updatePresenceField(null); if (designConstraints.trim()) logSectionEdit('opportunity_framing', 'designConstraints'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="What constraints must any solution work within? (policy, technology, budget, timeline, compliance)"
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
        <LastEditedBy proposalId={proposal.id} sectionType="opportunity_framing" />
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
