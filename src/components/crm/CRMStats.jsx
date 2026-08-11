import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export function StatCard({ title, value, subtitle, color = 'brand' }) {
  const colors = {
    brand: 'border-l-brand-600',
    green: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
  };
  return (
    <div className={`card border-l-4 ${colors[color]}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value ?? 0}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function LeadFunnelChart({ data = [] }) {
  const funnelOrder = ['NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'ADMISSION_CONFIRMED'];
  const chartData = funnelOrder.map((status) => {
    const item = data.find((d) => d.status === status);
    return { name: status.replace(/_/g, ' '), count: parseInt(item?.count || 0, 10) };
  });

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-slate-900">Lead Funnel</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadSourceChart({ data = [] }) {
  const chartData = data.map((d) => ({
    name: d.lead_source?.replace(/_/g, ' ') || d.leadSource?.replace(/_/g, ' ') || 'Unknown',
    value: parseInt(d.count, 10),
  }));

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-slate-900">Lead Sources</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyLeadsChart({ data = [] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    count: parseInt(d.count, 10),
  }));

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-slate-900">Leads (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CounselorPerformanceChart({ data = [] }) {
  const chartData = data.map((d) => ({
    name: d.name?.split(' ')[0] || 'Unknown',
    count: parseInt(d.count, 10),
  }));

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-slate-900">Leads by Counselor</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
