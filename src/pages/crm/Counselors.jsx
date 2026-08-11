import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCounselors } from '../../redux/slices/counselorSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function Counselors() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.counselors);

  useEffect(() => { dispatch(fetchCounselors()); }, [dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Counselors</h1>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="No counselors found" description="Counselor profiles are linked to user accounts" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.id} to={`/crm/counselors/${c.id}`} className="card hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">{c.name}</h3>
              <p className="text-sm text-slate-500">{c.email}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Total Leads" value={c.totalLeads} />
                <Stat label="Active" value={c.activeLeads} />
                <Stat label="Converted" value={c.convertedLeads} />
                <Stat label="Follow-ups Today" value={c.followupsToday} />
              </div>
              <p className="mt-3 text-sm font-medium text-brand-600">Conversion: {c.conversionRate}%</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold">{value ?? 0}</p>
    </div>
  );
}
