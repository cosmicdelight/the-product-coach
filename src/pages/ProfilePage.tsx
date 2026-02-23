import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { UserRole } from '../types/database';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileText,
  ArrowLeftRight,
} from 'lucide-react';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ProfilePage() {
  const { profile, user, activeRole, updateProfile, addRole, switchRole } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [organization, setOrganization] = useState(profile?.organization ?? '');
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');

  const [addingRole, setAddingRole] = useState<UserRole | null>(null);
  const [confirmRole, setConfirmRole] = useState<UserRole | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<UserRole | null>(null);
  const [roleError, setRoleError] = useState('');

  const currentRoles: UserRole[] = profile?.roles?.length
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : [];

  const allRoles: { role: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
    {
      role: 'officer',
      label: 'Innovator',
      description: 'Submit and manage innovation proposals. Track progress and collaborate with reviewers.',
      icon: <FileText className="h-6 w-6" />,
    },
    {
      role: 'organizer',
      label: 'Organiser',
      description: 'Review submitted proposals, assign reviewers, and manage the innovation pipeline.',
      icon: <Shield className="h-6 w-6" />,
    },
  ];

  const handleSaveProfile = async () => {
    setSaveState('saving');
    setSaveError('');
    const { error } = await updateProfile({ full_name: fullName, organization, job_title: jobTitle });
    if (error) {
      setSaveState('error');
      setSaveError(error.message);
    } else {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const handleAddRole = async (role: UserRole) => {
    setAddingRole(role);
    setRoleError('');
    const { error } = await addRole(role);
    setAddingRole(null);
    if (error) {
      setRoleError(error.message);
    } else {
      setConfirmRole(null);
      setRoleSuccess(role);
    }
  };

  const handleSwitchNow = (role: UserRole) => {
    switchRole(role);
    navigate(role === 'organizer' ? '/organizer/dashboard' : '/officer/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your personal information and role access.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500">Update your name, organisation, and role details.</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your organisation"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your job title"
                  />
                </div>
              </div>
            </div>

            {saveState === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              {saveState === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Changes saved successfully.
                </div>
              )}
              {saveState !== 'saved' && <div />}
              <button
                onClick={handleSaveProfile}
                disabled={saveState === 'saving'}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saveState === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Roles & Access</h2>
                <p className="text-sm text-gray-500">Add roles to access different parts of the platform.</p>
              </div>
            </div>
          </div>

          {roleError && (
            <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {roleError}
            </div>
          )}

          <div className="px-6 py-6 space-y-4">
            {allRoles.map(({ role, label, description, icon }) => {
              const hasRole = currentRoles.includes(role);
              const isActive = activeRole === role;
              const isConfirming = confirmRole === role;
              const isAdding = addingRole === role;
              const justAdded = roleSuccess === role;

              return (
                <div
                  key={role}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    hasRole
                      ? isActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          hasRole ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{label}</p>
                          {hasRole && isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          )}
                          {hasRole && !isActive && (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{description}</p>

                        {justAdded && !isActive && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Role added!
                            </span>
                            <button
                              onClick={() => handleSwitchNow(role)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                            >
                              Switch to this role now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {hasRole && !isActive && (
                        <button
                          onClick={() => handleSwitchNow(role)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          Switch
                        </button>
                      )}

                      {!hasRole && !isConfirming && (
                        <button
                          onClick={() => { setConfirmRole(role); setRoleError(''); }}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Add role
                        </button>
                      )}

                      {!hasRole && isConfirming && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirmRole(null)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddRole(role)}
                            disabled={isAdding}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                          >
                            {isAdding ? 'Adding...' : 'Confirm'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {!hasRole && isConfirming && (
                    <div className="mt-3 ml-15 pl-0 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg">
                      You are about to add the <strong>{label}</strong> role to your account. This will give you access to {role === 'organizer' ? 'review proposals and manage the innovation pipeline' : 'submit and manage innovation proposals'}.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
