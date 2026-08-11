import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdmissions } from '../../redux/slices/applicationSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/crmConstants';

export default function Admissions() {
  const dispatch = useDispatch();
  const { admissions, admissionsLoading } = useSelector((s) => s.applications);

  useEffect(() => { dispatch(fetchAdmissions()); }, [dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admissions</h1>

      {admissionsLoading ? <LoadingSpinner /> : admissions.length === 0 ? (
        <EmptyState title="No admissions yet" description="Convert leads to create admissions" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-3 px-3">Admission ID</th>
                <th className="py-3 px-3">Lead</th>
                <th className="py-3 px-3">University</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Counselor</th>
                <th className="py-3 px-3">Revenue</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-xs">{a.admissionCode}</td>
                  <td className="py-3 px-3">{a.leadName}</td>
                  <td className="py-3 px-3">{a.university || '—'}</td>
                  <td className="py-3 px-3">{a.course || '—'}</td>
                  <td className="py-3 px-3">{a.counselorName || '—'}</td>
                  <td className="py-3 px-3">₹{Number(a.revenue || 0).toLocaleString()}</td>
                  <td className="py-3 px-3">{formatDate(a.admissionDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
