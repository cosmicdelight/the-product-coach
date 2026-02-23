import { useRef, useCallback, useState, useEffect } from 'react';
import { ProposalWizardProvider, useWizard } from '../contexts/ProposalWizardContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { CheckCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { ProblemIdentificationStep } from '../components/wizard/ProblemIdentificationStep';
import { ProblemValidationStep } from '../components/wizard/ProblemValidationStep';
import { UserResearchStep } from '../components/wizard/UserResearchStep';
import { OpportunityFramingStep } from '../components/wizard/OpportunityFramingStep';
import { SuccessDefinitionStep } from '../components/wizard/SuccessDefinitionStep';
import { ExecutiveSummaryStep } from '../components/wizard/ExecutiveSummaryStep';
import { EventSelector } from '../components/wizard/EventSelector';
import { AIChatPanel } from '../components/wizard/AIChatPanel';
import { ProposalCollaboratorsPanel } from '../components/proposal/ProposalCollaboratorsPanel';
import { SectionType } from '../types/database';

const STEPS = [
  { number: 1, short: 'Problem', title: 'Problem Identification', sectionKey: 'problem_identification' as SectionType, component: ProblemIdentificationStep },
  { number: 2, short: 'Validate', title: 'Problem Validation', sectionKey: 'problem_validation' as SectionType, component: ProblemValidationStep },
  { number: 3, short: 'Research', title: 'User Research', sectionKey: 'user_research' as SectionType, component: UserResearchStep },
  { number: 4, short: 'Opportunity', title: 'Opportunity Framing', sectionKey: 'opportunity_framing' as SectionType, component: OpportunityFramingStep },
  { number: 5, short: 'Success', title: 'Success Definition', sectionKey: 'success_definition' as SectionType, component: SuccessDefinitionStep },
  { number: 6, short: 'Summary', title: 'Executive Summary', sectionKey: 'executive_summary' as SectionType, component: ExecutiveSummaryStep },
];

function getFieldValues(sectionKey: SectionType, sections: Record<string, { content?: Record<string, string> }>): Record<string, string> {
  const content = sections[sectionKey]?.content ?? {};
  return Object.fromEntries(
    Object.entries(content).map(([k, v]) => [k, typeof v === 'string' ? v : ''])
  );
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function WizardContent() {
  const { currentStep, sections, goToStep, proposal, loading, collaborators, presenceList } = useWizard();
  const getFeedbackFnRef = useRef<(() => void) | null>(null);
  const liveFieldValuesRef = useRef<Record<string, string>>({});
  const [liveFieldValues, setLiveFieldValues] = useState<Record<string, string>>({});
  const [showTeamPanel, setShowTeamPanel] = useState(false);

  const handleGetFeedbackRef = useCallback((fn: () => void) => {
    getFeedbackFnRef.current = fn;
  }, []);

  const handleGetFeedback = useCallback(() => {
    getFeedbackFnRef.current?.();
  }, []);

  const handleFieldsChange = useCallback((fields: Record<string, string>) => {
    liveFieldValuesRef.current = fields;
    setLiveFieldValues(fields);
  }, []);

  useEffect(() => {
    liveFieldValuesRef.current = {};
    setLiveFieldValues({});
  }, [currentStep]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  const currentStepConfig = STEPS[currentStep - 1];
  const CurrentStep = currentStepConfig.component;
  const currentSectionKey = currentStepConfig.sectionKey;
  const completedCount = STEPS.filter(s => sections[s.sectionKey]?.completed).length;
  const savedFieldValues = getFieldValues(currentSectionKey, sections);
  const fieldValues = Object.keys(liveFieldValues).length > 0 ? liveFieldValues : savedFieldValues;

  const activeCollaborators = collaborators.filter(c => c.status === 'active');
  const hasTeam = activeCollaborators.length > 0 || collaborators.filter(c => c.status === 'pending').length > 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="mb-4 px-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {proposal?.title || 'New Proposal'}
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {presenceList.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-gray-500">
                    {presenceList.length} editing now
                  </span>
                  <div className="flex -space-x-1.5">
                    {presenceList.slice(0, 3).map(p => (
                      <div
                        key={p.userId}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white"
                        style={{ backgroundColor: p.color }}
                        title={p.fullName}
                      >
                        {getInitials(p.fullName)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <span className="text-sm text-gray-500">
                {completedCount}/6 sections complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <EventSelector />
          </div>

          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 6) * 100}%` }}
            />
          </div>
        </div>

        {hasTeam && activeCollaborators.length > 0 && (
          <div className="mb-3 flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700">
            <Users className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span>
              Changes you make are visible to all {activeCollaborators.length + 1} team members in real-time.
            </span>
          </div>
        )}

        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {STEPS.map(step => {
            const isCompleted = sections[step.sectionKey]?.completed;
            const isCurrent = currentStep === step.number;
            const isAccessible = step.number <= currentStep;
            const editorsOnStep = presenceList.filter(p => p.currentSection === step.sectionKey);

            return (
              <button
                key={step.number}
                onClick={() => isAccessible && goToStep(step.number)}
                disabled={!isAccessible}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : isAccessible
                    ? 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${isCurrent ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                    {step.number}
                  </span>
                )}
                {step.short}
                {editorsOnStep.length > 0 && (
                  <span className="ml-0.5 flex -space-x-1">
                    {editorsOnStep.slice(0, 2).map(p => (
                      <span
                        key={p.userId}
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-white text-white text-xs flex items-center justify-center font-bold"
                        style={{ backgroundColor: p.color, fontSize: '7px' }}
                        title={`${p.fullName} is here`}
                      >
                        {getInitials(p.fullName)}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 min-h-0 flex-1">
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 overflow-y-auto">
            <CurrentStep onGetFeedback={handleGetFeedback} onFieldsChange={handleFieldsChange} />
          </div>

          <div className="hidden lg:flex flex-col gap-3 w-80 xl:w-96 flex-shrink-0">
            {proposal && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowTeamPanel(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Team</span>
                    {activeCollaborators.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        {activeCollaborators.length + 1}
                      </span>
                    )}
                    {presenceList.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {presenceList.length} online
                      </span>
                    )}
                  </div>
                  {showTeamPanel ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {showTeamPanel && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <ProposalCollaboratorsPanel />
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ minHeight: '500px', maxHeight: 'calc(100vh - 280px)' }}>
              <AIChatPanel
                proposalId={proposal?.id ?? null}
                sectionType={currentSectionKey}
                fieldValues={fieldValues}
                onGetFeedbackRef={handleGetFeedbackRef}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function ProposalWizard() {
  return (
    <ProposalWizardProvider>
      <WizardContent />
    </ProposalWizardProvider>
  );
}
