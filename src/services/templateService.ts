import { supabase } from '../lib/supabase';
import {
  EventTemplateWithSections,
  TemplateSectionDraft,
  TemplateFieldDraft,
} from '../types/database';

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSectionDraft[] = [
  {
    title: 'Problem Identification',
    description: 'Define the core problem, who is affected, and the current impact.',
    section_key: 'problem_identification',
    display_order: 0,
    fields: [
      {
        field_key: 'problemStatement',
        label: 'Problem Statement',
        placeholder: 'Describe the specific problem in one to two sentences. Be precise about what is going wrong.',
        field_type: 'textarea',
        required: true,
        display_order: 0,
        ai_prompt_hint: null,
      },
      {
        field_key: 'affectedUsers',
        label: 'Who is Affected',
        placeholder: 'Name the specific groups experiencing this problem (e.g. public officers submitting proposals).',
        field_type: 'textarea',
        required: true,
        display_order: 1,
        ai_prompt_hint: null,
      },
      {
        field_key: 'currentImpact',
        label: 'Current Impact',
        placeholder: 'Quantify the impact — time lost, cost, number of people, frequency. Use real numbers where possible.',
        field_type: 'textarea',
        required: true,
        display_order: 2,
        ai_prompt_hint: null,
      },
    ],
  },
  {
    title: 'Problem Validation',
    description: 'Demonstrate the problem is real and urgent through evidence.',
    section_key: 'problem_validation',
    display_order: 1,
    fields: [
      {
        field_key: 'impactAssessment',
        label: 'Impact Assessment',
        placeholder: 'Quantify the total impact with data and sources. How many people are affected? What is the cost in time or money?',
        field_type: 'textarea',
        required: true,
        display_order: 0,
        ai_prompt_hint: null,
      },
      {
        field_key: 'stakeholders',
        label: 'Key Stakeholders',
        placeholder: 'List primary and secondary stakeholders — who is directly affected, who influences the problem, who has a stake in the outcome.',
        field_type: 'textarea',
        required: true,
        display_order: 1,
        ai_prompt_hint: null,
      },
      {
        field_key: 'existingWorkarounds',
        label: 'Existing Workarounds',
        placeholder: 'What do people do today to cope? Name specific tools, manual processes, or informal fixes currently in use.',
        field_type: 'textarea',
        required: true,
        display_order: 2,
        ai_prompt_hint: null,
      },
      {
        field_key: 'urgency',
        label: 'Urgency & Priority',
        placeholder: 'Why does this matter now? Reference policy mandates, programme deadlines, or external drivers that make this urgent.',
        field_type: 'textarea',
        required: true,
        display_order: 3,
        ai_prompt_hint: null,
      },
    ],
  },
  {
    title: 'User Research',
    description: 'Share what you learned from speaking directly to affected users.',
    section_key: 'user_research',
    display_order: 2,
    fields: [
      {
        field_key: 'targetUsers',
        label: 'Target User Groups',
        placeholder: 'Describe the specific user groups you researched — include roles, context, and approximate numbers.',
        field_type: 'textarea',
        required: true,
        display_order: 0,
        ai_prompt_hint: null,
      },
      {
        field_key: 'interviewQuestions',
        label: 'Interview Questions',
        placeholder: 'List the open-ended questions you used in user interviews. Aim for at least 5 "How/What/Why" questions.',
        field_type: 'textarea',
        required: false,
        display_order: 1,
        ai_prompt_hint: null,
      },
      {
        field_key: 'researchFindings',
        label: 'Research Findings',
        placeholder: 'Summarise what you heard. Include participant counts, direct quotes, and the most surprising insights.',
        field_type: 'textarea',
        required: true,
        display_order: 2,
        ai_prompt_hint: null,
      },
      {
        field_key: 'userNeeds',
        label: 'Prioritised User Needs',
        placeholder: 'List user needs in priority order, drawn from your research. Frame as "Users need to [achieve something] so they can [outcome]."',
        field_type: 'textarea',
        required: true,
        display_order: 3,
        ai_prompt_hint: null,
      },
    ],
  },
  {
    title: 'Opportunity Framing',
    description: 'Frame the problem as a design opportunity using the How Might We method.',
    section_key: 'opportunity_framing',
    display_order: 3,
    fields: [
      {
        field_key: 'hmwStatement',
        label: 'How Might We Statement',
        placeholder: 'How might we [help a specific group] [achieve something / overcome an obstacle]? Avoid implying a solution.',
        field_type: 'textarea',
        required: true,
        display_order: 0,
        ai_prompt_hint: null,
      },
      {
        field_key: 'rootCauses',
        label: 'Root Causes',
        placeholder: 'Identify the underlying causes of the problem — use "because" and "due to" language. Ask "why?" at least twice.',
        field_type: 'textarea',
        required: true,
        display_order: 1,
        ai_prompt_hint: null,
      },
      {
        field_key: 'opportunityScope',
        label: 'Opportunity Scope',
        placeholder: 'Define who this opportunity is for and in what context. State what is included and what is explicitly not in scope.',
        field_type: 'textarea',
        required: true,
        display_order: 2,
        ai_prompt_hint: null,
      },
      {
        field_key: 'designConstraints',
        label: 'Design Constraints',
        placeholder: 'List real constraints — policy, budget, data, security, legacy systems. Name at least 3.',
        field_type: 'textarea',
        required: true,
        display_order: 3,
        ai_prompt_hint: null,
      },
    ],
  },
  {
    title: 'Success Definition',
    description: 'Define what success looks like for users and the organisation.',
    section_key: 'success_definition',
    display_order: 4,
    fields: [
      {
        field_key: 'desiredOutcomes',
        label: 'Desired Outcomes',
        placeholder: 'Describe the change you want to see for affected users — not features built but real differences in their experience or behaviour.',
        field_type: 'textarea',
        required: true,
        display_order: 0,
        ai_prompt_hint: null,
      },
      {
        field_key: 'doneWell',
        label: 'What "Done Well" Looks Like',
        placeholder: 'If this initiative exceeded expectations, what would you observe? Describe user behaviours and team outcomes.',
        field_type: 'textarea',
        required: true,
        display_order: 1,
        ai_prompt_hint: null,
      },
      {
        field_key: 'earlySignals',
        label: 'Early Signals of Success',
        placeholder: 'What measurable indicators — within the first weeks — would show you are on the right track? Include timeframes and numbers.',
        field_type: 'textarea',
        required: true,
        display_order: 2,
        ai_prompt_hint: null,
      },
      {
        field_key: 'outOfScope',
        label: 'Explicitly Out of Scope',
        placeholder: 'Name at least 2 related problems or user groups that this proposal deliberately does not address.',
        field_type: 'textarea',
        required: true,
        display_order: 3,
        ai_prompt_hint: null,
      },
    ],
  },
  {
    title: 'Executive Summary',
    description: 'A funding-ready summary synthesising all previous sections.',
    section_key: 'executive_summary',
    display_order: 5,
    fields: [
      {
        field_key: 'summary',
        label: 'Executive Summary',
        placeholder: 'This will be auto-generated from your previous sections. You can edit it here before submitting.',
        field_type: 'textarea',
        required: true,
        display_order: 0,
        ai_prompt_hint: 'Synthesise all sections into a funding-ready executive summary in plain prose.',
      },
    ],
  },
];

export async function getTemplateForEvent(eventId: string): Promise<EventTemplateWithSections | null> {
  const { data: template, error } = await supabase
    .from('event_templates')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error || !template) return null;

  const { data: sections, error: secErr } = await supabase
    .from('template_sections')
    .select('*')
    .eq('template_id', template.id)
    .order('display_order', { ascending: true });

  if (secErr || !sections) return { ...template, sections: [] };

  const sectionIds = sections.map(s => s.id);
  const { data: fields } = sectionIds.length > 0
    ? await supabase
        .from('template_fields')
        .select('*')
        .in('section_id', sectionIds)
        .order('display_order', { ascending: true })
    : { data: [] };

  const sectionsWithFields = sections.map(s => ({
    ...s,
    fields: (fields ?? []).filter(f => f.section_id === s.id),
  }));

  return { ...template, sections: sectionsWithFields };
}

export async function getTemplateForProposal(proposalId: string): Promise<EventTemplateWithSections | null> {
  const { data: proposal } = await supabase
    .from('proposals')
    .select('template_id')
    .eq('id', proposalId)
    .maybeSingle();

  if (!proposal?.template_id) return null;

  const { data: template } = await supabase
    .from('event_templates')
    .select('*')
    .eq('id', proposal.template_id)
    .maybeSingle();

  if (!template) return null;

  const { data: sections } = await supabase
    .from('template_sections')
    .select('*')
    .eq('template_id', template.id)
    .order('display_order', { ascending: true });

  if (!sections) return { ...template, sections: [] };

  const sectionIds = sections.map(s => s.id);
  const { data: fields } = sectionIds.length > 0
    ? await supabase
        .from('template_fields')
        .select('*')
        .in('section_id', sectionIds)
        .order('display_order', { ascending: true })
    : { data: [] };

  const sectionsWithFields = sections.map(s => ({
    ...s,
    fields: (fields ?? []).filter(f => f.section_id === s.id),
  }));

  return { ...template, sections: sectionsWithFields };
}

export async function createDefaultTemplate(eventId: string, createdBy: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('event_templates')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: template, error } = await supabase
    .from('event_templates')
    .insert({ event_id: eventId, created_by: createdBy, name: 'Proposal Template' })
    .select()
    .single();

  if (error || !template) return null;

  await upsertTemplateSections(template.id, DEFAULT_TEMPLATE_SECTIONS);
  return template.id;
}

async function upsertTemplateSections(templateId: string, sections: TemplateSectionDraft[]) {
  await supabase.from('template_sections').delete().eq('template_id', templateId);

  for (const sec of sections) {
    const { data: insertedSection } = await supabase
      .from('template_sections')
      .insert({
        template_id: templateId,
        title: sec.title,
        description: sec.description,
        section_key: sec.section_key,
        display_order: sec.display_order,
      })
      .select()
      .single();

    if (!insertedSection) continue;

    const fieldRows = sec.fields.map((f: TemplateFieldDraft) => ({
      section_id: insertedSection.id,
      field_key: f.field_key,
      label: f.label,
      placeholder: f.placeholder,
      field_type: f.field_type,
      required: f.required,
      display_order: f.display_order,
      ai_prompt_hint: f.ai_prompt_hint,
    }));

    if (fieldRows.length > 0) {
      await supabase.from('template_fields').insert(fieldRows);
    }
  }
}

export async function upsertTemplate(
  eventId: string,
  createdBy: string,
  templateName: string,
  sections: TemplateSectionDraft[]
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('event_templates')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  let templateId: string;

  if (existing) {
    const { error } = await supabase
      .from('event_templates')
      .update({ name: templateName, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return null;
    templateId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from('event_templates')
      .insert({ event_id: eventId, created_by: createdBy, name: templateName })
      .select()
      .single();
    if (error || !created) return null;
    templateId = created.id;
  }

  await upsertTemplateSections(templateId, sections);
  return templateId;
}
