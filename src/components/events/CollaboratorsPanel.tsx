import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Crown, Users, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EventOrganiser, Profile } from '../../types/database';

interface CollaboratorEntry extends EventOrganiser {
  profile: Profile;
}

interface Props {
  eventId: string;
  ownerId: string;
}

export function CollaboratorsPanel({ eventId, ownerId }: Props) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.id === ownerId;

  useEffect(() => { loadCollaborators(); }, [eventId]);

  const loadCollaborators = async () => {
    const { data } = await supabase
      .from('event_organisers')
      .select('*, profile:profiles!event_organisers_organiser_id_fkey(*)')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true });
    setCollaborators((data as CollaboratorEntry[]) || []);
    setLoading(false);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const existingIds = collaborators.map(c => c.organiser_id);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${q}%`)
      .or(`role.eq.organizer,roles.cs.{"organizer"}`)
      .not('id', 'in', `(${existingIds.join(',')})`)
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
  };

  const addCollaborator = async (profile: Profile) => {
    setAddingId(profile.id);
    const { error } = await supabase
      .from('event_organisers')
      .insert({ event_id: eventId, organiser_id: profile.id, role: 'collaborator' });
    if (!error) {
      setCollaborators(prev => [...prev, {
        event_id: eventId,
        organiser_id: profile.id,
        role: 'collaborator',
        joined_at: new Date().toISOString(),
        profile,
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setAddingId(null);
  };

  const removeCollaborator = async (organiserId: string) => {
    if (organiserId === ownerId) return;
    setRemovingId(organiserId);
    const { error } = await supabase
      .from('event_organisers')
      .delete()
      .eq('event_id', eventId)
      .eq('organiser_id', organiserId);
    if (!error) {
      setCollaborators(prev => prev.filter(c => c.organiser_id !== organiserId));
    }
    setRemovingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="h-5 w-5 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-900">Collaborators</h2>
        <span className="ml-auto text-xs text-gray-400">{collaborators.length} member{collaborators.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {collaborators.map(c => (
            <div key={c.organiser_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-blue-700">
                  {c.profile.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.profile.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{c.profile.organization || c.profile.job_title || 'Organiser'}</p>
              </div>
              {c.role === 'owner' ? (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Crown className="h-3 w-3" />Owner
                </span>
              ) : (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Collaborator</span>
              )}
              {isOwner && c.role !== 'owner' && (
                <button
                  onClick={() => removeCollaborator(c.organiser_id)}
                  disabled={removingId === c.organiser_id}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="relative">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search organisers to add..."
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
            {searching && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600" />}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
              {searchResults.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => addCollaborator(profile)}
                  disabled={addingId === profile.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-700">
                      {profile.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
                    <p className="text-xs text-gray-400">{profile.organization || 'Organiser'}</p>
                  </div>
                  <UserPlus className="h-4 w-4 text-blue-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
