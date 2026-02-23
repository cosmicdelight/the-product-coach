import { SectionType } from '../types/database';
import { SectionChatConfig } from '../types/chat';

export const SECTION_CHAT_CONFIG: Record<SectionType, SectionChatConfig> = {
  problem_identification: {
    welcomeMessage: "I'm your AI coach for Problem Identification. Fill in the three fields — problem statement, who is affected, and current impact — then click **Get Feedback** and I'll score your inputs and suggest improvements.",
    quickPrompts: [
      { label: 'Show me a strong example', message: 'Can you show me an example of a strong problem statement for a Singapore public service proposal?' },
      { label: 'How specific should impact be?', message: 'How specific and quantified does the Current Impact field need to be?' },
      { label: 'What makes a weak problem statement?', message: 'What are the most common weaknesses in a problem statement that reviewers flag?' },
      { label: 'Coherence check tips', message: 'How do I make sure my three fields are coherent with each other?' },
    ],
    fieldLabels: {
      problemStatement: 'Problem Statement',
      affectedUsers: 'Who is Affected',
      currentImpact: 'Current Impact',
    },
  },
  problem_validation: {
    welcomeMessage: "I'm your AI coach for Problem Validation. Fill in all four fields and click **Get Feedback** — I'll assess how well you've quantified and evidenced the problem, and score it on the Launchpad rubric.",
    quickPrompts: [
      { label: 'How do I quantify impact?', message: 'How should I quantify the impact in the Impact Assessment field?' },
      { label: 'What counts as urgency?', message: 'What makes a strong Urgency & Priority section? What external drivers should I mention?' },
      { label: 'Workaround examples', message: 'Can you show me examples of well-described existing workarounds?' },
      { label: 'Stakeholder depth tips', message: 'How detailed do I need to be in the Key Stakeholders field?' },
    ],
    fieldLabels: {
      impactAssessment: 'Impact Assessment',
      stakeholders: 'Key Stakeholders',
      existingWorkarounds: 'Existing Workarounds',
      urgency: 'Urgency & Priority',
    },
  },
  user_research: {
    welcomeMessage: "I'm your AI coach for User Research. Once you've filled in your target users, interview questions, findings, and user needs — click **Get Feedback** for a scored review.",
    quickPrompts: [
      { label: 'Strong interview questions', message: 'What makes a strong set of user interview questions for this section?' },
      { label: 'How many interviews?', message: 'How many user interviews do I need before this section is considered validated?' },
      { label: 'How to write user needs', message: 'How should I write prioritised user needs — what format works best for Launchpad?' },
      { label: 'Research findings example', message: 'Can you show me an example of a well-written Research Findings entry?' },
    ],
    fieldLabels: {
      targetUsers: 'Target User Groups',
      interviewQuestions: 'Interview Questions',
      researchFindings: 'Research Findings',
      userNeeds: 'Prioritised User Needs',
    },
  },
  opportunity_framing: {
    welcomeMessage: "I'm your AI coach for Opportunity Framing. Fill in your HMW statement, root causes, opportunity scope, and design constraints — then click **Get Feedback** for a scored review.",
    quickPrompts: [
      { label: 'Show me a strong HMW', message: 'Can you show me a strong How Might We statement for a Singapore public service context?' },
      { label: 'What makes constraints strong?', message: 'What makes a strong Design Constraints section? What types should I include?' },
      { label: 'Root cause analysis tips', message: 'How do I identify root causes rather than symptoms? Can you walk me through the 5 Whys?' },
      { label: 'Scope boundary examples', message: 'How do I write a clear opportunity scope with explicit boundaries?' },
    ],
    fieldLabels: {
      hmwStatement: 'HMW Statement',
      rootCauses: 'Root Cause(s)',
      opportunityScope: 'Opportunity Scope',
      designConstraints: 'Design Constraints',
    },
  },
  success_definition: {
    welcomeMessage: "I'm your AI coach for Success Definition. Fill in all four fields — desired outcomes, what done well looks like, early signals, and out of scope — then click **Get Feedback**.",
    quickPrompts: [
      { label: 'Outcome vs output', message: 'What is the difference between an outcome and an output? How do I make sure my desired outcomes are outcome-focused?' },
      { label: 'Early signals examples', message: 'Can you give me examples of strong early signals of success for a public service innovation proposal?' },
      { label: 'How specific for out of scope?', message: 'How specific should the Explicitly Out of Scope section be?' },
      { label: '"Done well" framing', message: 'How should I frame the "What does done well look like?" field?' },
    ],
    fieldLabels: {
      desiredOutcomes: 'Desired Outcomes',
      doneWell: 'What "Done Well" Looks Like',
      earlySignals: 'Early Signals of Success',
      outOfScope: 'Explicitly Out of Scope',
    },
  },
  executive_summary: {
    welcomeMessage: "I'm your AI coach for the Executive Summary. You can use the **Generate with AI** button to draft your summary from all completed sections, then click **Get Feedback** here for a review.",
    quickPrompts: [
      { label: 'What should the summary cover?', message: 'What should a strong executive summary cover for a Launchpad proposal?' },
      { label: 'Length and tone', message: 'What is the right length and tone for an executive summary for Launchpad reviewers?' },
      { label: 'Common mistakes', message: 'What are the most common mistakes in executive summaries that reviewers flag?' },
    ],
    fieldLabels: {
      summary: 'Executive Summary',
    },
  },
};
