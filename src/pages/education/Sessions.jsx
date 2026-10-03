import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSession, fetchSessions, updateSessionStatus } from '../../redux/slices/educationSlice';
import SessionForm from '../../components/education/SessionForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

function isSessionActive(session) {
  return session?.status === true
    || session?.status === 'ACTIVE'
    || session?.status === 'active'
    || session?.is_active === true;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 border-t border-slate-100 px-4 py-4 first:border-t-0">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="ml-auto h-5 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function Sessions() {
  const dispatch = useDispatch();
  const {
    sessions,
    sessionsLoading: loading,
    sessionsLoaded: loaded,
    sessionsError: error,
    sessionStatusUpdating: statusUpdating,
    saving,
  } = useSelector((state) => state.education);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleCreate = async (data) => {
    try {
      await dispatch(createSession(data)).unwrap();
      toast.success('Session created');
      setShowForm(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to create session');
    }
  };

  const handleStatusChange = async (session, status) => {
    if (!session.id || isSessionActive(session) === status) return;
    try {
      await dispatch(updateSessionStatus({ id: session.id, status, previous: session.status })).unwrap();
      toast.success(`${session.name} marked ${status ? 'active' : 'inactive'}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update status');
    }
  };

  const refresh = () => dispatch(fetchSessions({ force: true }));
  const openForm = () => setShowForm(true);

  let content;
  if (!loaded && loading) {
    content = <TableSkeleton />;
  } else if (error && !sessions.length) {
    content = (
      <EmptyState
        title="Couldn’t load sessions"
        description={error}
        action={<button className="btn-secondary" onClick={refresh}>Try again</button>}
      />
    );
  } else if (!sessions.length) {
    content = (
      <EmptyState
        title="No sessions yet"
        description="Create a session to start managing admissions by academic year."
        action={<button className="btn-primary" onClick={openForm}>Add Session</button>}
      />
    );
  } else {
    content = (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const active = isSessionActive(session);
              return (
                <tr key={session.id || session.uuid || session.name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{session.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(session.start_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(session.expiry_date)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={active ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => handleStatusChange(session, e.target.value === 'ACTIVE')}
                      disabled={session.id in statusUpdating}
                      aria-label={`Status for ${session.name}`}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-60 ${
                        active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-400'
                          : 'border-red-200 bg-red-50 text-red-700 focus-visible:ring-red-400'
                      }`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

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
            Create academic sessions and mark whether they are active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh sessions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn-primary" onClick={openForm}>
            <Plus className="h-4 w-4" /> Add Session
          </button>
        </div>
      </div>

      {content}

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
