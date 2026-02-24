import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoTutorial } from '../../contexts/DemoTutorialContext';
import { TooltipPosition } from '../../config/tutorialSteps';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipCoords {
  top: number;
  left: number;
  arrowSide: TooltipPosition | null;
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 180;
const PADDING = 16;
const SPOTLIGHT_PAD = 12;

function computeTooltipCoords(rect: Rect, position: TooltipPosition): TooltipCoords {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (position === 'center' || (rect.width === 0 && rect.height === 0)) {
    return {
      top: vh / 2 - TOOLTIP_HEIGHT / 2,
      left: vw / 2 - TOOLTIP_WIDTH / 2,
      arrowSide: null,
    };
  }

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const candidates: { side: TooltipPosition; top: number; left: number }[] = [
    {
      side: 'bottom',
      top: rect.top + rect.height + SPOTLIGHT_PAD + PADDING,
      left: Math.min(Math.max(cx - TOOLTIP_WIDTH / 2, PADDING), vw - TOOLTIP_WIDTH - PADDING),
    },
    {
      side: 'top',
      top: rect.top - TOOLTIP_HEIGHT - SPOTLIGHT_PAD - PADDING,
      left: Math.min(Math.max(cx - TOOLTIP_WIDTH / 2, PADDING), vw - TOOLTIP_WIDTH - PADDING),
    },
    {
      side: 'right',
      top: Math.min(Math.max(cy - TOOLTIP_HEIGHT / 2, PADDING), vh - TOOLTIP_HEIGHT - PADDING),
      left: rect.left + rect.width + SPOTLIGHT_PAD + PADDING,
    },
    {
      side: 'left',
      top: Math.min(Math.max(cy - TOOLTIP_HEIGHT / 2, PADDING), vh - TOOLTIP_HEIGHT - PADDING),
      left: rect.left - TOOLTIP_WIDTH - SPOTLIGHT_PAD - PADDING,
    },
  ];

  const preferred = candidates.find(c => c.side === position);
  if (preferred) {
    const { top, left } = preferred;
    const fits =
      top >= PADDING &&
      top + TOOLTIP_HEIGHT <= vh - PADDING &&
      left >= PADDING &&
      left + TOOLTIP_WIDTH <= vw - PADDING;
    if (fits) return { top, left, arrowSide: position };
  }

  for (const c of candidates) {
    const { top, left } = c;
    const fits =
      top >= PADDING &&
      top + TOOLTIP_HEIGHT <= vh - PADDING &&
      left >= PADDING &&
      left + TOOLTIP_WIDTH <= vw - PADDING;
    if (fits) return { top, left, arrowSide: c.side };
  }

  return {
    top: vh / 2 - TOOLTIP_HEIGHT / 2,
    left: vw / 2 - TOOLTIP_WIDTH / 2,
    arrowSide: null,
  };
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

export function TutorialOverlay() {
  const {
    tutorialActive,
    currentStep,
    totalSteps,
    steps,
    targets,
    demoProposalId,
    nextStep,
    prevStep,
    skipTutorial,
  } = useDemoTutorial();

  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const { w: _w, h: _h } = useWindowSize();
  const navigatedRef = useRef<number | null>(null);

  const step = steps[currentStep];

  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = targets.get(step.tutorialId);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step, targets]);

  useEffect(() => {
    measureTarget();
  }, [measureTarget, currentStep]);

  useEffect(() => {
    if (!tutorialActive) return;
    const interval = setInterval(measureTarget, 200);
    return () => clearInterval(interval);
  }, [tutorialActive, measureTarget]);

  useEffect(() => {
    if (!tutorialActive || !step) return;
    if (navigatedRef.current === currentStep) return;

    const targetEl = targets.get(step.tutorialId);
    if (targetEl) return;

    const stepRoute = step.route;
    const isOnCorrectPage = stepRoute === '/proposals'
      ? location.pathname.includes('/proposals')
      : location.pathname.startsWith(stepRoute);

    if (!isOnCorrectPage) {
      navigatedRef.current = currentStep;
      if (stepRoute === '/proposals' && demoProposalId) {
        navigate(`/proposals/${demoProposalId}/edit`);
      } else {
        navigate(stepRoute);
      }
    }
  }, [tutorialActive, currentStep, step, targets, location.pathname, navigate, demoProposalId]);

  if (!tutorialActive || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const rect = targetRect ?? { top: 0, left: 0, width: 0, height: 0 };
  const hasTarget = rect.width > 0 && rect.height > 0;

  const spotlight = hasTarget
    ? {
        top: rect.top - SPOTLIGHT_PAD,
        left: rect.left - SPOTLIGHT_PAD,
        width: rect.width + SPOTLIGHT_PAD * 2,
        height: rect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  const { top: ttTop, left: ttLeft, arrowSide } = computeTooltipCoords(rect, step.tooltipPosition);

  return (
    <div className="fixed inset-0 z-[9000] pointer-events-none">
      {/* Backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={undefined}
        style={{ cursor: 'default' }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width={vw} height={vh} fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={10}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width={vw}
          height={vh}
          fill="rgba(0,0,0,0.55)"
          mask="url(#tutorial-spotlight-mask)"
        />
        {spotlight && (
          <rect
            x={spotlight.left}
            y={spotlight.top}
            width={spotlight.width}
            height={spotlight.height}
            rx={10}
            fill="none"
            stroke="rgba(59,130,246,0.8)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: ttTop, left: ttLeft, width: TOOLTIP_WIDTH }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={skipTutorial}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              title="Skip tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pb-3">
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">{step.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{step.body}</p>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Loading indicator while navigating to the target page */}
          {!hasTarget && (
            <div className="mx-4 mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-blue-700">Taking you to the right page...</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 pb-4 gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all ${
                    i === currentStep
                      ? 'w-4 h-1.5 bg-blue-500'
                      : i < currentStep
                      ? 'w-1.5 h-1.5 bg-blue-300'
                      : 'w-1.5 h-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              {currentStep < totalSteps - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Arrow pointer */}
          {arrowSide && hasTarget && (
            <ArrowPointer
              side={arrowSide}
              tooltipLeft={ttLeft}
              tooltipTop={ttTop}
              tooltipWidth={TOOLTIP_WIDTH}
              spotlightCx={spotlight ? spotlight.left + spotlight.width / 2 : 0}
              spotlightCy={spotlight ? spotlight.top + spotlight.height / 2 : 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowPointer({
  side,
  tooltipLeft,
  tooltipTop,
  tooltipWidth,
  spotlightCx,
  spotlightCy,
}: {
  side: TooltipPosition;
  tooltipLeft: number;
  tooltipTop: number;
  tooltipWidth: number;
  spotlightCx: number;
  spotlightCy: number;
}) {
  const tooltipMidX = tooltipLeft + tooltipWidth / 2;
  const tooltipMidY = tooltipTop + TOOLTIP_HEIGHT / 2;

  if (side === 'bottom') {
    return (
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: -8 }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid white',
            filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.1))',
          }}
        />
      </div>
    );
  }
  if (side === 'top') {
    return (
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -8 }}>
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid white',
          }}
        />
      </div>
    );
  }
  if (side === 'right') {
    return (
      <div className="absolute -left-2 top-1/2 -translate-y-1/2">
        <div
          className="w-0 h-0"
          style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '8px solid white',
          }}
        />
      </div>
    );
  }
  if (side === 'left') {
    return (
      <div className="absolute -right-2 top-1/2 -translate-y-1/2">
        <div
          className="w-0 h-0"
          style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '8px solid white',
          }}
        />
      </div>
    );
  }

  void tooltipMidX;
  void tooltipMidY;
  void spotlightCx;
  void spotlightCy;

  return null;
}
