import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSession } from '../../redux/slices/educationSlice';
import SessionForm from '../../components/education/SessionForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Sessions() {
  const dispatch = useDispatch();
  const { sessions, saving } = useSelector((s) => s.education);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    try {
      await dispatch(createSession(data)).unwrap();
      toast.success('Session created');
      setShowForm(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to create session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[
            { label: 'Education', to: '/crm/education' },
            { label: 'Sessions' },
          ]} />
          <h1 className="text-2xl font-bold text-slate-900">Session Management</h1>
          <p className="text-sm text-slate-500">
            Create academic sessions with a start and expiry date.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Create a session to start managing admissions by academic year."
          action={<button className="btn-primary" onClick={() => setShowForm(true)}>Add Session</button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id || session.uuid || session.name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{session.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(session.start_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(session.expiry_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Session" size="md">
        <SessionForm
          onSubmit={handleCreate}
          loading={saving}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
