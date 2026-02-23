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

export function UserResearchStep({ onGetFeedback, onFieldsChange }: Props) {
  const { sections, saving, proposal, saveSection, nextStep, previousStep, currentStep, logSectionEdit, updatePresenceField, presenceList } = useWizard();
  const saved = sections['user_research'];

  const [targetUsers, setTargetUsers] = useState(saved?.content?.targetUsers || '');
  const [interviewQuestions, setInterviewQuestions] = useState(saved?.content?.interviewQuestions || '');
  const [researchFindings, setResearchFindings] = useState(saved?.content?.researchFindings || '');
  const [userNeeds, setUserNeeds] = useState(saved?.content?.userNeeds || '');

  useEffect(() => {
    if (saved?.content) {
      setTargetUsers(saved.content.targetUsers || '');
      setInterviewQuestions(saved.content.interviewQuestions || '');
      setResearchFindings(saved.content.researchFindings || '');
      setUserNeeds(saved.content.userNeeds || '');
    }
  }, [saved]);

  useEffect(() => {
    onFieldsChange?.({ targetUsers, interviewQuestions, researchFindings, userNeeds });
  }, [targetUsers, interviewQuestions, researchFindings, userNeeds]);

  const isComplete = !!(targetUsers.trim() && interviewQuestions.trim() && userNeeds.trim());

  const handleSave = async () => {
    await saveSection('user_research', { targetUsers, interviewQuestions, researchFindings, userNeeds }, isComplete);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">User Research</h2>
        <p className="text-sm text-gray-500">Define your research approach and document what you've learned from users.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Target User Groups <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="targetUsers" presenceList={presenceList} />
        </label>
        <textarea
          value={targetUsers}
          onChange={e => setTargetUsers(e.target.value)}
          onFocus={() => updatePresenceField('targetUsers')}
          onBlur={() => { updatePresenceField(null); if (targetUsers.trim()) logSectionEdit('user_research', 'targetUsers'); }}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="Define the specific user groups you need to research"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Interview Questions <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="interviewQuestions" presenceList={presenceList} />
        </label>
        <textarea
          value={interviewQuestions}
          onChange={e => setInterviewQuestions(e.target.value)}
          onFocus={() => updatePresenceField('interviewQuestions')}
          onBlur={() => { updatePresenceField(null); if (interviewQuestions.trim()) logSectionEdit('user_research', 'interviewQuestions'); }}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="List your key interview questions (one per line)"
        />
      </div>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Research Findings
            <PresenceIndicator fieldName="researchFindings" presenceList={presenceList} />
          </label>
          <textarea
            value={researchFindings}
            onChange={e => setResearchFindings(e.target.value)}
            onFocus={() => updatePresenceField('researchFindings')}
            onBlur={() => { updatePresenceField(null); if (researchFindings.trim()) logSectionEdit('user_research', 'researchFindings'); }}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="Key insights from user interviews (optional at this stage)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Prioritised User Needs <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="userNeeds" presenceList={presenceList} />
          </label>
          <textarea
            value={userNeeds}
            onChange={e => setUserNeeds(e.target.value)}
            onFocus={() => updatePresenceField('userNeeds')}
            onBlur={() => { updatePresenceField(null); if (userNeeds.trim()) logSectionEdit('user_research', 'userNeeds'); }}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="Top user needs based on your research"
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
        <LastEditedBy proposalId={proposal.id} sectionType="user_research" />
      )}

      <StepNav currentStep={currentStep} canProceed={isComplete} saving={saving} onSave={handleSave} onSaveAndContinue={async () => { await handleSave(); nextStep(); }} onBack={previousStep} />
    </div>
  );
}
