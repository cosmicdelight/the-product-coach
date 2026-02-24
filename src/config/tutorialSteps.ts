export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TutorialStep {
  id: string;
  tutorialId: string;
  route: string;
  wizardStep?: number;
  title: string;
  body: string;
  tooltipPosition: TooltipPosition;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    tutorialId: 'dashboard-welcome',
    route: '/officer/dashboard',
    title: 'Welcome to your Dashboard',
    body: "This is your home base. You can see all your proposals, track their status, and jump into any open events accepting submissions. Everything you need is right here.",
    tooltipPosition: 'bottom',
  },
  {
    id: 'proposal-list',
    tutorialId: 'dashboard-proposal-list',
    route: '/officer/dashboard',
    title: 'Your Proposals',
    body: "Each card shows a proposal with its current status — Draft, Submitted, Under Review, Approved, or Rejected. You can filter by status using the tabs above the list.",
    tooltipPosition: 'top',
  },
  {
    id: 'new-proposal-btn',
    tutorialId: 'dashboard-new-proposal',
    route: '/officer/dashboard',
    title: 'Start a New Proposal',
    body: "Click this button to open the Proposal Wizard. The wizard walks you through 6 structured steps — from defining the problem right through to writing your executive summary.",
    tooltipPosition: 'bottom',
  },
  {
    id: 'wizard-problem-field',
    tutorialId: 'wizard-problem-statement',
    route: '/proposals',
    wizardStep: 1,
    title: 'Define Your Problem',
    body: "Start by describing the problem in plain language. Be specific — include who is affected, how often, and what the measurable impact is. The more concrete, the stronger your proposal.",
    tooltipPosition: 'right',
  },
  {
    id: 'wizard-ai-chat',
    tutorialId: 'wizard-ai-chat-panel',
    route: '/proposals',
    wizardStep: 1,
    title: 'Your AI Coach',
    body: "This panel is your personal AI coach. It analyses what you've written and gives structured feedback — pointing out gaps, suggesting improvements, and asking questions to help you think deeper.",
    tooltipPosition: 'left',
  },
  {
    id: 'wizard-feedback-btn',
    tutorialId: 'wizard-get-feedback-btn',
    route: '/proposals',
    wizardStep: 1,
    title: 'Get Instant Feedback',
    body: "Click here to get AI-powered feedback on your current section. The coach will review your content against best-practice criteria and suggest specific improvements.",
    tooltipPosition: 'left',
  },
  {
    id: 'wizard-step-nav',
    tutorialId: 'wizard-step-nav',
    route: '/proposals',
    wizardStep: 1,
    title: 'Save & Move Forward',
    body: "When you're happy with a section, click \"Save & Continue\" to save your progress and move to the next step. You can always come back to edit any section later.",
    tooltipPosition: 'top',
  },
  {
    id: 'wizard-executive-summary',
    tutorialId: 'wizard-executive-summary',
    route: '/proposals',
    wizardStep: 6,
    title: 'Executive Summary',
    body: "The final step is the Executive Summary — a concise overview of your entire proposal. The AI coach can draft this for you based on all the sections you've already completed.",
    tooltipPosition: 'right',
  },
  {
    id: 'wizard-submit',
    tutorialId: 'wizard-submit-btn',
    route: '/proposals',
    wizardStep: 6,
    title: 'Submit Your Proposal',
    body: "Once all sections are complete, you can submit your proposal. It will go to the event organisers for review. You'll receive notifications on every status change — revision requests, approvals, and more.",
    tooltipPosition: 'top',
  },
];
