import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { BookOpen, Building2, GraduationCap, IndianRupee, Layers, CheckCircle2 } from 'lucide-react';
import { fetchEducationDashboard } from '../../redux/slices/educationSlice';
import { StatCard } from '../../components/crm/CRMStats';
import Breadcrumb from '../../components/education/Breadcrumb';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/educationConstants';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

export default function EducationDashboard() {
  const dispatch = useDispatch();
  const { dashboard, loading, error } = useSelector((s) => s.education);

  useEffect(() => { dispatch(fetchEducationDashboard()); }, [dispatch]);

  if (loading && !dashboard) return <LoadingSpinner message="Loading education dashboard..." />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const stats = dashboard?.stats || {};

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[
          { label: 'CRM', to: '/crm' },
          { label: 'Education Management' },
        ]} />
        <h1 className="text-2xl font-bold text-slate-900">Education Dashboard</h1>
        <p className="text-sm text-slate-500">Universities, courses, specializations and fee structures at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Universities" value={stats.totalUniversities} />
        <StatCard title="Total Courses" value={stats.totalCourses} color="brand" />
        <StatCard title="Specializations" value={stats.totalSpecializations} />
        <StatCard title="Active Courses" value={stats.totalActiveCourses} color="green" />
        <StatCard title="Fee Structures" value={stats.totalFeeStructures} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <QuickLink to="/crm/education/universities" icon={Building2} label="Universities" hint="Add and manage institutions" />
        <QuickLink to="/crm/education/courses" icon={BookOpen} label="Courses" hint="Attach courses to a university" />
        <QuickLink to="/crm/education/specializations" icon={Layers} label="Specializations" hint="University → course → stream" />
        <QuickLink to="/crm/education/admissions" icon={GraduationCap} label="Sessions" hint="Academic session dates" />
        <QuickLink to="/crm/education/fees" icon={IndianRupee} label="Course Fees" hint="Semester or year-wise structures" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Courses by University</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboard?.coursesByUniversity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Courses by Level</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboard?.coursesByLevel || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Universities by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={dashboard?.universitiesByType || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {(dashboard?.universitiesByType || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Fee Distribution</h3>
          <p className="mb-3 text-xs text-slate-500">Active course fee totals by university</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboard?.feeDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
        <div>
          <p className="font-medium text-slate-900">Recommended workflow</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a university, add its courses, attach specializations to those courses, then define a semester-wise or year-wise fee structure. A course can have only one active fee structure at a time.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, hint }) {
  return (
    <Link to={to} className="card flex items-center gap-3 hover:border-brand-200 hover:shadow-sm">
      <div className="rounded-lg bg-brand-50 p-2 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </Link>
  );
}
