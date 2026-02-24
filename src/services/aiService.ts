import { SectionType } from '../types/database';
import { FeedbackPayload, ChatMessageContent } from '../types/chat';
import { captureError } from './errorHandling';
import { supabase } from '../lib/supabase';

interface AIPromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
}

const SECTION_PROMPTS: Record<SectionType, AIPromptConfig> = {
  problem_identification: {
    systemPrompt: 'You are an expert product coach helping public officers write strong, fundable proposals. Give direct, specific feedback — not generic advice.',
    userPromptTemplate: 'Review these three fields together and give a combined assessment:\n\nProblem Statement: "{input}"\nWho is Affected: "{affectedUsers}"\nCurrent Impact: "{currentImpact}"\n\nAssess: (1) Are the three fields consistent and coherent with each other? (2) Is the impact specific and quantified, or still vague? (3) What is the single most important thing to strengthen? Be concise and specific — point to actual words or phrases that need improvement, not general tips.',
  },
  problem_validation: {
    systemPrompt: 'You are a product coach specialising in public sector innovation. Analyse inputs critically, reference public innovation best practices, quantify everything, and suggest evidence-based improvements. Be direct and specific — no generic advice.',
    userPromptTemplate: 'Critically analyse this Problem Validation submission:\n\nImpact Assessment: "{input}"\nKey Stakeholders: "{stakeholders}"\nExisting Workarounds: "{existingWorkarounds}"\nUrgency & Priority: "{urgency}"\n\nReturn a JSON object with: score (1-10), scoreLabel, strengths (array), redFlags (array), suggestions (array), followUpQuestions (array), nextSteps (array). Be specific to the public service context.',
  },
  user_research: {
    systemPrompt: 'You are a user research expert.',
    userPromptTemplate: 'Generate 10 user interview questions for this problem: "{input}". Cover pain points, workarounds, and desired outcomes.',
  },
  opportunity_framing: {
    systemPrompt: 'You are a product design coach specialising in public sector innovation. Help teams frame problems as design opportunities using the "How Might We" method. Be direct, specific, and grounded in public sector programme norms.',
    userPromptTemplate: 'Review this Opportunity Framing submission:\n\nHow Might We Statement: "{input}"\nRoot Causes: "{rootCauses}"\nOpportunity Scope: "{opportunityScope}"\nDesign Constraints: "{designConstraints}"\n\nReturn a JSON object with: score (1-10), scoreLabel, strengths (array), redFlags (array), suggestions (array), followUpQuestions (array), nextSteps (array). Assess HMW quality, root cause specificity, scope discipline, and constraint awareness.',
  },
  success_definition: {
    systemPrompt: 'You are a product outcomes coach specialising in public sector innovation. Help teams define success in terms of user and societal outcomes, not outputs or features. Be direct and specific.',
    userPromptTemplate: 'Review this Success Definition submission:\n\nDesired Outcomes: "{input}"\nWhat "Done Well" Looks Like: "{doneWell}"\nEarly Signals of Success: "{earlySignals}"\nExplicitly Out of Scope: "{outOfScope}"\n\nReturn a JSON object with: score (1-10), scoreLabel, strengths (array), redFlags (array), suggestions (array), followUpQuestions (array), nextSteps (array). Assess outcome orientation, observability, measurability, scope discipline, and alignment to problem statement.',
  },
  executive_summary: {
    systemPrompt: `You are a senior product coach writing a funding-ready executive summary for public-sector innovation reviewers.

REFERENCE EXAMPLE — match this tone, sentence rhythm, and level of detail exactly:

---
Public officers across the civil service often have strong ideas for improving services and internal processes but struggle to turn those ideas into clear, fundable product proposals. Many spend 20–40 hours over several weeks drafting submissions and then rely on about 1.5 days of coaching per hackathon team to get them into shape. This creates a bottleneck for innovation enablers, who must spend significant time fixing proposal basics instead of focusing on which ideas should be backed.

This initiative focuses on helping public officers turn rough innovation ideas into well‑structured, evidence‑based product proposals so that promising projects can be funded and scaled across the public service. The initial scope is officers who submit ideas through innovation programmes, hackathons, or internal funding calls in 2–3 pilot agencies that run frequent innovation programmes, with the intent to generalise successful patterns across government. Any solution will need to comply with existing security and data policies, integrate or coexist with current programme tooling, respect officers' limited time through micro‑learning formats, and remain feasible for a small innovation team to maintain.

Success would mean public officers can reliably turn raw ideas into fundable, user‑centred proposals in weeks instead of months, and innovation enablers receive higher‑quality submissions that are faster to review and easier to fund. Early signs that we are on the right track include a 30–40% reduction in time spent on proposal preparation per team, clearer problem statements and MVP definitions in programme submissions, and more teams progressing from ideation to POC or pilot without intensive one‑to‑one coaching. This work is intentionally scoped to the front‑end journey from idea to strong, fundable proposal; it does not seek to change funding governance, replace existing programme platforms, or solve downstream delivery challenges.

We recommend proceeding to a focused discovery sprint with 2–3 pilot agencies to validate root causes and test early solution concepts, with a view to scoping a proof‑of‑concept for the next funding cycle.
---

OUTPUT REQUIREMENTS
- Plain prose only: 3–4 paragraphs, 200–300 words total.
- No bullet points, numbered lists, headings, or labels of any kind.
- No meta-text referencing forms, wizards, sections, or the writing process.
- Write in third person or neutral voice, as if this text goes directly into a funding paper.

PARAGRAPH STRUCTURE (do not label paragraphs)
1. Problem, who is affected, and current cost or friction — open with the problem and its human context, then quantify the friction or cost it creates, as the reference example does in its first two sentences.
2. Opportunity framing, scope, and constraints — state what this initiative aims to achieve and for whom, then weave the key constraints into the same paragraph as subordinate clauses, the way the reference example does ("Any solution will need to...").
3. Success and what is out of scope — describe what success looks like for users and reviewers, name early signals as concrete indicators, then close the paragraph by stating what this work deliberately does not address, using a construction like "it does not seek to..." rather than a template phrase.
4. Recommendation — one or two sentences naming a concrete next step (e.g., a discovery sprint with named pilot agencies) and the intended output (e.g., scoping a proof-of-concept for the next funding cycle).

STYLE RULES — follow these without exception
- Never use these template phrases: "Early signals of progress would include", "The proposal does not seek to address", "Solutions will need to work within constraints including", "Key stakeholders include", "This challenge directly affects", "When done well,", "Success would see".
- Use smooth connectors ("and", "while", "so that", "with the intent to") instead of starting consecutive sentences with the same subject.
- After introducing a group (e.g., "public officers"), refer back to them with a pronoun or short noun ("they", "these officers", "this group") rather than repeating the full phrase. Do not assume a specific country — write for a general public sector audience.
- Preserve specific numbers, percentages, named programmes, and named agencies from the inputs — do not invent figures.
- Strip any label prefixes from input field values (e.g., "Focus on:", "Primary:", "Any solution must:", "Key constraints include:", "This proposal is explicitly scoped to exclude:") and rephrase the underlying content as natural prose.
- If an input field is empty or contains only a label with no content, omit that concept entirely.
- Before outputting, silently check for: duplicated words or phrases, double punctuation (.., ?., ,,), and sentence fragments. Fix any found.
- Never end with an ellipsis or placeholder. Every sentence must be complete.`,
    userPromptTemplate: `Write a funding-ready executive summary using the raw inputs below. Use the reference example in the system prompt as your style guide — match its sentence rhythm, connectors, and level of specificity. Synthesise the inputs into cohesive prose; do not copy field values verbatim.

PROBLEM IDENTIFICATION
Problem statement: {problemStatement}
Who is affected: {affectedUsers}
Current impact: {currentImpact}

PROBLEM VALIDATION
Impact assessment: {impactAssessment}
Key stakeholders: {stakeholders}
Existing workarounds: {existingWorkarounds}
Urgency and priority: {urgency}

USER RESEARCH
Target users: {targetUsers}
Research findings: {researchFindings}
Prioritised user needs: {userNeeds}

OPPORTUNITY FRAMING
How Might We statement: {hmwStatement}
Root causes: {rootCauses}
Opportunity scope: {opportunityScope}
Design constraints: {designConstraints}

SUCCESS DEFINITION
Desired outcomes: {desiredOutcomes}
What "done well" looks like: {doneWell}
Early signals of success: {earlySignals}
Out of scope: {outOfScope}

Write 3–4 paragraphs of continuous prose, 200–300 words total. Weave numbers and specifics into sentences naturally. Open with the problem and who bears it, then move to the opportunity and constraints, then success and scope boundaries, then a concrete recommendation. No preamble, no labels, no sign-off.`,
  },
};

const FALLBACKS: Record<SectionType, string> = {
  problem_identification: '',
  problem_validation: 'Validate your problem by quantifying impact (time, cost, number of users), identifying current workarounds, and assessing urgency.',
  user_research: 'Key questions: What challenges do you face? How do you handle this today? What would an ideal solution look like? What would prevent you from adopting a new tool?',
  opportunity_framing: 'A strong HMW statement: names a specific audience, describes the gap or tension, and avoids implying a solution. Example: "How might we help public officers articulate a compelling problem statement without specialist support?"',
  success_definition: 'Define success in terms of observable changes for users — not features delivered. Ask: "What would be different in the world if this problem were solved?"',
  executive_summary: '',
};

export interface ValidationCoachResult {
  __type: 'validation_coach';
  score: number;
  scoreLabel: string;
  strengths: string[];
  redFlags: string[];
  suggestions: string[];
  followUpQuestions: string[];
  nextSteps: string[];
}

interface ScoringSignals {
  hasUserCount: boolean;
  hasLargeNumber: boolean;
  hasTAMReference: boolean;
  stakeholderDepth: number;
  hasTimeInWorkaround: boolean;
  hasDetailedWorkaround: boolean;
  urgencyDepth: number;
  hasInterviewEvidence: boolean;
  hasSourceCitation: boolean;
}

function extractScoringSignals(
  impact: string,
  stakeholders: string,
  workarounds: string,
  urgency: string
): ScoringSignals {
  const numbers = impact.match(/\d[\d,.]*/g) || [];
  const allText = [impact, stakeholders, workarounds, urgency].join(' ');

  return {
    hasUserCount: /\d[\d,]+/.test(impact),
    hasLargeNumber: numbers.some(n => parseInt(n.replace(/,/g, ''), 10) >= 1000),
    hasTAMReference: /total.*officer|public.*service.*workforce|all\s+officer|workforce\s+size|\d{4,}.*officer|officer.*\d{4,}/i.test(impact + stakeholders),
    stakeholderDepth: ['primary', 'secondary', 'officer', 'organiser', 'organizer', 'ministry', 'agency', 'programme', 'department', 'division'].filter(
      w => stakeholders.toLowerCase().includes(w)
    ).length,
    hasTimeInWorkaround: /hour|day|week|month|manual|1-on-1|workshop|waitlist/i.test(workarounds),
    hasDetailedWorkaround: workarounds.trim().length > 30,
    urgencyDepth: ['oecd', 'digitalisation', 'digitalization', 'policy', 'budget', 'hackathon', 'programme', 'mvp', 'funded', 'deadline', 'mandate'].filter(
      w => urgency.toLowerCase().includes(w)
    ).length,
    hasInterviewEvidence: /interview|surveyed|spoke with|spoke to|feedback from|validated with|\d+\s*(user|officer|organiser|organizer|respondent|participant)/i.test(allText),
    hasSourceCitation: /source:|cited|oecd|statistics|survey|data from|based on|report|research/i.test(impact),
  };
}

function countRedFlags(signals: ScoringSignals, impact: string): number {
  let flags = 0;
  const impactNumbers = impact.match(/\d[\d,.]*/g) || [];
  const hasSmallCount = impactNumbers.some(n => {
    const v = parseInt(n.replace(/,/g, ''), 10);
    return v > 0 && v < 1000;
  });

  if (!signals.hasUserCount) flags += 1;
  else if (hasSmallCount && !signals.hasLargeNumber) flags += 1;
  if (!signals.hasTAMReference && signals.hasLargeNumber) flags += 1;
  if (!signals.hasTimeInWorkaround) flags += 1;
  if (!signals.hasInterviewEvidence) flags += 1;
  if (!signals.hasSourceCitation) flags += 1;

  return flags;
}

function scoreProblemValidation(
  impact: string,
  stakeholders: string,
  workarounds: string,
  urgency: string
): number {
  const s = extractScoringSignals(impact, stakeholders, workarounds, urgency);
  let score = 0;

  if (s.hasUserCount) score += 2;
  if (s.hasLargeNumber) score += 1;
  if (s.hasTAMReference) score += 1;
  if (s.stakeholderDepth >= 3) score += 2;
  else if (s.stakeholderDepth >= 1) score += 1;
  if (s.hasTimeInWorkaround) score += 2;
  else if (s.hasDetailedWorkaround) score += 1;
  if (s.urgencyDepth >= 2) score += 2;
  else if (s.urgencyDepth >= 1) score += 1;
  if (s.hasInterviewEvidence) score += 1;
  if (s.hasSourceCitation) score += 1;

  const redFlagCount = countRedFlags(s, impact);
  score = Math.max(0, score - redFlagCount);

  return Math.min(score, 10);
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'Well Validated';
  if (score >= 6) return 'Developing';
  if (score >= 4) return 'Needs Evidence';
  return 'Early Stage';
}

function reviewProblemValidation(
  impact: string,
  stakeholders: string,
  workarounds: string,
  urgency: string
): ValidationCoachResult {
  const signals = extractScoringSignals(impact, stakeholders, workarounds, urgency);
  const score = scoreProblemValidation(impact, stakeholders, workarounds, urgency);
  const scoreLabel = getScoreLabel(score);

  const strengths: string[] = [];
  const redFlags: string[] = [];
  const suggestions: string[] = [];
  const followUpQuestions: string[] = [];
  const nextSteps: string[] = [];

  const impactNumbers = impact.match(/\d[\d,.]*/g) || [];
  const hasSmallCount = impactNumbers.some(n => {
    const v = parseInt(n.replace(/,/g, ''), 10);
    return v > 0 && v < 1000;
  });

  if (signals.hasLargeNumber) {
    strengths.push('Impact is quantified with a concrete user count — strong foundation for a fundable proposal.');
  }
  if (signals.hasTAMReference) {
    strengths.push('References the broader public service workforce size, framing the problem at ecosystem scale.');
  }
  if (/\d+[\s-]*(hour|day|week|month)/i.test(impact)) {
    strengths.push('Time-based impact metric (hours/days) makes the cost of inaction tangible to reviewers.');
  }
  if (/annual|year|yearly|per year/i.test(impact)) {
    strengths.push('Annual aggregation of impact creates a compelling macro-level case.');
  }
  if (/1\.5\s*day|12\s*hour|coaching/i.test(impact)) {
    strengths.push('1.5 days of coaching per team is a specific, verifiable data point — this is the kind of evidence reviewers look for.');
  }
  if (['officer', 'organiser', 'organizer', 'ministry', 'agency', 'department', 'division'].some(w => stakeholders.toLowerCase().includes(w))) {
    strengths.push('Stakeholders are named specifically (not just "users") — primary and secondary roles are distinguishable.');
  }
  if (['design thinking', 'business analyst', 'ba ', 'template', '1-on-1', 'workshop', 'waitlist', 'colleague', 'search'].some(w => workarounds.toLowerCase().includes(w))) {
    strengths.push('Existing workarounds are described concretely — this validates real demand and shows officers are already trying to solve the problem.');
  }
  if (signals.hasInterviewEvidence) {
    strengths.push('Interview or validation evidence cited — this is the single strongest signal of problem-market fit. Reviewers will weight this heavily.');
  }
  if (signals.hasSourceCitation) {
    strengths.push('Data source cited in Impact Assessment — attributing figures to PSD/OECD/surveys makes the numbers defensible.');
  }

  if (!signals.hasUserCount) {
    redFlags.push('No user count detected in Impact Assessment. Without a number, reviewers cannot gauge scale. Add: "X officers affected" with a cited source (e.g., PSD headcount data, ministry estimates). (-1 point)');
  } else if (hasSmallCount && !signals.hasLargeNumber) {
    const smallVal = impactNumbers.find(n => {
      const v = parseInt(n.replace(/,/g, ''), 10);
      return v > 0 && v < 1000;
    });
    redFlags.push(`User estimate appears low (${smallVal} detected). If your problem affects a larger portion of officers, clarify whether this is intentionally a pilot cohort or the full affected population. (-1 point)`);
  }

  if (!signals.hasTAMReference && signals.hasLargeNumber) {
    redFlags.push('TAM not benchmarked — add a line anchoring your count to the total affected workforce (e.g., "representing 10% of all officers in this programme"). (-1 point)');
  }

  if (!signals.hasTimeInWorkaround) {
    redFlags.push('No time-based metric found. Quantify the friction: how many hours does each affected officer lose? Even an estimate (e.g., "20–40 hours per proposal cycle") turns an abstract problem into a resource cost. (-1 point)');
  }

  const urgencyLower = urgency.toLowerCase();
  const hasUrgencyDriver = ['oecd', 'digitalisation', 'digitalization', 'policy', 'budget', 'hackathon', 'programme', 'funded', 'deadline', 'mandate', 'constraint'].some(w => urgencyLower.includes(w));
  if (!hasUrgencyDriver) {
    redFlags.push('Urgency lacks an external driver. Reference a named policy mandate, a programme deadline, or a strategic priority to justify "why now".');
  }

  if (!signals.hasInterviewEvidence) {
    redFlags.push('No interview or user validation evidence found. Without it, the problem is asserted, not validated. Add: "We interviewed X officers / surveyed Y respondents and found…" — this is one of the most important signals for reviewers. (-1 point)');
  }

  if (!signals.hasSourceCitation) {
    redFlags.push('No data source cited for your impact figures. Unattributed numbers are easy to challenge. Add "(Source: [agency/report name])" or "based on X organiser interviews". (-1 point)');
  }

  if (!['design thinking', 'business analyst', 'ba ', 'template', '1-on-1', 'workshop', 'waitlist', 'colleague', 'search'].some(w => workarounds.toLowerCase().includes(w))) {
    redFlags.push('Workarounds are described in general terms. Name specific tools or processes (e.g., "BA waitlists with 2–3 week queues", "ad-hoc Google searches") to demonstrate you have observed actual user behaviour.');
  }

  suggestions.push(
    `Impact Assessment — strengthen sourcing: Add a source citation after your user figure (e.g., "(Source: [agency name] workforce data)"). If the coaching estimate comes from organiser interviews or programme data, cite it explicitly.`
  );
  suggestions.push(
    `Impact Assessment — add cost translation: Convert wasted hours into an estimated cost to unlock the "cost of inaction" framing. Example: "X hours × estimated hourly rate = $Y in annual unproductive officer time."`
  );
  suggestions.push(
    `Key Stakeholders — add influence/interest: For each stakeholder group, note their stake in the outcome. This helps reviewers understand adoption dynamics.`
  );
  suggestions.push(
    `Existing Workarounds — add friction data: Quantify the workaround pain. Example: "specialist support has a 2–3 week waitlist; workshops are only available to ~20% of officers."`
  );
  suggestions.push(
    `Urgency & Priority — tie to a named programme or policy: Anchor urgency to a real deadline or mandate. Example: "With the next programme cohort launching in Q3, 200+ teams will need coaching support."`
  );

  followUpQuestions.push('Have you interviewed at least 5 affected officers? If yes, what did they say about the biggest friction point in the current workarounds?');
  followUpQuestions.push('What data source supports your user estimate — is it official workforce data, a ministry survey, or an extrapolation from programme participation rates?');
  followUpQuestions.push('What is the current cost of the workarounds in officer time? Can you get the programme team to confirm the coaching estimate in writing?');
  followUpQuestions.push('Are there comparable public sector initiatives that quantified a similar productivity gap? Could you benchmark against them?');

  nextSteps.push('Conduct 3–5 user interviews with public officers who have submitted proposals in the last 12 months. Ask: "How long did you spend on the proposal? Where did you get stuck? What did you use for help?"');
  nextSteps.push('Request programme participation and coaching data from the relevant team to substantiate your estimates and confirm annual cohort size.');
  nextSteps.push('Add a sentence to your Impact Assessment anchoring your user count to the total affected workforce and stating your estimated percentage capture.');
  nextSteps.push('Draft a cost-of-inaction calculation: total affected officers × hours wasted × estimated hourly cost. Use this as your headline impact figure.');

  return {
    __type: 'validation_coach',
    score,
    scoreLabel,
    strengths,
    redFlags,
    suggestions,
    followUpQuestions,
    nextSteps,
  };
}

function getReadinessLabel(score: number): string {
  if (score >= 8) return 'Fundable Ready';
  if (score >= 6) return 'Developing';
  if (score >= 4) return 'Needs Evidence';
  return 'Early Stage';
}

function reviewUserResearch(
  targetUsers: string,
  interviewQuestions: string,
  researchFindings: string,
  userNeeds: string
): ValidationCoachResult {
  const allText = [targetUsers, interviewQuestions, researchFindings, userNeeds].join(' ');
  let score = 0;
  const strengths: string[] = [];
  const redFlags: string[] = [];
  const suggestions: string[] = [];
  const followUpQuestions: string[] = [];
  const nextSteps: string[] = [];

  const hasNamedGroups = ['officer', 'organiser', 'organizer', 'ministry', 'agency', 'programme', 'department', 'manager', 'director'].some(w => targetUsers.toLowerCase().includes(w));
  const hasCountInFindings = /\d+\s*(officer|respondent|participant|user|person|people|interview)/i.test(allText);
  const hasQuoteOrVerbatim = /"[^"]{10,}"|'[^']{10,}'|said|told us|mentioned|reported/.test(researchFindings);
  const hasPainPoints = /pain|friction|frustrat|difficult|challeng|time-consum|manual|confus|unclear/i.test(allText);
  const hasInsightDepth = researchFindings.trim().length > 80;
  const hasSpecificNeeds = /need|require|want|wish|expect|prefer/.test(userNeeds.toLowerCase()) && userNeeds.trim().length > 40;
  const hasOpenQuestions = /\?/.test(interviewQuestions);
  const questionCount = (interviewQuestions.match(/\n/g) || []).length + (interviewQuestions.trim().length > 10 ? 1 : 0);
  const hasPrioritisedNeeds = /\d\.|first|second|third|top|priority|most important|critical/i.test(userNeeds);
  const hasGovtechRef = /programme|launchpad|govtech|naig|psd|oecd|public service/i.test(allText);

  if (hasNamedGroups) { score += 2; strengths.push('Target user groups are named specifically (e.g., officers, organisers) — reviewers can picture who the product serves.'); }
  else { score += 0; redFlags.push('Target users are not named specifically. Replace generic terms like "users" with role titles (e.g., "programme organisers", "public officers submitting proposals"). (-1 point)'); }

  if (hasCountInFindings) { score += 2; strengths.push('Research findings include a participant count — this quantifies the evidence base and strengthens credibility.'); }
  else { redFlags.push('No participant count in Research Findings. Add "We interviewed X officers" or "surveyed Y respondents" to make the evidence base explicit. (-1 point)'); }

  if (hasQuoteOrVerbatim) { score += 2; strengths.push('Verbatim quotes or attributed observations in findings — the strongest form of user evidence for a programme submission.'); }
  else if (hasInsightDepth) { score += 1; strengths.push('Research findings are substantive — good depth even without direct quotes.'); }
  else { redFlags.push('Research findings are thin or missing. Add specific insights with participant attribution (e.g., "3 of 5 officers said they spend >2 hours searching for guidance"). (-1 point)'); }

  if (hasPainPoints) { score += 1; strengths.push('Pain points and friction are explicitly named — this ties research directly to the problem statement.'); }
  else { redFlags.push('No pain points or friction language detected. Research findings should explicitly name what causes difficulty, not just what users do.'); }

  if (hasOpenQuestions && questionCount >= 4) { score += 1; strengths.push('Interview questions are open-ended and comprehensive — likely to surface genuine insights.'); }
  else { redFlags.push('Interview questions appear limited or closed-ended. Use open "How/What/Why" questions and aim for at least 5.'); }

  if (hasSpecificNeeds) { score += 1; strengths.push('User needs are articulated with specificity — not just "users want X" but what they actually require.'); }
  else { redFlags.push('Prioritised user needs are vague. State each need precisely: who needs what, and under what conditions.'); }

  if (hasPrioritisedNeeds) { score += 1; strengths.push('User needs appear ranked or prioritised — this helps scope the MVP to highest-value features.'); }
  if (hasGovtechRef) { score += 1; strengths.push('References the programme and public service context — anchors research in the relevant ecosystem.'); }

  const redFlagCount = redFlags.length;
  score = Math.max(0, Math.min(10, score - redFlagCount));

  suggestions.push('Target Users — add organisation and count: e.g., "Primary: ~200 programme organisers who coach 500+ teams per cohort. Secondary: ~X public officers who submit proposals annually."');
  suggestions.push('Research Findings — lead with numbers: "We interviewed 8 officers across 3 agencies. 7/8 reported spending 3+ hours searching for proposal guidance. 5/8 had been waitlisted for specialist support."');
  suggestions.push('User Needs — use a ranked "How Might We" format: "1 (Critical): HMW give officers on-demand proposal coaching without specialist bottlenecks? 2 (High): HMW reduce time-to-first-draft from 3 hours to under 30 minutes?"');
  suggestions.push('Interview Questions — add a "workaround" probe: "Walk me through the last time you wrote a proposal — what did you do when you got stuck?" This surfaces the exact pain Problem Validation needs to quantify.');

  followUpQuestions.push('Have you conducted at least 5 user interviews? If not, what is preventing you from reaching that threshold before submission?');
  followUpQuestions.push('What was the single most surprising thing you heard in interviews? If nothing surprised you, the questions may have been leading — revisit the interview script.');
  followUpQuestions.push('Can you get a programme organiser to validate your findings? Their endorsement would significantly strengthen the submission.');
  followUpQuestions.push('Are your prioritised user needs directly traceable to interview quotes, or are they inferred? Reviewers will ask this question.');

  nextSteps.push('Conduct 3–5 structured interviews with programme organisers and 3–5 with proposal-submitting officers. Record with permission and transcribe key quotes.');
  nextSteps.push('Synthesise findings into an affinity map: group quotes by theme, count frequency, rank themes by recurrence. This becomes your "Prioritised User Needs" section.');
  nextSteps.push('Add a one-line participant summary at the top of Research Findings: "Based on interviews with N=X participants across Y agencies, conducted [month/year]."');
  nextSteps.push('Cross-reference your user needs with the Problem Validation impact figures — every need should map to a quantified friction point.');

  return { __type: 'validation_coach', score, scoreLabel: getReadinessLabel(score), strengths, redFlags, suggestions, followUpQuestions, nextSteps };
}

function reviewOpportunityFraming(
  hmwStatement: string,
  rootCauses: string,
  opportunityScope: string,
  designConstraints: string
): ValidationCoachResult {
  const allText = [hmwStatement, rootCauses, opportunityScope, designConstraints].join(' ');
  let score = 0;
  const strengths: string[] = [];
  const redFlags: string[] = [];
  const suggestions: string[] = [];
  const followUpQuestions: string[] = [];
  const nextSteps: string[] = [];

  const hasHMWFormat = /how might we|hmw/i.test(hmwStatement);
  const hmwLength = hmwStatement.trim().length;
  const hmwHasAudience = /officer|organiser|organizer|ministry|agency|public|user|team|staff/i.test(hmwStatement);
  const hmwHasAction = /help|enable|allow|support|reduce|improve|give|make|ensure/i.test(hmwStatement);
  const hmwImpliesSolution = /app|tool|platform|system|software|ai|digital|automat|build|create|develop/i.test(hmwStatement);
  const hmwIsGeneric = hmwLength < 40 || /everyone|all people|all users|anybody|anyone/i.test(hmwStatement);

  const hasRootCauseDepth = rootCauses.trim().length > 60 && /because|due to|caused by|result of|lack of|absence of|gap in|barrier/i.test(rootCauses);
  const hasMultipleRootCauses = (rootCauses.match(/\n/g) || []).length >= 1 || rootCauses.trim().split(/[.;]/).filter(s => s.trim().length > 10).length >= 2;
  const hasScopeAudience = /officer|organiser|organizer|ministry|agency|team|cohort|programme|department/i.test(opportunityScope);
  const hasScopeContext = /proposal|programme|hackathon|innovation|public service/i.test(opportunityScope);
  const hasScopeBoundary = /not include|exclude|out of scope|only|limited to|focus on|within|specific/i.test(opportunityScope);
  const hasConstraintDepth = designConstraints.trim().length > 40;
  const hasNamedConstraints = /budget|timeline|policy|regulation|data|privacy|security|compliance|legacy|existing|infrastructure|access|approval/i.test(designConstraints);
  const hasGovtechContext = /programme|launchpad|govtech|psd|oecd|public service/i.test(allText);

  if (hasHMWFormat && !hmwImpliesSolution && hmwHasAudience && hmwHasAction) {
    score += 2;
    strengths.push('HMW statement is well-formed: uses the correct format, names an audience, and implies a direction without locking in a solution.');
  } else if (hasHMWFormat && !hmwImpliesSolution) {
    score += 1;
    strengths.push('HMW format used correctly — now tighten the statement to name a specific audience and describe the gap more precisely.');
  } else if (!hasHMWFormat) {
    redFlags.push('Statement is not in "How Might We" format. Rewrite as "How might we [help X] [achieve Y / overcome Z]?" — this format is standard for opportunity framing. (-1 point)');
  }

  if (hmwImpliesSolution) {
    redFlags.push('HMW statement implies a specific solution (e.g., "build an app", "use AI"). A good HMW is solution-agnostic — it describes the gap, not the answer. Remove technology/product references. (-1 point)');
  }

  if (hmwIsGeneric) {
    redFlags.push('HMW statement is too broad or generic. A strong HMW is specific enough that only 3–5 solution directions come to mind. Narrow the audience or the context. (-1 point)');
  }

  if (hasRootCauseDepth && hasMultipleRootCauses) {
    score += 2;
    strengths.push('Root causes are identified with causal language and multiple factors — this shows the team has moved beyond symptoms to underlying drivers.');
  } else if (hasRootCauseDepth || hasMultipleRootCauses) {
    score += 1;
    strengths.push('Root causes are present — deepen the analysis by identifying at least 2 underlying causes with causal language ("because", "due to").');
  } else {
    redFlags.push('Root causes are superficial or missing. Use the "5 Whys" technique: ask "why does this problem exist?" at least twice to get below surface symptoms. (-1 point)');
  }

  if (hasScopeAudience && hasScopeContext) {
    score += 2;
    strengths.push('Opportunity scope names both the target audience and the context — reviewers can immediately understand who and where this opportunity applies.');
  } else if (hasScopeAudience || hasScopeContext) {
    score += 1;
    strengths.push('Scope is partially defined — add both audience (who) and context (in what situation) to make the boundary explicit.');
  } else {
    redFlags.push('Opportunity scope is vague. Define who this opportunity is for and in what context (e.g., "public officers submitting innovation proposals through the programme"). (-1 point)');
  }

  if (hasScopeBoundary) {
    score += 1;
    strengths.push('Scope includes explicit boundaries or exclusions — this is a sign of disciplined problem framing and prevents scope creep.');
  } else {
    redFlags.push('Opportunity scope has no explicit boundary. Add "This does not include…" or "We are focused only on…" to make the limits clear.');
  }

  if (hasConstraintDepth && hasNamedConstraints) {
    score += 2;
    strengths.push('Design constraints are named specifically (policy, data, compliance, infrastructure) — this grounds the opportunity in real-world delivery conditions.');
  } else if (hasConstraintDepth) {
    score += 1;
    strengths.push('Constraints are present — naming specific types (data policy, security compliance, budget, legacy systems) would make this section significantly stronger.');
  } else {
    redFlags.push('Design constraints are missing or too brief. Name at least 3 real constraints the solution must work within (e.g., "must comply with data classification policy", "no new budget — must use existing infrastructure"). (-1 point)');
  }

  if (hasGovtechContext) {
    score += 1;
    strengths.push('References the programme and public service context — anchoring the opportunity in the relevant ecosystem is important for reviewers.');
  }

  const redFlagCount = redFlags.length;
  score = Math.max(0, Math.min(10, score - redFlagCount));

  suggestions.push('HMW Statement — test it with colleagues: show them the statement and ask "what solutions come to mind?" If they all suggest the same solution, the HMW is too narrow. If they can\'t think of any, it\'s too broad.');
  suggestions.push('Root Causes — use the "5 Whys": "Officers struggle to write proposals (symptom) → because they lack structured frameworks (cause 1) → because proposal coaching is scarce and reactive (cause 2) → because the system is designed around specialist support, not self-service."');
  suggestions.push('Opportunity Scope — add a one-liner: "This opportunity is scoped to public officers submitting proposals through the programme for the first time."');
  suggestions.push('Design Constraints — categorise by type: policy constraints (what you must comply with), resource constraints (budget, team, time), and technical constraints (existing systems, data access). At least one of each.');

  followUpQuestions.push('Is your HMW statement specific enough to narrow to 3–5 solution directions? Test it: ask 3 people "what would you build for this?" and see if you get diverse answers.');
  followUpQuestions.push('Do your root causes trace back to insights from your User Research section? Every cause should be evidenced by something an actual user told you.');
  followUpQuestions.push('Are your design constraints real (already confirmed) or assumed? Have you spoken to a data governance or policy team to validate technical and compliance constraints?');
  followUpQuestions.push('What is the single most important constraint that any solution must satisfy? If a solution broke that constraint, would you reject it?');

  nextSteps.push('Workshop the HMW with your team: write 5 versions at different levels of specificity, then vote on which best captures the core tension without implying a solution.');
  nextSteps.push('Validate root causes with users: in your next interview, ask "why do you think this problem keeps happening?" Their language often reveals causes your team has missed.');
  nextSteps.push('Confirm your top 3 design constraints with the relevant stakeholders (policy team, budget holder, system owner) before finalising this section.');
  nextSteps.push('Use your HMW statement as the headline for your Executive Summary — it is the most concise framing of why this problem deserves attention and investment.');

  return { __type: 'validation_coach', score, scoreLabel: getReadinessLabel(score), strengths, redFlags, suggestions, followUpQuestions, nextSteps };
}

function reviewSuccessDefinition(
  desiredOutcomes: string,
  doneWell: string,
  earlySignals: string,
  outOfScope: string
): ValidationCoachResult {
  const allText = [desiredOutcomes, doneWell, earlySignals, outOfScope].join(' ');
  let score = 0;
  const strengths: string[] = [];
  const redFlags: string[] = [];
  const suggestions: string[] = [];
  const followUpQuestions: string[] = [];
  const nextSteps: string[] = [];

  const hasOutcomeLanguage = /change|improve|reduce|increase|enable|allow|help|feel|experience|able to|no longer|instead of/i.test(desiredOutcomes);
  const hasSolutionLanguage = /build|create|develop|launch|deploy|implement|system|platform|app|tool|feature/i.test(desiredOutcomes);
  const hasUserSubject = /officer|user|organiser|organizer|person|people|team|staff|public/i.test(desiredOutcomes);
  const hasObservableChange = /would|could|can|will|see|hear|observe|notice|measur|detect/i.test(doneWell);
  const hasDoneWellDepth = doneWell.trim().length > 60;
  const hasEarlySignalSpecificity = /week|month|day|session|first|early|initial|within/i.test(earlySignals);
  const hasEarlySignalCount = /\d+|\d+%|number|count|rate/i.test(earlySignals);
  const hasOutOfScopeExamples = outOfScope.trim().length > 40 && /not|exclude|outside|beyond|won't|will not|does not include/i.test(outOfScope);
  const hasAlignmentToProblem = /problem|issue|friction|challenge|pain|gap/i.test(desiredOutcomes + doneWell);
  const hasGovtechContext = /officer|programme|launchpad|govtech|psd|public service/i.test(allText);

  if (hasOutcomeLanguage && hasUserSubject && !hasSolutionLanguage) {
    score += 2;
    strengths.push('Desired outcomes are framed around user experiences and observable changes — not deliverables or features. This is exactly the right framing for problem-scoping.');
  } else if (hasOutcomeLanguage && hasUserSubject) {
    score += 1;
    strengths.push('Outcomes include user language — remove any references to specific solutions or features to keep this section truly outcome-oriented.');
  } else if (hasSolutionLanguage) {
    redFlags.push('Desired outcomes describe what you will build, not what will change for users. Reframe: instead of "we will build X", write "officers will be able to Y" or "the time spent on Z will reduce from A to B". (-1 point)');
  } else {
    redFlags.push('Desired outcomes are vague or missing. Describe the world after this problem is solved: what do affected people experience differently? (-1 point)');
  }

  if (hasAlignmentToProblem) {
    score += 2;
    strengths.push('Outcomes align to the original problem statement — reviewers can trace a clear line from problem to success definition.');
  } else {
    redFlags.push('Desired outcomes do not visibly connect to the problem statement. A success definition that doesn\'t reference the original friction is a red flag for reviewers. (-1 point)');
  }

  if (hasObservableChange && hasDoneWellDepth) {
    score += 2;
    strengths.push('"Done well" section describes observable behaviours and states — this makes success verifiable, not just aspirational.');
  } else if (hasDoneWellDepth) {
    score += 1;
    strengths.push('"Done well" has substance — adding observable or measurable language ("would see", "could measure") would make it stronger.');
  } else {
    redFlags.push('"Done well" is too brief or abstract. Describe what you would observe if this went better than expected — user behaviours, team outcomes, or system states you could actually witness. (-1 point)');
  }

  if (hasEarlySignalSpecificity && hasEarlySignalCount) {
    score += 2;
    strengths.push('Early signals include timeframes and countable indicators — these are actionable leading metrics, not lagging outcomes.');
  } else if (hasEarlySignalSpecificity || hasEarlySignalCount) {
    score += 1;
    strengths.push('Early signals have some specificity — adding both a timeframe and a count/rate would make them fully measurable.');
  } else {
    redFlags.push('Early signals are too vague to act on. Add a timeframe ("within the first 2 weeks") and a countable indicator ("at least 3 officers independently use the guidance without prompting"). (-1 point)');
  }

  if (hasOutOfScopeExamples) {
    score += 2;
    strengths.push('Out-of-scope items are explicitly stated with examples — this is a sign of disciplined problem framing and prevents the proposal from expanding beyond what is feasible.');
  } else if (outOfScope.trim().length > 20) {
    score += 1;
    strengths.push('Out-of-scope section is present — adding specific examples of excluded problems or user groups would make the boundary clearer.');
  } else {
    redFlags.push('Out-of-scope section is missing or too brief. Explicitly stating what you are NOT trying to solve is as important as what you are. Name at least 2 related problems you are consciously excluding. (-1 point)');
  }

  if (hasGovtechContext) {
    score += 1;
    strengths.push('Outcomes are grounded in the public service context — reviewers can picture the affected population and environment.');
  }

  const redFlagCount = redFlags.length;
  score = Math.max(0, Math.min(10, score - redFlagCount));

  suggestions.push('Desired Outcomes — use the "before/after" frame: "Before: officers spend 3+ hours on a first draft with no structured support. After: officers can articulate a well-scoped problem statement in under 30 minutes, independently."');
  suggestions.push('"Done Well" — use user voice: "If this went really well, an officer would say: \'I actually understood what the problem was and felt confident writing it down without needing a BA.\'" Concrete quotes-from-the-future are powerful for reviewers.');
  suggestions.push('Early Signals — name the first observable indicator: "Within the first week of availability, at least 5 officers attempt the first section without prompting or support request." This is a leading indicator you can actually measure.');
  suggestions.push('Out of Scope — be explicit about adjacent problems: "This proposal does not address solution ideation, technical development, or implementation. It is scoped to the problem definition phase only."');

  followUpQuestions.push('Do your desired outcomes directly undo the friction described in your Problem Identification section? If not, there is an alignment gap to address.');
  followUpQuestions.push('Could you observe whether success was achieved without a survey? If the answer is no, the outcomes may be too internal or attitudinal — add a behavioural indicator.');
  followUpQuestions.push('What is the minimum level of success that would justify continuing to the next phase? Setting a floor is as important as setting a ceiling.');
  followUpQuestions.push('Have affected users reviewed this success definition and agreed it describes their reality? Their validation of "yes, that\'s what we\'d want" is powerful evidence for reviewers.');

  nextSteps.push('Map each desired outcome back to a specific user need from your User Research section. Every outcome should address at least one named user need.');
  nextSteps.push('Test your "done well" description: read it to 3 potential users and ask "if this were true, would you consider the problem solved?" Their reactions will sharpen the language.');
  nextSteps.push('Identify which of your early signals can be measured without building anything (e.g., through a paper prototype test, a survey, or a facilitated session). These become your pre-build validation checkpoints.');
  nextSteps.push('Use your out-of-scope section to directly inform the Executive Summary — stating what you are NOT doing is often what makes a proposal feel credible and feasible.');

  return { __type: 'validation_coach', score, scoreLabel: getReadinessLabel(score), strengths, redFlags, suggestions, followUpQuestions, nextSteps };
}

const LABEL_PREFIX_RE = /^(Focus on[:\s]+|Primary[:\s]+|Secondary[:\s]+|Tertiary[:\s]+|Any solution must[:\s]+|Key constraints include[:\s]+|This proposal is explicitly scoped to exclude[:\s]+|Note[:\s]+|NB[:\s]+)/gi;

function stripLabels(raw: string): string {
  return raw
    .split('\n')
    .map(line => line.replace(LABEL_PREFIX_RE, '').trim())
    .filter(line => line.length > 0)
    .join(', ');
}

function mergeItems(raw: string): string {
  const cleaned = stripLabels(raw);
  return cleaned.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
}

function generateExecutiveSummaryFallback(ctx: Record<string, string>): string {
  const clean = (key: string) => mergeItems(ctx[key] || '');

  const problemStatement = clean('problemStatement');
  const affectedUsers = clean('affectedUsers');
  const currentImpact = clean('currentImpact');
  const impactAssessment = clean('impactAssessment');
  const stakeholders = clean('stakeholders');
  const hmwStatement = clean('hmwStatement');
  const opportunityScope = clean('opportunityScope');
  const designConstraints = clean('designConstraints');
  const desiredOutcomes = clean('desiredOutcomes');
  const doneWell = clean('doneWell');
  const earlySignals = clean('earlySignals');
  const outOfScope = clean('outOfScope');

  const hasProblem = problemStatement.length > 0;
  const hasOpportunity = hmwStatement.length > 0;
  const hasSuccess = desiredOutcomes.length > 0;

  const paragraphs: string[] = [];

  if (hasProblem) {
    const parts: string[] = [];
    const impact = currentImpact || impactAssessment;
    if (affectedUsers && impact) {
      parts.push(`${affectedUsers} face a persistent challenge: ${problemStatement.charAt(0).toLowerCase() + problemStatement.slice(1)}${problemStatement.endsWith('.') ? '' : '.'} ${impact}${impact.endsWith('.') ? '' : '.'}`);
    } else if (affectedUsers) {
      parts.push(`${affectedUsers} face a persistent challenge: ${problemStatement.charAt(0).toLowerCase() + problemStatement.slice(1)}${problemStatement.endsWith('.') ? '' : '.'}`);
    } else {
      parts.push(`${problemStatement}${problemStatement.endsWith('.') ? '' : '.'}`);
      if (impact) parts.push(`${impact}${impact.endsWith('.') ? '' : '.'}`);
    }
    paragraphs.push(parts.join(' '));
  } else {
    paragraphs.push('A recurring operational challenge has been identified within the public service that constrains productivity and officer effectiveness.');
  }

  if (hasOpportunity) {
    const parts: string[] = [];
    const scopeClause = opportunityScope ? ` The initial scope covers ${opportunityScope}` : '';
    const stakeholderClause = !opportunityScope && stakeholders ? ` working with ${stakeholders}` : '';
    parts.push(`${hmwStatement}${hmwStatement.endsWith('.') ? '' : '.'}${scopeClause || stakeholderClause}${(scopeClause || stakeholderClause) ? '.' : ''}`);
    if (designConstraints) parts.push(`Any solution will need to ${designConstraints.charAt(0).toLowerCase() + designConstraints.slice(1)}${designConstraints.endsWith('.') ? '' : '.'}`);
    paragraphs.push(parts.join(' '));
  } else if (hasProblem) {
    const stakeholderClause = stakeholders ? ` in partnership with ${stakeholders}` : '';
    paragraphs.push(`There is a clear opportunity to address this gap through a targeted, user-centred intervention${stakeholderClause}, designed to work within existing policy and resource constraints.`);
  }

  if (hasSuccess) {
    const parts: string[] = [];
    const outcomeClause = desiredOutcomes
      ? `Success would mean ${desiredOutcomes.charAt(0).toLowerCase() + desiredOutcomes.slice(1)}${desiredOutcomes.endsWith('.') ? '' : ''}`
      : '';
    const doneWellClause = doneWell
      ? `, and ${doneWell.charAt(0).toLowerCase() + doneWell.slice(1)}${doneWell.endsWith('.') ? '' : ''}`
      : '';
    if (outcomeClause) parts.push(`${outcomeClause}${doneWellClause}.`);
    if (earlySignals) parts.push(`Early signs that the initiative is on the right track include ${earlySignals.charAt(0).toLowerCase() + earlySignals.slice(1)}${earlySignals.endsWith('.') ? '' : '.'}`);
    if (outOfScope) parts.push(`This work is intentionally bounded; it does not seek to ${outOfScope.charAt(0).toLowerCase() + outOfScope.slice(1)}${outOfScope.endsWith('.') ? '' : '.'}`);
    paragraphs.push(parts.join(' '));
  } else {
    paragraphs.push('Success would be visible through measurable reductions in officer friction, improved confidence in navigating the relevant process, and reduced reliance on specialist intermediaries, while remaining scoped to the immediate challenge rather than broader systemic change.');
  }

  const scopeRef = (() => {
    if (opportunityScope) return ` with ${opportunityScope.split(',')[0].trim()}`;
    if (stakeholders) return ` with ${stakeholders.split(',')[0].trim()}`;
    return '';
  })();
  paragraphs.push(`We recommend proceeding to a focused discovery sprint${scopeRef} to validate root causes and test early solution concepts, with a view to scoping a proof-of-concept for the next funding cycle.`);

  return paragraphs.join('\n\n');
}

function reviewProblemIdentification(
  problemStatement: string,
  affectedUsers: string,
  currentImpact: string
): string {
  const findings: string[] = [];
  const hasNumber = /\d/.test(currentImpact);
  const vagueImpactWords = ['significant', 'many', 'lots', 'various', 'several', 'often', 'sometimes', 'generally', 'major', 'minor'];
  const usesVagueImpact = vagueImpactWords.some(w => currentImpact.toLowerCase().includes(w));

  const problemLower = problemStatement.toLowerCase();

  const firstWordsOfAffected = affectedUsers.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase();
  const affectedMentionedInProblem = firstWordsOfAffected.split(' ').some(word =>
    word.length > 3 && problemLower.includes(word)
  );

  if (!affectedMentionedInProblem && affectedUsers.trim().length > 0) {
    findings.push(`Coherence: Your problem statement does not mention "${affectedUsers.trim()}" — the group named in "Who is Affected". Rewrite the problem statement to explicitly reference them so reviewers see who bears this problem.`);
  }

  if (!hasNumber) {
    findings.push(`Impact specificity: "${currentImpact.trim()}" contains no numbers. Strengthen it by adding a concrete figure, e.g. "officers spend 3 hours per week", "30% of cases are delayed", or "costs the agency $50,000 annually". Quantified impact is far more persuasive to approvers.`);
  } else if (usesVagueImpact) {
    const foundWord = vagueImpactWords.find(w => currentImpact.toLowerCase().includes(w));
    findings.push(`Impact precision: The word "${foundWord}" in your impact description is vague even alongside the number. Replace it with a precise measurement — state exactly what is affected, by how much, and how often.`);
  }

  const vagueProblemWords = ['issues', 'challenges', 'difficulties', 'problems', 'things', 'stuff'];
  const vagueFound = vagueProblemWords.find(w => problemLower.includes(w));
  if (vagueFound) {
    findings.push(`Problem clarity: The word "${vagueFound}" in your problem statement is too broad. Replace it with the specific task, process, or outcome that is failing — reviewers should be able to picture exactly what goes wrong.`);
  }

  if (findings.length === 0) {
    return 'Your three fields look consistent and well-scoped. The problem names its audience, the impact is quantified, and the statement is specific. Consider adding one sentence about the consequence of inaction to strengthen urgency before moving on.';
  }

  return findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n');
}

class AIService {
  private async callAIProxy(body: Record<string, unknown>): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai-proxy', { body });
    if (error) throw error;
    if (!data || typeof data.content !== 'string') {
      throw new Error('Invalid AI proxy response');
    }
    return data.content;
  }

  async generateSuggestion(
    sectionType: SectionType,
    input: string,
    additionalContext?: Record<string, string>
  ): Promise<string> {
    const config = SECTION_PROMPTS[sectionType];
    let userPrompt = config.userPromptTemplate.replace('{input}', input);
    if (additionalContext) {
      Object.entries(additionalContext).forEach(([k, v]) => {
        userPrompt = userPrompt.replace(`{${k}}`, v);
      });
    }

    try {
      return await this.callAIProxy({
        mode: 'suggestion',
        sectionType,
        systemPrompt: config.systemPrompt,
        userPrompt,
      });
    } catch (error) {
      captureError('ai', 'generate_suggestion_failed', error, { sectionType });
      await new Promise(resolve => setTimeout(resolve, 800));
      if (sectionType === 'problem_identification') {
        return reviewProblemIdentification(
          input,
          additionalContext?.affectedUsers ?? '',
          additionalContext?.currentImpact ?? ''
        );
      }
      if (sectionType === 'problem_validation') {
        return JSON.stringify(reviewProblemValidation(
          input,
          additionalContext?.stakeholders ?? '',
          additionalContext?.existingWorkarounds ?? '',
          additionalContext?.urgency ?? ''
        ));
      }
      if (sectionType === 'user_research') {
        return JSON.stringify(reviewUserResearch(
          input,
          additionalContext?.interviewQuestions ?? '',
          additionalContext?.researchFindings ?? '',
          additionalContext?.userNeeds ?? ''
        ));
      }
      if (sectionType === 'opportunity_framing') {
        return JSON.stringify(reviewOpportunityFraming(
          input,
          additionalContext?.rootCauses ?? '',
          additionalContext?.opportunityScope ?? '',
          additionalContext?.designConstraints ?? ''
        ));
      }
      if (sectionType === 'success_definition') {
        return JSON.stringify(reviewSuccessDefinition(
          input,
          additionalContext?.doneWell ?? '',
          additionalContext?.earlySignals ?? '',
          additionalContext?.outOfScope ?? ''
        ));
      }
      if (sectionType === 'executive_summary') {
        return generateExecutiveSummaryFallback(additionalContext ?? {});
      }
      return FALLBACKS[sectionType];
    }
  }
}

export const aiService = new AIService();

export type { FeedbackPayload, ChatMessageContent };

export function buildFeedbackFromResult(result: ValidationCoachResult): FeedbackPayload {
  return {
    score: result.score,
    scoreLabel: result.scoreLabel,
    strengths: result.strengths,
    redFlags: result.redFlags,
    suggestions: result.suggestions,
    followUpQuestions: result.followUpQuestions,
    nextSteps: result.nextSteps,
  };
}

export function buildFollowUpFromResult(result: ValidationCoachResult): string {
  const topics: string[] = [];
  if (result.suggestions.length > 0) topics.push('work on the top suggestion');
  if (result.followUpQuestions.length > 0) topics.push('answer a follow-up question');
  if (result.nextSteps.length > 0) topics.push('see the recommended next steps');
  if (topics.length === 0) return 'Would you like to ask me anything about this section?';
  return `Would you like to ${topics.slice(0, 2).join(' or ')}?`;
}

export function getFeedbackForSection(
  sectionType: SectionType,
  fieldValues: Record<string, string>
): ValidationCoachResult | null {
  if (sectionType === 'problem_validation') {
    return reviewProblemValidation(
      fieldValues.impactAssessment ?? '',
      fieldValues.stakeholders ?? '',
      fieldValues.existingWorkarounds ?? '',
      fieldValues.urgency ?? ''
    );
  }
  if (sectionType === 'user_research') {
    return reviewUserResearch(
      fieldValues.targetUsers ?? '',
      fieldValues.interviewQuestions ?? '',
      fieldValues.researchFindings ?? '',
      fieldValues.userNeeds ?? ''
    );
  }
  if (sectionType === 'opportunity_framing') {
    return reviewOpportunityFraming(
      fieldValues.hmwStatement ?? '',
      fieldValues.rootCauses ?? '',
      fieldValues.opportunityScope ?? '',
      fieldValues.designConstraints ?? ''
    );
  }
  if (sectionType === 'success_definition') {
    return reviewSuccessDefinition(
      fieldValues.desiredOutcomes ?? '',
      fieldValues.doneWell ?? '',
      fieldValues.earlySignals ?? '',
      fieldValues.outOfScope ?? ''
    );
  }
  if (sectionType === 'problem_identification') {
    const text = reviewProblemIdentification(
      fieldValues.problemStatement ?? '',
      fieldValues.affectedUsers ?? '',
      fieldValues.currentImpact ?? ''
    );
    return {
      __type: 'validation_coach',
      score: 0,
      scoreLabel: '',
      strengths: [],
      redFlags: [],
      suggestions: [text],
      followUpQuestions: [],
      nextSteps: [],
    };
  }
  return null;
}

const CHAT_SYSTEM_PROMPT = `You are an expert AI coach helping public officers write strong, fundable innovation proposals. You give direct, specific, actionable feedback grounded in public service context. Be concise, warm, and practical. Never give generic advice — always refer to the user's actual text.`;

export async function getChatReply(
  conversationHistory: { role: 'user' | 'assistant'; text: string }[],
  sectionType: SectionType,
  currentFieldValues: Record<string, string>
): Promise<string> {
  const fieldContext = Object.entries(currentFieldValues)
    .filter(([, v]) => v.trim().length > 0)
    .map(([k, v]) => `${k}: "${v}"`)
    .join('\n');

  const systemMessage = `${CHAT_SYSTEM_PROMPT}\n\nCurrent section: ${sectionType.replace(/_/g, ' ')}.\n\nCurrent field values:\n${fieldContext || '(fields are empty)'}`;

  const messages = [
    { role: 'system' as const, content: systemMessage },
    ...conversationHistory.map(m => ({ role: m.role, content: m.text })),
  ];

  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        mode: 'chat',
        sectionType,
        messages,
      },
    });
    if (error) throw error;
    if (!data || typeof data.content !== 'string') {
      throw new Error('Invalid AI proxy response');
    }
    return data.content;
  } catch (error) {
    captureError('ai', 'chat_reply_failed', error, { sectionType });
    await new Promise(resolve => setTimeout(resolve, 600));
    const userMessages = conversationHistory.filter(m => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1]?.text?.toLowerCase() ?? '';
    if (lastUserMsg.includes('example') || lastUserMsg.includes('show me')) {
      return "Here's an example for a public service context:\n\n**Problem Statement:** \"Public officers submitting proposals through an innovation programme spend 20–40 hours preparing a first draft, often without structured guidance. This creates a bottleneck for innovation enablers who spend 1.5 days of coaching per team just on proposal basics.\"\n\nThe key elements: names the specific group, describes the friction with a time estimate, and links to a named programme.";
    }
    if (lastUserMsg.includes('specific') || lastUserMsg.includes('quantif')) {
      return "For the Current Impact field, aim to include: (1) a number — how many people affected or how much time/cost is lost, (2) a frequency — per week, per proposal cycle, per year, and (3) a citation if you have one. For example: \"Officers spend an estimated 20–40 hours per proposal cycle on drafting, with no self-service support available.\" Even rough estimates are better than vague language like \"many\" or \"significant\".";
    }
    return "I couldn't connect to the AI service right now. Please check your connection and try again.";
  }
}
