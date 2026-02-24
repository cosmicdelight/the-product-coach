import { BookOpen, Compass, Building2, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemoTutorial } from '../../contexts/DemoTutorialContext';

export function DemoWelcomeModal() {
  const { isDemo, showWelcomeModal, startTutorial, dismissWelcomeModal } = useDemoTutorial();
  const navigate = useNavigate();

  if (!isDemo || !showWelcomeModal) return null;

  const handleExploreOnMyOwn = () => {
    dismissWelcomeModal();
    navigate('/officer/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[9500] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400" />

        <div className="p-7">
          {/* Persona card */}
          <div className="flex items-center gap-3 mb-6 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              AT
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Alex Tan</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="h-3 w-3" />
                  Senior Policy Officer
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="h-3 w-3" />
                  Ministry of Manpower
                </span>
              </div>
            </div>
            <span className="ml-auto text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
              Demo Account
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Product Coach</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            You're exploring a live demo as Alex Tan, a Senior Policy Officer working on a proposal to digitise the leave management process.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            The proposal is pre-filled with realistic content so you can see every feature in context. Nothing you do here affects real data — feel free to explore freely.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={startTutorial}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              <BookOpen className="h-4 w-4" />
              Start Guided Tutorial
            </button>
            <button
              onClick={handleExploreOnMyOwn}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
            >
              <Compass className="h-4 w-4" />
              Explore on My Own
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
