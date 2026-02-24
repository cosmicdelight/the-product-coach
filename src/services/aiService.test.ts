import { describe, expect, it } from 'vitest';
import {
  buildFeedbackFromResult,
  buildFollowUpFromResult,
  getFeedbackForSection,
} from './aiService';

describe('aiService helpers', () => {
  it('creates feedback payload from validation result', () => {
    const result = getFeedbackForSection('problem_validation', {
      impactAssessment: 'About 1500 officers spend around 20-40 hours on draft preparation each cycle.',
      stakeholders: 'Primary: public officers. Secondary: programme organisers.',
      existingWorkarounds: 'Manual templates and ad-hoc coaching sessions.',
      urgency: 'Upcoming programme deadlines create urgency for better support.',
    });

    expect(result).not.toBeNull();
    if (!result) return;

    const payload = buildFeedbackFromResult(result);
    expect(payload.score).toBeTypeOf('number');
    expect(Array.isArray(payload.strengths)).toBe(true);
    expect(Array.isArray(payload.suggestions)).toBe(true);
  });

  it('builds follow-up prompt with recommendation topics', () => {
    const result = getFeedbackForSection('success_definition', {
      desiredOutcomes: 'Officers can draft high quality proposals in under 30 minutes.',
      doneWell: 'Officers complete first drafts confidently with fewer support requests.',
      earlySignals: 'Within 2 weeks, 10 teams complete drafts without 1-on-1 support.',
      outOfScope: 'Does not include downstream implementation or procurement workflows.',
    });

    expect(result).not.toBeNull();
    if (!result) return;

    const followUp = buildFollowUpFromResult(result);
    expect(followUp.length).toBeGreaterThan(0);
    expect(followUp.toLowerCase()).toContain('would you like');
  });

  it('returns null for unsupported sections in getFeedbackForSection', () => {
    const unsupportedSection = 'executive_summary';
    const result = getFeedbackForSection(
      unsupportedSection as Parameters<typeof getFeedbackForSection>[0],
      {}
    );

    expect(result).toBeNull();
  });
});
