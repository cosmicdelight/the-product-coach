import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { EventFormModal } from '../components/events/EventFormModal';
import { supabase } from '../lib/supabase';
import { Event, EventStatus } from '../types/database';
import { Calendar, Plus, ChevronRight, Users, FileText, Clock, CheckCircle, Archive, Pencil } from 'lucide-react';

const STATUS_CONFIG: Record<EventStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', icon: <Pencil className="h-3.5 w-3.5" /> },
  open: { label: 'Open', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  closed: { label: 'Closed', bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="h-3.5 w-3.5" /> },
  archived: { label: 'Archived', bg: 'bg-gray-100', text: 'text-gray-500', icon: <Archive className="h-3.5 w-3.5" /> },
};

interface EventWithCounts extends Event {
  proposal_count: number;
  organiser_count: number;
  my_role: 'owner' | 'collaborator';
}

export function EventsPage() {
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const [eventsRes, rolesRes] = await Promise.all([
      supabase
        .from('events')
        .select('*, event_organisers(count), proposals(count)')
        .order('created_at', { ascending: false }),
      supabase
        .from('event_organisers')
        .select('event_id, role')
        .eq('organiser_id', user?.id ?? ''),
    ]);

    if (eventsRes.error) { console.error(eventsRes.error); setLoading(false); return; }

    const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.event_id, r.role]));

    const mapped: EventWithCounts[] = (eventsRes.data || []).map((row: any) => ({
      ...row,
      proposal_count: row.proposals?.[0]?.count ?? 0,
      organiser_count: row.event_organisers?.[0]?.count ?? 0,
      my_role: roleMap.get(row.id) ?? 'collaborator',
    }));
    setEvents(mapped);
    setLoading(false);
  };

  const handleEventCreated = (event: Event) => {
    setEvents(prev => [{
      ...event,
      proposal_count: 0,
      organiser_count: 1,
      my_role: 'owner',
    }, ...prev]);
    setShowCreateModal(false);
  };

  const filtered = filterStatus === 'all' ? events : events.filter(e => e.status === filterStatus);

  const counts = {
    all: events.length,
    draft: events.filter(e => e.status === 'draft').length,
    open: events.filter(e => e.status === 'open').length,
    closed: events.filter(e => e.status === 'closed').length,
    archived: events.filter(e => e.status === 'archived').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500 mt-1">Manage hackathons, competitions, and other submission events</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />New Event
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'all', label: 'Total Events', icon: <Calendar className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
            { key: 'open', label: 'Open', icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
            { key: 'draft', label: 'Drafts', icon: <Pencil className="h-5 w-5 text-gray-500" />, bg: 'bg-gray-50' },
            { key: 'closed', label: 'Closed', icon: <Clock className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-50' },
          ].map(({ key, label, icon, bg }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as EventStatus | 'all')}
              className={`bg-white rounded-xl border-2 p-5 text-left transition-all hover:shadow-sm ${
                filterStatus === key ? 'border-blue-500' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">{counts[key as keyof typeof counts] ?? 0}</p>
                <div className={`${bg} p-2 rounded-lg`}>{icon}</div>
              </div>
              <p className="text-sm text-gray-500">{label}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            ['all', 'All'],
            ['draft', 'Drafts'],
            ['open', 'Open'],
            ['closed', 'Closed'],
            ['archived', 'Archived'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label} ({counts[key as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Calendar className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No events yet' : `No ${filterStatus} events`}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {filterStatus === 'all' ? 'Create your first event to start collecting proposals.' : ''}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />Create First Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(event => {
              const cfg = STATUS_CONFIG[event.status];
              return (
                <Link
                  key={event.id}
                  to={`/organizer/events/${event.id}`}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {event.title || 'Untitled Event'}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                        {event.my_role === 'owner' && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            Owner
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mb-3">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {event.proposal_count} proposal{event.proposal_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {event.organiser_count} organiser{event.organiser_count !== 1 ? 's' : ''}
                        </span>
                        {event.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(event.start_date).toLocaleDateString()}
                            {event.end_date && ` – ${new Date(event.end_date).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <EventFormModal
          onClose={() => setShowCreateModal(false)}
          onSaved={handleEventCreated}
        />
      )}
    </DashboardLayout>
  );
}
