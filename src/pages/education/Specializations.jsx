import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  setSpecializationFilters,
} from '../../redux/slices/educationSlice';
import SpecializationTable from '../../components/education/SpecializationTable';
import SpecializationForm from '../../components/education/SpecializationForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Pagination from '../../components/education/Pagination';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { SkeletonTable } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ENTITY_STATUSES, PAGE_SIZE, formatLabel } from '../../utils/educationConstants';

export default function Specializations() {
  const dispatch = useDispatch();
  const {
    specializations, specializationPagination, loading, saving,
  } = useSelector((s) => s.education);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listParams = { search, status, page, limit: PAGE_SIZE, sortBy: 'name' };

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(setSpecializationFilters({ search, status }));
      dispatch(fetchSpecializations(listParams));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, search, status, page]);

  const refreshList = () => {
    dispatch(fetchSpecializations(listParams));
  };

  const handleCreate = async (data) => {
    try {
      await dispatch(createSpecialization(data)).unwrap();
      toast.success('Specialization created');
      setShowForm(false);
      refreshList();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to create specialization');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateSpecialization({
        id: editItem.uuid || editItem.id,
        data,
      })).unwrap();
      toast.success('Specialization updated');
      setEditItem(null);
      refreshList();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update specialization');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSpecialization(deleteTarget.uuid || deleteTarget.id)).unwrap();
      toast.success('Specialization deleted');
      setDeleteTarget(null);
      refreshList();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to delete specialization');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[
            { label: 'Education', to: '/crm/education' },
            { label: 'Specializations' },
          ]} />
          <h1 className="text-2xl font-bold text-slate-900">Specialization Management</h1>
          <p className="text-sm text-slate-500">
            Manage the specialization catalog. Assign specializations to universities and courses separately.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Specialization
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, code, slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
        </select>
        {(search || status) && (
          <button className="btn-secondary" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : specializations.length === 0 ? (
        <EmptyState
          title="No specializations found"
          description="Add a specialization to the catalog"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}>Add Specialization</button>}
        />
      ) : (
        <>
          <SpecializationTable
            specializations={specializations}
            onEdit={setEditItem}
            onDelete={setDeleteTarget}
          />
          <Pagination
            page={page}
            pages={specializationPagination.pages}
            total={specializationPagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Specialization" size="lg">
        <SpecializationForm
          onSubmit={handleCreate}
          loading={saving}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Specialization" size="lg">
        {editItem && (
          <SpecializationForm
            defaultValues={editItem}
            key={editItem.uuid || editItem.id}
            onSubmit={handleUpdate}
            loading={saving}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Specialization"
        message={`Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
