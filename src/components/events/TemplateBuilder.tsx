import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, Save,
  GripVertical, LayoutList, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types/database';
import { TemplateSectionDraft, TemplateFieldDraft } from '../../types/database';
import {
  getTemplateForEvent,
  upsertTemplate,
  DEFAULT_TEMPLATE_SECTIONS,
} from '../../services/templateService';

interface Props {
  event: Event;
  isOwner: boolean;
}

function generateKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || `section_${Date.now()}`;
}

function generateFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || `field_${Date.now()}`;
}

function FieldRow({
  field,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  readOnly,
}: {
  field: TemplateFieldDraft;
  onChange: (f: TemplateFieldDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
      <GripVertical className="h-4 w-4 text-gray-300 mt-2.5 flex-shrink-0" />
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={field.label}
          onChange={e => onChange({ ...field, label: e.target.value, field_key: generateFieldKey(e.target.value) })}
          placeholder="Field label"
          disabled={readOnly}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none disabled:bg-gray-100 disabled:text-gray-500"
        />
        <input
          type="text"
          value={field.placeholder}
          onChange={e => onChange({ ...field, placeholder: e.target.value })}
          placeholder="Helper text (placeholder)"
          disabled={readOnly}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none disabled:bg-gray-100 disabled:text-gray-500"
        />
        <div className="flex items-center gap-3 sm:col-span-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="radio"
              name={`field_type_${field.field_key}_${field.display_order}`}
              checked={field.field_type === 'textarea'}
              onChange={() => onChange({ ...field, field_type: 'textarea' })}
              disabled={readOnly}
              className="accent-blue-600"
            />
            Long text
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="radio"
              name={`field_type_${field.field_key}_${field.display_order}`}
              checked={field.field_type === 'text'}
              onChange={() => onChange({ ...field, field_type: 'text' })}
              disabled={readOnly}
              className="accent-blue-600"
            />
            Short text
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => onChange({ ...field, required: e.target.checked })}
              disabled={readOnly}
              className="accent-blue-600 rounded"
            />
            Required
          </label>
        </div>
      </div>
      {!readOnly && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
            title="Delete field"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  readOnly,
}: {
  section: TemplateSectionDraft;
  index: number;
  total: number;
  onChange: (s: TemplateSectionDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  readOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  const addField = () => {
    const newField: TemplateFieldDraft = {
      field_key: `field_${Date.now()}`,
      label: '',
      placeholder: '',
      field_type: 'textarea',
      required: true,
      display_order: section.fields.length,
      ai_prompt_hint: null,
    };
    onChange({ ...section, fields: [...section.fields, newField] });
  };

  const updateField = (i: number, f: TemplateFieldDraft) => {
    const fields = [...section.fields];
    fields[i] = { ...f, display_order: i };
    onChange({ ...section, fields });
  };

  const deleteField = (i: number) => {
    const fields = section.fields.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, display_order: idx }));
    onChange({ ...section, fields });
  };

  const moveField = (i: number, dir: -1 | 1) => {
    const fields = [...section.fields];
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    [fields[i], fields[j]] = [fields[j], fields[i]];
    onChange({ ...section, fields: fields.map((f, idx) => ({ ...f, display_order: idx })) });
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {readOnly ? (
            <p className="text-sm font-semibold text-gray-900">{section.title || 'Untitled Section'}</p>
          ) : (
            <input
              type="text"
              value={section.title}
              onChange={e => onChange({ ...section, title: e.target.value, section_key: generateKey(e.target.value) })}
              placeholder="Section title"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none focus:ring-0 border-none p-0 placeholder-gray-400"
            />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!readOnly && (
            <>
              <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-30" title="Move section up">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-30" title="Move section down">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button onClick={onDelete} className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors" title="Delete section">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={() => setExpanded(v => !v)} className="p-1 rounded text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-3">
          {!readOnly && (
            <input
              type="text"
              value={section.description}
              onChange={e => onChange({ ...section, description: e.target.value })}
              placeholder="Section description (optional — helps officers understand what to write)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none text-gray-600"
            />
          )}
          {readOnly && section.description && (
            <p className="text-xs text-gray-500">{section.description}</p>
          )}

          {section.fields.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No fields yet. Add a field below.</p>
          )}

          <div className="space-y-2">
            {section.fields.map((f, i) => (
              <FieldRow
                key={i}
                field={f}
                onChange={updated => updateField(i, updated)}
                onDelete={() => deleteField(i)}
                onMoveUp={() => moveField(i, -1)}
                onMoveDown={() => moveField(i, 1)}
                isFirst={i === 0}
                isLast={i === section.fields.length - 1}
                readOnly={readOnly}
              />
            ))}
          </div>

          {!readOnly && (
            <button
              onClick={addField}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors mt-1"
            >
              <Plus className="h-3.5 w-3.5" />Add field
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TemplateBuilder({ event, isOwner }: Props) {
  const { user } = useAuth();
  const [sections, setSections] = useState<TemplateSectionDraft[]>([]);
  const [templateName, setTemplateName] = useState('Proposal Template');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    const tpl = await getTemplateForEvent(event.id);
    if (tpl) {
      setHasTemplate(true);
      setTemplateName(tpl.name);
      setSections(tpl.sections.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        section_key: s.section_key,
        display_order: s.display_order,
        fields: s.fields.map(f => ({
          id: f.id,
          field_key: f.field_key,
          label: f.label,
          placeholder: f.placeholder,
          field_type: f.field_type,
          required: f.required,
          display_order: f.display_order,
          ai_prompt_hint: f.ai_prompt_hint,
        })),
      })));
    } else {
      setSections(DEFAULT_TEMPLATE_SECTIONS.map(s => ({ ...s, fields: s.fields.map(f => ({ ...f })) })));
    }
    setLoading(false);
  }, [event.id]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const id = await upsertTemplate(event.id, user.id, templateName, sections);
    if (!id) {
      setError('Failed to save template. Please try again.');
    } else {
      setHasTemplate(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleReset = () => {
    setSections(DEFAULT_TEMPLATE_SECTIONS.map(s => ({ ...s, fields: s.fields.map(f => ({ ...f })) })));
    setShowResetConfirm(false);
  };

  const addSection = () => {
    setSections(prev => [
      ...prev,
      {
        title: '',
        description: '',
        section_key: `section_${Date.now()}`,
        display_order: prev.length,
        fields: [],
      },
    ]);
  };

  const updateSection = (i: number, s: TemplateSectionDraft) => {
    setSections(prev => {
      const next = [...prev];
      next[i] = { ...s, display_order: i };
      return next;
    });
  };

  const deleteSection = (i: number) => {
    setSections(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, display_order: idx })));
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next.map((s, idx) => ({ ...s, display_order: idx })));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const readOnly = !isOwner;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {readOnly ? (
            <h3 className="text-base font-semibold text-gray-900">{templateName}</h3>
          ) : (
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="text-base font-semibold text-gray-900 bg-transparent outline-none border-none focus:ring-0 p-0 w-full"
            />
          )}
          <p className="text-sm text-gray-500 mt-0.5">
            {sections.length} section{sections.length !== 1 ? 's' : ''} &middot; {sections.reduce((n, s) => n + s.fields.length, 0)} fields
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />Reset to default
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saved ? (
                <><CheckCircle2 className="h-4 w-4" />Saved</>
              ) : (
                <><Save className="h-4 w-4" />{saving ? 'Saving...' : hasTemplate ? 'Save Changes' : 'Save Template'}</>
              )}
            </button>
          </div>
        )}
      </div>

      {!hasTemplate && !readOnly && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Template not saved yet</p>
            <p className="text-xs mt-0.5 text-amber-700">Officers cannot submit proposals to this event until the template is saved. The default 6-section structure is pre-filled — customise and save to continue.</p>
          </div>
        </div>
      )}

      {event.status === 'open' && hasTemplate && !readOnly && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <LayoutList className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>This event is open and may have active proposals. Changes to the template will only affect proposals started after saving.</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="space-y-3">
        {sections.map((s, i) => (
          <SectionCard
            key={i}
            section={s}
            index={i}
            total={sections.length}
            onChange={updated => updateSection(i, updated)}
            onDelete={() => deleteSection(i)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all"
        >
          <Plus className="h-4 w-4" />Add Section
        </button>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Reset to default template?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will replace all your current sections and fields with the standard 6-section structure. You will still need to save to apply the change.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
