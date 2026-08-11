import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../../redux/slices/crmSlice';
import { StatCard, LeadFunnelChart, LeadSourceChart, DailyLeadsChart, CounselorPerformanceChart } from '../../components/crm/CRMStats';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CRMDashboard() {
  const dispatch = useDispatch();
  const { dashboard, loading, error } = useSelector((s) => s.crm);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const stats = dashboard?.stats || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your admission pipeline</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Leads" value={stats.total_leads} />
        <StatCard title="New Leads" value={stats.new_leads} color="brand" />
        <StatCard title="Contacted" value={stats.contacted} />
        <StatCard title="Interested" value={stats.interested} color="green" />
        <StatCard title="Follow-up Due" value={stats.follow_up} color="amber" />
        <StatCard title="Applications" value={stats.applications} />
        <StatCard title="Admissions" value={stats.admissions} color="green" />
        <StatCard title="Lost Leads" value={stats.lost_leads} color="red" />
        <StatCard title="Conversion Rate" value={`${stats.conversion_rate}%`} color="green" />
        <StatCard title="Revenue" value={`₹${Number(dashboard?.totalRevenue || 0).toLocaleString()}`} color="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadFunnelChart data={dashboard?.funnel || []} />
        <LeadSourceChart data={dashboard?.sources || []} />
        <DailyLeadsChart data={dashboard?.dailyLeads || []} />
        <CounselorPerformanceChart data={dashboard?.counselorPerformance || []} />
      </div>
    </div>
  );
}
