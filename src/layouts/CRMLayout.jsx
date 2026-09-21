import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, PhoneCall, CheckSquare, FileText,
  GraduationCap, UserCheck, Activity, BarChart3, LogOut, Menu, X,
  ChevronDown, Building2, BookOpen, Layers, IndianRupee, Landmark,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { logout } from '../redux/slices/authSlice';

const navItems = [
  { to: '/crm', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/crm/leads', label: 'Leads', icon: Users },
  { to: '/crm/followups', label: 'Follow-ups', icon: PhoneCall },
  { to: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/crm/applications', label: 'Applications', icon: FileText },
  { to: '/crm/admissions', label: 'Admissions', icon: GraduationCap },
  { to: '/crm/counselors', label: 'Counselors', icon: UserCheck },
  { to: '/crm/activities', label: 'Activities', icon: Activity },
  { to: '/crm/reports', label: 'Reports', icon: BarChart3 },
];

const educationItems = [
  { to: '/crm/education', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/crm/education/universities', label: 'Universities', icon: Landmark },
  { to: '/crm/education/courses', label: 'Courses', icon: BookOpen },
  { to: '/crm/education/specializations', label: 'Specializations', icon: Layers },
  { to: '/crm/education/admissions', label: 'Sessions', icon: GraduationCap },
  { to: '/crm/education/fees', label: 'Course Fees', icon: IndianRupee },
];

export default function CRMLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isEducation = location.pathname.startsWith('/crm/education');
  const [educationOpen, setEducationOpen] = useState(isEducation);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEducation) setEducationOpen(true);
  }, [isEducation]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/crm');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-700">
          <div>
            <h1 className="text-lg font-bold">AdmissionEra</h1>
            <p className="text-xs text-slate-400">CRM Module</p>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}

          <div className="pt-3">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Modules</p>
            <button
              type="button"
              onClick={() => setEducationOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isEducation ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                Education Management
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${educationOpen ? 'rotate-180' : ''}`} />
            </button>
            {educationOpen && (
              <div className="mt-1 space-y-1 border-l border-slate-700 ml-5 pl-3">
                {educationItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="shrink-0 border-t border-slate-700 p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">{isEducation ? 'Education Management' : 'CRM'}</h2>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
