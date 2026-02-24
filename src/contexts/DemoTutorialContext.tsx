import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { TUTORIAL_STEPS } from '../config/tutorialSteps';

async function fetchDemoProposalId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('proposals')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

const STORAGE_KEY_PREFIX = 'demo_tutorial_';

interface TutorialTargetEntry {
  tutorialId: string;
  el: HTMLElement;
}

interface DemoTutorialContextType {
  isDemo: boolean;
  tutorialActive: boolean;
  showWelcomeModal: boolean;
  showCompleteModal: boolean;
  currentStep: number;
  totalSteps: number;
  steps: typeof TUTORIAL_STEPS;
  targets: Map<string, HTMLElement>;
  demoProposalId: string | null;
  requestedWizardStep: number | null;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  dismissWelcomeModal: () => void;
  dismissCompleteModal: () => void;
  resetDemo: () => Promise<void>;
  registerTarget: (entry: TutorialTargetEntry) => void;
  unregisterTarget: (tutorialId: string) => void;
}

const DemoTutorialContext = createContext<DemoTutorialContextType | undefined>(undefined);

export function DemoTutorialProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const isDemo = !!(profile?.is_demo);

  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  const [tutorialActive, setTutorialActive] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targets, setTargets] = useState<Map<string, HTMLElement>>(new Map());
  const [demoProposalId, setDemoProposalId] = useState<string | null>(null);
  const [requestedWizardStep, setRequestedWizardStep] = useState<number | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!isDemo || !user) return;
    fetchDemoProposalId(user.id).then(setDemoProposalId);
  }, [isDemo, user]);

  useEffect(() => {
    if (!tutorialActive) return;
    const step = TUTORIAL_STEPS[currentStep];
    setRequestedWizardStep(step?.wizardStep ?? null);
  }, [tutorialActive, currentStep]);

  useEffect(() => {
    if (!isDemo || !storageKey || initRef.current) return;
    initRef.current = true;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tutorialCompleted) return;
        if (parsed.tutorialActive) {
          setCurrentStep(parsed.currentStep ?? 0);
          setTutorialActive(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    setShowWelcomeModal(true);
  }, [isDemo, storageKey]);

  const persist = useCallback((active: boolean, step: number) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tutorialActive: active, currentStep: step }));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const startTutorial = useCallback(() => {
    setShowWelcomeModal(false);
    setCurrentStep(0);
    setTutorialActive(true);
    persist(true, 0);
  }, [persist]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= TUTORIAL_STEPS.length) {
        setTutorialActive(false);
        setShowCompleteModal(true);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify({ tutorialCompleted: true }));
          } catch {
            // ignore
          }
        }
        return prev;
      }
      persist(true, next);
      return next;
    });
  }, [persist, storageKey]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(0, prev - 1);
      persist(true, next);
      return next;
    });
  }, [persist]);

  const skipTutorial = useCallback(() => {
    setTutorialActive(false);
    setShowWelcomeModal(false);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ tutorialCompleted: true }));
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  const completeTutorial = useCallback(() => {
    setTutorialActive(false);
    setShowCompleteModal(true);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ tutorialCompleted: true }));
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  const dismissWelcomeModal = useCallback(() => {
    setShowWelcomeModal(false);
  }, []);

  const dismissCompleteModal = useCallback(() => {
    setShowCompleteModal(false);
  }, []);

  const resetDemo = useCallback(async () => {
    if (!user) return;
    await supabase.rpc('reset_demo_proposal', { p_demo_user_id: user.id });
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    initRef.current = false;
    setTutorialActive(false);
    setShowWelcomeModal(true);
    setCurrentStep(0);
    fetchDemoProposalId(user.id).then(setDemoProposalId);
  }, [user, storageKey]);

  const registerTarget = useCallback((entry: TutorialTargetEntry) => {
    setTargets(prev => {
      const next = new Map(prev);
      next.set(entry.tutorialId, entry.el);
      return next;
    });
  }, []);

  const unregisterTarget = useCallback((tutorialId: string) => {
    setTargets(prev => {
      const next = new Map(prev);
      next.delete(tutorialId);
      return next;
    });
  }, []);

  return (
    <DemoTutorialContext.Provider value={{
      isDemo,
      tutorialActive,
      showWelcomeModal,
      showCompleteModal,
      currentStep,
      totalSteps: TUTORIAL_STEPS.length,
      steps: TUTORIAL_STEPS,
      targets,
      demoProposalId,
      requestedWizardStep,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      completeTutorial,
      dismissWelcomeModal,
      dismissCompleteModal,
      resetDemo,
      registerTarget,
      unregisterTarget,
    }}>
      {children}
    </DemoTutorialContext.Provider>
  );
}

export function useDemoTutorial() {
  const ctx = useContext(DemoTutorialContext);
  if (!ctx) throw new Error('useDemoTutorial must be used within DemoTutorialProvider');
  return ctx;
}
