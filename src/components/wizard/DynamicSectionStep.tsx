import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { useWizard } from '../../contexts/ProposalWizardContext';
import { TemplateField } from '../../types/database';
import { SectionType } from '../../types/database';

interface Props {
  sectionKey: string;
  fields: TemplateField[];
  onGetFeedback?: () => void;
  onFieldsChange?: (fields: Record<string, string>) => void;
}

export function DynamicSectionStep({ sectionKey, fields, onGetFeedback, onFieldsChange }: Props) {
  const { sections, saveSection, nextStep, currentStep, saving, proposal } = useWizard();
  const sectionData = sections[sectionKey];

  const buildInitial = useCallback(() => {
    const content = sectionData?.content ?? {};
    const init: Record<string, string> = {};
    fields.forEach(f => { init[f.field_key] = typeof content[f.field_key] === 'string' ? content[f.field_key] : ''; });
    return init;
  }, [sectionData, fields]);

  const [values, setValues] = useState<Record<string, string>>(buildInitial);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setValues(buildInitial());
  }, [sectionKey, buildInitial]);

  useEffect(() => {
    onFieldsChange?.(values);
  }, [values, onFieldsChange]);

  const handleChange = (key: string, val: string) => {
    setValues(prev => {
      const next = { ...prev, [key]: val };
      return next;
    });
  };

  const requiredKeys = fields.filter(f => f.required).map(f => f.field_key);
  const allRequiredFilled = requiredKeys.every(k => (values[k] ?? '').trim().length > 0);
  const isCompleted = sectionData?.completed ?? false;

  const handleSave = async (completed: boolean) => {
    setSaveError(null);
    try {
      await saveSection(sectionKey as SectionType, values, completed);
      if (completed) nextStep();
    } catch {
      setSaveError('Failed to save. Please try again.');
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        This section has no fields configured. Contact your event organiser.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map(field => (
        <div key={field.field_key}>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {field.field_type === 'textarea' ? (
            <textarea
              value={values[field.field_key] ?? ''}
              onChange={e => handleChange(field.field_key, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-800 placeholder-gray-400 resize-none transition-all"
            />
          ) : (
            <input
              type="text"
              value={values[field.field_key] ?? ''}
              onChange={e => handleChange(field.field_key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
            />
          )}
        </div>
      ))}

      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{saveError}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onGetFeedback}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Get AI Feedback
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !allRequiredFilled}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isCompleted ? (
              <><CheckCircle className="h-4 w-4" />Next</>
            ) : (
              <>Complete & Next<ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>

      {!allRequiredFilled && (
        <p className="text-xs text-gray-400">Fill in all required fields (*) to complete this section.</p>
      )}
    </div>
  );
}
