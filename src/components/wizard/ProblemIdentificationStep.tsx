import { useState, useEffect } from 'react';
import { useWizard } from '../../contexts/ProposalWizardContext';
import { StepNav } from './StepNav';
import { MessageSquare } from 'lucide-react';
import { PresenceIndicator } from '../proposal/PresenceIndicator';
import { LastEditedBy } from '../proposal/LastEditedBy';
import { TutorialTarget } from '../tutorial/TutorialTarget';

interface Props {
  onGetFeedback?: () => void;
  onFieldsChange?: (fields: Record<string, string>) => void;
}

export function ProblemIdentificationStep({ onGetFeedback, onFieldsChange }: Props) {
  const { sections, saving, proposal, saveSection, updateTitle, nextStep, previousStep, currentStep, logSectionEdit, updatePresenceField, presenceList } = useWizard();
  const saved = sections['problem_identification'];

  const [title, setTitle] = useState(saved?.content?.title || proposal?.title || '');
  const [problemStatement, setProblemStatement] = useState(saved?.content?.problemStatement || '');
  const [affectedUsers, setAffectedUsers] = useState(saved?.content?.affectedUsers || '');
  const [currentImpact, setCurrentImpact] = useState(saved?.content?.currentImpact || '');

  useEffect(() => {
    if (saved?.content) {
      setTitle(saved.content.title || proposal?.title || '');
      setProblemStatement(saved.content.problemStatement || '');
      setAffectedUsers(saved.content.affectedUsers || '');
      setCurrentImpact(saved.content.currentImpact || '');
    }
  }, [saved]);

  useEffect(() => {
    onFieldsChange?.({ problemStatement, affectedUsers, currentImpact });
  }, [problemStatement, affectedUsers, currentImpact]);

  const isComplete = !!(title.trim() && problemStatement.trim() && affectedUsers.trim() && currentImpact.trim());

  const handleSave = async () => {
    await updateTitle(title);
    await saveSection('problem_identification', { title, problemStatement, affectedUsers, currentImpact }, isComplete);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Problem Identification</h2>
        <p className="text-sm text-gray-500">Start by clearly defining the problem or opportunity you want to address.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Proposal Title <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="title" presenceList={presenceList} />
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => updatePresenceField('title')}
          onBlur={() => { updatePresenceField(null); if (title.trim()) logSectionEdit('problem_identification', 'title'); }}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="e.g., Streamline Document Approval Process for HR Department"
        />
      </div>

      <TutorialTarget tutorialId="wizard-problem-statement">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Problem Statement <span className="text-red-500">*</span>
          <PresenceIndicator fieldName="problemStatement" presenceList={presenceList} />
        </label>
        <textarea
          value={problemStatement}
          onChange={e => setProblemStatement(e.target.value)}
          onFocus={() => updatePresenceField('problemStatement')}
          onBlur={() => { updatePresenceField(null); if (problemStatement.trim()) logSectionEdit('problem_identification', 'problemStatement'); }}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="Describe the problem in detail. What is happening? Why is it a problem? What are the consequences?"
        />
      </TutorialTarget>

      <div className="grid gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Who is Affected? <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="affectedUsers" presenceList={presenceList} />
          </label>
          <textarea
            value={affectedUsers}
            onChange={e => setAffectedUsers(e.target.value)}
            onFocus={() => updatePresenceField('affectedUsers')}
            onBlur={() => { updatePresenceField(null); if (affectedUsers.trim()) logSectionEdit('problem_identification', 'affectedUsers'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="Users, teams, or departments affected"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Impact <span className="text-red-500">*</span>
            <PresenceIndicator fieldName="currentImpact" presenceList={presenceList} />
          </label>
          <textarea
            value={currentImpact}
            onChange={e => setCurrentImpact(e.target.value)}
            onFocus={() => updatePresenceField('currentImpact')}
            onBlur={() => { updatePresenceField(null); if (currentImpact.trim()) logSectionEdit('problem_identification', 'currentImpact'); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="Time wasted, costs, user frustration, etc."
          />
        </div>
      </div>

      {onGetFeedback && (
        <div className="flex justify-end">
          <TutorialTarget tutorialId="wizard-get-feedback-btn" as="span">
            <button
              onClick={onGetFeedback}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Get Feedback
            </button>
          </TutorialTarget>
        </div>
      )}

      {proposal && (
        <LastEditedBy proposalId={proposal.id} sectionType="problem_identification" />
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
