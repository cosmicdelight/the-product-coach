import { useState } from 'react';
import { RotateCcw, PlayCircle, FlaskConical } from 'lucide-react';
import { useDemoTutorial } from '../../contexts/DemoTutorialContext';

export function DemoBanner() {
  const { isDemo, startTutorial, resetDemo } = useDemoTutorial();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (!isDemo) return null;

  const handleReset = async () => {
    setResetting(true);
    setResetDone(false);
    await resetDemo();
    setResetting(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="w-full bg-gray-900 text-white px-4 py-2 flex items-center justify-between gap-4 text-xs z-[8000] relative">
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
        <span className="text-gray-300 font-medium truncate">Demo Mode</span>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className="hidden sm:inline text-gray-400 truncate">Logged in as Alex Tan (demo@productcoach.app)</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {resetDone && (
          <span className="text-green-400 text-xs font-medium">Reset complete</span>
        )}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-gray-200 disabled:opacity-50"
        >
          <RotateCcw className={`h-3 w-3 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting...' : 'Reset Data'}
        </button>
        <button
          onClick={startTutorial}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium"
        >
          <PlayCircle className="h-3 w-3" />
          Restart Tutorial
        </button>
      </div>
    </div>
  );
}
