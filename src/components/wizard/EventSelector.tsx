import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useWizard } from '../../contexts/ProposalWizardContext';
import { Event } from '../../types/database';

export function EventSelector() {
  const { proposal, updateEventId } = useWizard();
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadOpenEvents();
  }, []);

  useEffect(() => {
    if (proposal?.event_id && events.length > 0) {
      const ev = events.find(e => e.id === proposal.event_id) || null;
      setSelectedEvent(ev);
    } else if (!proposal?.event_id) {
      setSelectedEvent(null);
    }
  }, [proposal?.event_id, events]);

  const loadOpenEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'open')
      .order('start_date', { ascending: true, nullsFirst: false });
    setEvents(data || []);
    setLoading(false);
  };

  const handleSelect = async (event: Event | null) => {
    setOpen(false);
    setSelectedEvent(event);
    await updateEventId(event?.id ?? null);
  };

  if (loading || events.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition-all ${
          selectedEvent
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        <Calendar className="h-4 w-4 flex-shrink-0" />
        <span className="truncate max-w-40">
          {selectedEvent ? selectedEvent.title : 'Select event (optional)'}
        </span>
        {selectedEvent ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); handleSelect(null); }}
            className="ml-1 text-blue-400 hover:text-blue-600 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500">Submit to an open event</p>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {events.map(ev => (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleSelect(ev)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                  {ev.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{ev.description}</p>
                  )}
                  {ev.end_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Closes {new Date(ev.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {selectedEvent?.id === ev.id && (
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
