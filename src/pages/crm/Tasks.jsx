import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { fetchTasks, createTask, updateTask } from '../../redux/slices/taskSlice';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { TASK_STATUSES, PRIORITIES, formatDate } from '../../utils/crmConstants';

export default function Tasks() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.tasks);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(createTask({ ...data, leadId: data.leadId ? parseInt(data.leadId, 10) : null })).unwrap();
      toast.success('Task created');
      setShowForm(false);
      reset();
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add Task</button>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="No tasks" />
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-slate-500">{t.leadName ? `${t.leadName} (${t.leadCode})` : 'No lead linked'}</p>
                <p className="text-xs text-slate-400">Due: {formatDate(t.dueDate)} · {t.assignedToName || 'Unassigned'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={t.priority} type="priority" />
                <Badge status={t.status} />
                <select className="input w-auto text-xs" value={t.status} onChange={(e) => dispatch(updateTask({ id: t.id, data: { status: e.target.value } }))}>
                  {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Task">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Task *</label><input className="input" {...register('title', { required: true })} /></div>
          <div><label className="label">Lead ID</label><input type="number" className="input" {...register('leadId')} /></div>
          <div><label className="label">Due Date</label><input type="date" className="input" {...register('dueDate')} /></div>
          <div><label className="label">Priority</label>
            <select className="input" {...register('priority')}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          <div><label className="label">Description</label><textarea className="input" {...register('description')} /></div>
          <button type="submit" className="btn-primary w-full">Create Task</button>
        </form>
      </Modal>
    </div>
  );
}
