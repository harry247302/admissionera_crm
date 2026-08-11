import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApplications } from '../../redux/slices/applicationSlice';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/crmConstants';

export default function Applications() {
  const dispatch = useDispatch();
  const { applications, loading } = useSelector((s) => s.applications);

  useEffect(() => { dispatch(fetchApplications()); }, [dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Applications</h1>

      {loading ? <LoadingSpinner /> : applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Applications are created from leads" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-3 px-3">App ID</th>
                <th className="py-3 px-3">Lead</th>
                <th className="py-3 px-3">University</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Documents</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-xs">{a.applicationCode}</td>
                  <td className="py-3 px-3">{a.leadName}</td>
                  <td className="py-3 px-3">{a.university || '—'}</td>
                  <td className="py-3 px-3">{a.course || '—'}</td>
                  <td className="py-3 px-3"><Badge status={a.status} /></td>
                  <td className="py-3 px-3"><Badge status={a.documentsStatus} /></td>
                  <td className="py-3 px-3"><Badge status={a.paymentStatus} /></td>
                  <td className="py-3 px-3">{formatDate(a.applicationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
