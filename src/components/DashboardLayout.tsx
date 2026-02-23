import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lightbulb, LayoutDashboard, Bell, LogOut, Menu, X, User, ChevronDown, ArrowLeftRight, Settings, Calendar } from 'lucide-react';
import { UserRole } from '../types/database';
import { supabase } from '../lib/supabase';
import { NotificationsPanel } from './NotificationsPanel';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, activeRole, signOut, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const channel = supabase
      .channel('notif_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchUnreadCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function fetchUnreadCount() {
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setUnreadCount(count ?? 0);
  }

  const isOrganizer = activeRole === 'organizer';
  const dashPath = isOrganizer ? '/organizer/dashboard' : '/officer/dashboard';
  const availableRoles: UserRole[] = profile?.roles?.length ? profile.roles : profile?.role ? [profile.role] : [];
  const hasMultipleRoles = availableRoles.length > 1;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setProfileOpen(false);
    navigate(role === 'organizer' ? '/organizer/dashboard' : '/officer/dashboard');
  };

  const navActive = (path: string) =>
    location.pathname === path
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  const roleLabel = (role: UserRole) => role === 'organizer' ? 'Organiser' : 'Public Officer';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to={dashPath} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-blue-600 rounded-lg p-1.5">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Product Coach</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link to={dashPath} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${navActive(dashPath)}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {isOrganizer && (
                  <Link to="/organizer/events" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/organizer/events') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    <Calendar className="h-4 w-4" />
                    Events
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                  className={`relative p-2 rounded-lg transition-colors ${notifOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <NotificationsPanel onClose={() => setNotifOpen(false)} />
                )}
              </div>

              <div className="hidden md:block relative">
                <button
                  onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{activeRole ? roleLabel(activeRole) : ''}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4" />
                      Profile & Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    {hasMultipleRoles && (
                      <>
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Role</p>
                        </div>
                        {availableRoles.map(role => (
                          <button
                            key={role}
                            onClick={() => handleSwitchRole(role)}
                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                              activeRole === role
                                ? 'text-blue-700 bg-blue-50 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            {roleLabel(role)}
                            {activeRole === role && <span className="ml-auto text-xs text-blue-500">Active</span>}
                          </button>
                        ))}
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
            <Link to={dashPath} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${navActive(dashPath)}`} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard className="h-4 w-4" />Dashboard
            </Link>
            {isOrganizer && (
              <Link to="/organizer/events" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${location.pathname.startsWith('/organizer/events') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => setMobileOpen(false)}>
                <Calendar className="h-4 w-4" />Events
              </Link>
            )}
            {hasMultipleRoles && (
              <>
                <div className="border-t border-gray-100 pt-2 mt-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Switch Role</p>
                  {availableRoles.map(role => (
                    <button
                      key={role}
                      onClick={() => { handleSwitchRole(role); setMobileOpen(false); }}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeRole === role ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ArrowLeftRight className="h-4 w-4" />{roleLabel(role)}
                      {activeRole === role && <span className="ml-auto text-xs text-blue-500">Active</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="border-t border-gray-100 pt-1">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${navActive('/profile')}`}
              >
                <Settings className="h-4 w-4" />Profile & Settings
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                <LogOut className="h-4 w-4" />Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
