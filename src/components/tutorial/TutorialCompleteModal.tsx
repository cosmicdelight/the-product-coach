import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Compass } from 'lucide-react';
import { useDemoTutorial } from '../../contexts/DemoTutorialContext';

export function TutorialCompleteModal() {
  const { isDemo, showCompleteModal, dismissCompleteModal } = useDemoTutorial();

  if (!isDemo || !showCompleteModal) return null;

  return (
    <div className="fixed inset-0 z-[9500] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />

        <div className="p-7 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Tutorial Complete!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            You've seen the full proposal journey — from identifying a problem to submitting a structured, evidence-backed proposal for review.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-7">
            Create your free account to start your own proposals, collaborate with colleagues, and get AI coaching on every step.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
              onClick={dismissCompleteModal}
            >
              Create Your Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={dismissCompleteModal}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
            >
              <Compass className="h-4 w-4" />
              Keep Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
