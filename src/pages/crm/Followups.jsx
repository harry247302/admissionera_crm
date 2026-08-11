import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchFollowups, createFollowup, updateFollowup } from '../../redux/slices/followupSlice';
import { fetchCounselors } from '../../redux/slices/counselorSlice';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { FOLLOWUP_TYPES, FOLLOWUP_STATUSES, formatDate, formatDateTime } from '../../utils/crmConstants';
import { useForm } from 'react-hook-form';

export default function Followups() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.followups);
  const { items: counselors } = useSelector((s) => s.counselors);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    dispatch(fetchFollowups());
    dispatch(fetchCounselors());
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(createFollowup({ ...data, leadId: parseInt(data.leadId, 10), counselorId: data.counselorId ? parseInt(data.counselorId, 10) : null })).unwrap();
      toast.success('Follow-up scheduled');
      setShowForm(false);
      reset();
    } catch (err) {
      toast.error(err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await dispatch(updateFollowup({ id, data: { status } })).unwrap();
      toast.success('Follow-up updated');
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Follow-ups</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Schedule</button>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="No follow-ups scheduled" />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{f.leadName} <span className="text-xs text-slate-400">({f.leadCode})</span></p>
                <p className="text-sm text-slate-500">{formatDate(f.followupDate)} {f.followupTime} · {f.followupType?.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400">Counselor: {f.counselorName || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={f.status} />
                <select className="input w-auto text-xs" value={f.status} onChange={(e) => handleStatusUpdate(f.id, e.target.value)}>
                  {FOLLOWUP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Schedule Follow-up">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Lead ID *</label><input className="input" type="number" {...register('leadId', { required: true })} /></div>
          <div><label className="label">Counselor</label>
            <select className="input" {...register('counselorId')}>
              <option value="">Select</option>
              {counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date *</label><input type="date" className="input" {...register('followupDate', { required: true })} /></div>
            <div><label className="label">Time</label><input type="time" className="input" {...register('followupTime')} /></div>
          </div>
          <div><label className="label">Type</label>
            <select className="input" {...register('followupType')}>
              {FOLLOWUP_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Notes</label><textarea className="input" {...register('notes')} /></div>
          <button type="submit" className="btn-primary w-full">Schedule</button>
        </form>
      </Modal>
    </div>
  );
}
