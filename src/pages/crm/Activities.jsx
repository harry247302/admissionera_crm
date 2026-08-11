import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeads, fetchLeadActivities } from '../../redux/slices/leadSlice';
import LeadActivityTimeline from '../../components/crm/LeadActivityTimeline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Activities() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.leads);

  useEffect(() => {
    dispatch(fetchLeads({ limit: 5, sortBy: 'updated_at', sortOrder: 'DESC' }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recent Activities</h1>
      <p className="text-sm text-slate-500">View activity timelines on individual lead detail pages</p>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          {items.map((lead) => (
            <LeadActivityBlock key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadActivityBlock({ lead }) {
  const dispatch = useDispatch();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    dispatch(fetchLeadActivities(lead.id)).unwrap().then(setActivities).catch(() => setActivities([]));
  }, [dispatch, lead.id]);

  return (
    <div className="card">
      <h3 className="font-medium mb-3">{lead.fullName} <span className="text-xs text-slate-400">({lead.leadCode})</span></h3>
      <LeadActivityTimeline activities={activities} />
    </div>
  );
}
