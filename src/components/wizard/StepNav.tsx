import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { TutorialTarget } from '../tutorial/TutorialTarget';

interface Props {
  currentStep: number;
  canProceed: boolean;
  saving: boolean;
  onSave: () => void;
  onSaveAndContinue: () => void;
  onBack: () => void;
  isLastStep?: boolean;
  submitLabel?: string;
}

export function StepNav({ currentStep, canProceed, saving, onSave, onSaveAndContinue, onBack, isLastStep, submitLabel }: Props) {
  return (
    <TutorialTarget tutorialId="wizard-step-nav" className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
      <div className="flex items-center gap-3">
        {currentStep > 1 && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving || !canProceed}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
      <button
        onClick={onSaveAndContinue}
        disabled={saving || !canProceed}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm ${
          isLastStep
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {saving ? 'Saving...' : (submitLabel || 'Save & Continue')}
        {!isLastStep && <ChevronRight className="h-4 w-4" />}
      </button>
    </TutorialTarget>
  );
}
