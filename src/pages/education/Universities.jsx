import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchUniversities, createUniversity, updateUniversity, deleteUniversity, setUniversityFilters,
} from '../../redux/slices/educationSlice';
import UniversityTable from '../../components/education/UniversityTable';
// import UniversityAssignSpecializationsModal from '../../components/education/UniversityAssignSpecializationsModal';
import UniversityForm from '../../components/education/UniversityForm';
import UniversityApprovalForm from '../../components/education/UniversityApprovalForm';
import UniversityFaqForm from '../../components/education/UniversityFaqForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Pagination from '../../components/education/Pagination';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { SkeletonTable } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { universityApprovalService, universityFaqService } from '../../services/educationService';
import { ENTITY_STATUSES, UNIVERSITY_TYPES, PAGE_SIZE, formatLabel } from '../../utils/educationConstants';

export default function Universities() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { universities, universityPagination, universityFilters, loading, saving } = useSelector((s) => s.education);

  const [search, setSearch] = useState(universityFilters.search || '');
  const [status, setStatus] = useState(universityFilters.status || '');
  const [type, setType] = useState(universityFilters.type || '');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalSaving, setApprovalSaving] = useState(false);
  const [faqTarget, setFaqTarget] = useState(null);
  const [faqSaving, setFaqSaving] = useState(false);

  const filters = { search, status, type };

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(setUniversityFilters(filters));
      dispatch(fetchUniversities({ ...filters, page, limit: PAGE_SIZE, sortBy: 'name' }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, search, status, type, page]);

  const handleCreate = async (data) => {
    try {
      await dispatch(createUniversity(data)).unwrap();
      toast.success('University created');
      setShowForm(false);
      dispatch(fetchUniversities({ ...filters, page, limit: PAGE_SIZE, sortBy: 'name' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateUniversity({
        id: editItem.uuid || editItem.id,
        data,
      })).unwrap();
      toast.success('University updated');
      setEditItem(null);
      dispatch(fetchUniversities({ ...filters, page, limit: PAGE_SIZE, sortBy: 'name' }));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update university');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteUniversity(deleteTarget.id)).unwrap();
      toast.success('University deleted');
      setDeleteTarget(null);
      dispatch(fetchUniversities({ ...filters, page, limit: PAGE_SIZE, sortBy: 'name' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleCreateApproval = async (data) => {
    setApprovalSaving(true);
    try {
      await universityApprovalService.create(data);
      toast.success('Approval added');
      setApprovalTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add approval');
    } finally {
      setApprovalSaving(false);
    }
  };

  const handleCreateFaq = async (data) => {
    setFaqSaving(true);
    try {
      await universityFaqService.create(data);
      toast.success('FAQ added');
      setFaqTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add FAQ');
    } finally {
      setFaqSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setType('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[
            { label: 'Education', to: '/crm/education' },
            { label: 'Universities' },
          ]} />
          <h1 className="text-2xl font-bold text-slate-900">University Management</h1>
          <p className="text-sm text-slate-500">{universityPagination.total || 0} institutions in the catalogue</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add University
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search name, code or location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
        </select>
        <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {UNIVERSITY_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
        </select>
        {(search || status || type) && (
          <button className="btn-secondary" onClick={clearFilters}><X className="h-4 w-4" /> Clear</button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : universities.length === 0 ? (
        <EmptyState
          title="No universities found"
          description="Add the first university to start building your course catalogue"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}>Add University</button>}
        />
      ) : (
        <>
          <UniversityTable
            universities={universities}
            onView={(u) => navigate(`/crm/education/universities/${u.id}`)}
            onEdit={setEditItem}
            onDelete={setDeleteTarget}
            onAddApprovals={setApprovalTarget}
            onAddFaqs={setFaqTarget}
            // onAssignSpecializations={setAssignTarget}
          />
          <Pagination
            page={page}
            pages={universityPagination.pages}
            total={universityPagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add University" size="xl">
        <UniversityForm onSubmit={handleCreate} loading={saving} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit University" size="xl">
        {editItem && <UniversityForm key={editItem.id} defaultValues={editItem} onSubmit={handleUpdate} loading={saving} onCancel={() => setEditItem(null)} />}
      </Modal>

      <Modal
        open={!!approvalTarget}
        onClose={() => !approvalSaving && setApprovalTarget(null)}
        title="Add University Approval"
        size="lg"
      >
        {approvalTarget && (
          <UniversityApprovalForm
            key={approvalTarget.uuid || approvalTarget.id}
            university={approvalTarget}
            onSubmit={handleCreateApproval}
            loading={approvalSaving}
            onCancel={() => setApprovalTarget(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!faqTarget}
        onClose={() => !faqSaving && setFaqTarget(null)}
        title="Add University FAQ"
        size="lg"
      >
        {faqTarget && (
          <UniversityFaqForm
            key={faqTarget.uuid || faqTarget.id}
            university={faqTarget}
            onSubmit={handleCreateFaq}
            loading={faqSaving}
            onCancel={() => setFaqTarget(null)}
          />
        )}
      </Modal>

      {/* <UniversityAssignSpecializationsModal
        open={!!assignTarget}
        university={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => {
          dispatch(fetchUniversities({ ...filters, page, limit: PAGE_SIZE, sortBy: 'name' }));
        }}
      /> */}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete University"
        message={`Delete ${deleteTarget?.name}? Courses, specializations and fee structures linked to this university will also be removed.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
