import { useEffect, useRef } from 'react';
import { useDemoTutorial } from '../../contexts/DemoTutorialContext';

interface Props {
  tutorialId: string;
  children: React.ReactNode;
  className?: string;
  as?: string;
}

export function TutorialTarget({ tutorialId, children, className, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { isDemo, registerTarget, unregisterTarget } = useDemoTutorial();

  useEffect(() => {
    if (!isDemo || !ref.current) return;
    registerTarget({ tutorialId, el: ref.current });
    return () => unregisterTarget(tutorialId);
  }, [isDemo, tutorialId, registerTarget, unregisterTarget]);

  const Comp = Tag as React.ElementType;

  return (
    <Comp ref={ref} className={className}>
      {children}
    </Comp>
  );
}
