import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Users, FileText, MessageSquare, Award, RotateCcw, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Notification, NotificationType } from '../types/database';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const base = 'h-4 w-4';
  switch (type) {
    case 'collaborator_invited':
    case 'collaborator_joined':
      return <UserPlus className={`${base} text-blue-500`} />;
    case 'collaborator_submitted':
    case 'status_change':
      return <FileText className={`${base} text-gray-500`} />;
    case 'revision_request':
      return <RotateCcw className={`${base} text-amber-500`} />;
    case 'approval':
      return <Award className={`${base} text-green-500`} />;
    case 'rejection':
      return <Award className={`${base} text-red-500`} />;
    case 'review_assigned':
      return <Users className={`${base} text-blue-500`} />;
    case 'comment':
      return <MessageSquare className={`${base} text-gray-500`} />;
    default:
      return <Bell className={`${base} text-gray-400`} />;
  }
}

interface Props {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications_panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  async function fetchNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications(data ?? []);
    setLoading(false);
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function deleteNotification(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col"
      style={{ maxHeight: '520px' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bell className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No notifications yet</p>
            <p className="text-xs text-gray-500 mt-1">You'll see updates about your proposals and collaborations here.</p>
          </div>
        ) : (
          <ul>
            {notifications.map(n => {
              const inner = (
                <div
                  className={`flex items-start gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/40' : ''}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!n.read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={e => deleteNotification(n.id, e)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );

              return (
                <li key={n.id} className="border-b border-gray-50 last:border-0">
                  {n.link ? (
                    <Link to={n.link} onClick={() => { markRead(n.id); onClose(); }}>
                      {inner}
                    </Link>
                  ) : inner}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
