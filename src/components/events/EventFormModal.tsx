import { useState } from 'react';
import { X, Calendar, FileText, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Event, EventStatus } from '../../types/database';
import { captureError, mapErrorToUserMessage } from '../../services/errorHandling';

interface Props {
  event?: Event;
  onClose: () => void;
  onSaved: (event: Event) => void;
}

const STATUS_OPTIONS: { value: EventStatus; label: string; desc: string }[] = [
  { value: 'draft', label: 'Draft', desc: 'Not visible to officers yet' },
  { value: 'open', label: 'Open', desc: 'Officers can submit proposals' },
  { value: 'closed', label: 'Closed', desc: 'No new submissions accepted' },
  { value: 'archived', label: 'Archived', desc: 'Historical record only' },
];

export function EventFormModal({ event, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [status, setStatus] = useState<EventStatus>(event?.status ?? 'draft');
  const [startDate, setStartDate] = useState(
    event?.start_date ? event.start_date.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    event?.end_date ? event.end_date.slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!user) return;
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    try {
      if (event) {
        const { data, error: err } = await supabase
          .from('events')
          .update(payload)
          .eq('id', event.id)
          .select()
          .single();
        if (err) throw err;
        onSaved(data);
      } else {
        const { data, error: err } = await supabase
          .from('events')
          .insert({ ...payload, created_by: user.id })
          .select()
          .single();
        if (err) throw err;
        onSaved(data);
      }
    } catch (e: unknown) {
      captureError('events', 'save_event_failed', e, { eventId: event?.id ?? null, mode: event ? 'edit' : 'create' });
      setError(mapErrorToUserMessage(e, 'Unable to save event right now.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />Event Title
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Spring 2026 Innovation Hackathon"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />Description
              </span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this event about? What kind of proposals are you looking for?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />Start Date
                </span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />End Date
                </span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`text-left px-3.5 py-3 rounded-xl border-2 transition-all ${
                    status === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className={`text-sm font-medium ${status === opt.value ? 'text-blue-700' : 'text-gray-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3.5 py-2.5 rounded-xl">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : event ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
