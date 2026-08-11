import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports } from '../../redux/slices/crmSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { LeadSourceChart } from '../../components/crm/CRMStats';

const periods = [
  { value: 'today', label: 'Today' },
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
];

export default function Reports() {
  const dispatch = useDispatch();
  const { reports, reportsLoading } = useSelector((s) => s.crm);
  const [period, setPeriod] = useState('30');

  useEffect(() => { dispatch(fetchReports({ period })); }, [dispatch, period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {reportsLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold mb-4">Conversion Report</h3>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Total Leads" value={reports?.conversionReport?.total} />
              <Stat label="Converted" value={reports?.conversionReport?.converted} />
              <Stat label="Conversion Rate" value={
                reports?.conversionReport?.total > 0
                  ? `${((reports.conversionReport.converted / reports.conversionReport.total) * 100).toFixed(1)}%`
                  : '0%'
              } />
              <Stat label="Revenue" value={`₹${Number(reports?.revenueReport?.total || 0).toLocaleString()}`} />
            </div>
          </div>

          <LeadSourceChart data={reports?.sourceReport || []} />

          <div className="card lg:col-span-2">
            <h3 className="font-semibold mb-4">Counselor Performance</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Counselor</th>
                  <th className="py-2">Leads</th>
                  <th className="py-2">Admissions</th>
                  <th className="py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {(reports?.counselorReport || []).map((c, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2">{c.leads}</td>
                    <td className="py-2">{c.admissions}</td>
                    <td className="py-2">{c.leads > 0 ? `${((c.admissions / c.leads) * 100).toFixed(1)}%` : '0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Follow-up Report</h3>
            {(reports?.followupReport || []).map((f, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                <span>{f.status}</span>
                <span className="font-medium">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value ?? 0}</p>
    </div>
  );
}
