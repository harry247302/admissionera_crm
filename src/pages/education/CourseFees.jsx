import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchFeeStructures, fetchFeeStructureById, fetchUniversityOptions, fetchCourseOptions,
  createFeeStructure, updateFeeStructure, deleteFeeStructure, setFeeFilters, clearCurrentFee,
} from '../../redux/slices/educationSlice';
import { courseService } from '../../services/educationService';
import FeeStructureTable from '../../components/education/FeeStructureTable';
import FeeStructureForm from '../../components/education/FeeStructureForm';
import FeeBreakdown from '../../components/education/FeeBreakdown';
import Breadcrumb from '../../components/education/Breadcrumb';
import Pagination from '../../components/education/Pagination';
import UniversitySelect from '../../components/education/UniversitySelect';
import CourseSelect from '../../components/education/CourseSelect';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { SkeletonTable } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ENTITY_STATUSES, FEE_TYPES, PAGE_SIZE, formatLabel } from '../../utils/educationConstants';

export default function CourseFees() {
  const dispatch = useDispatch();
  const {
    feeStructures, feePagination, universityOptions, courseOptions, loading, saving,
  } = useSelector((s) => s.education);

  const [search, setSearch] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [feeType, setFeeType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formCourses, setFormCourses] = useState([]);

  useEffect(() => {
    dispatch(fetchUniversityOptions());
  }, [dispatch]);

  useEffect(() => {
    if (universityId) dispatch(fetchCourseOptions({ universityId }));
  }, [dispatch, universityId]);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(setFeeFilters({ search, universityId, courseId, feeType, status }));
      dispatch(fetchFeeStructures({ search, universityId, courseId, feeType, status, page, limit: PAGE_SIZE, sortBy: 'courseName' }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, search, universityId, courseId, feeType, status, page]);

  const loadFormCourses = useCallback(async (uniId) => {
    if (!uniId) {
      setFormCourses([]);
      return;
    }
    try {
      const res = await courseService.getOptions({ universityId: uniId });
      setFormCourses(res.data.courses || []);
    } catch {
      setFormCourses([]);
    }
  }, []);

  const handleCreate = async (data) => {
    try {
      await dispatch(createFeeStructure(data)).unwrap();
      toast.success('Fee structure saved');
      setShowForm(false);
      dispatch(fetchFeeStructures({ search, universityId, courseId, feeType, status, page, limit: PAGE_SIZE, sortBy: 'courseName' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateFeeStructure({ id: editItem.id, data })).unwrap();
      toast.success('Fee structure updated');
      setEditItem(null);
      dispatch(fetchFeeStructures({ search, universityId, courseId, feeType, status, page, limit: PAGE_SIZE, sortBy: 'courseName' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteFeeStructure(deleteTarget.id)).unwrap();
      toast.success('Fee structure deleted');
      setDeleteTarget(null);
      dispatch(fetchFeeStructures({ search, universityId, courseId, feeType, status, page, limit: PAGE_SIZE, sortBy: 'courseName' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const openView = async (item) => {
    const result = await dispatch(fetchFeeStructureById(item.id));
    if (fetchFeeStructureById.fulfilled.match(result)) setViewItem(result.payload);
    else toast.error(result.payload || 'Unable to load fee structure');
  };

  const openEdit = async (item) => {
    await loadFormCourses(item.universityId);
    const result = await dispatch(fetchFeeStructureById(item.id));
    if (fetchFeeStructureById.fulfilled.match(result)) setEditItem(result.payload);
    else toast.error(result.payload || 'Unable to load fee structure');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[
            { label: 'Education', to: '/crm/education' },
            { label: 'Course Fees' },
          ]} />
          <h1 className="text-2xl font-bold text-slate-900">Course Fee Management</h1>
          <p className="text-sm text-slate-500">Define semester-wise or year-wise fees. Totals are calculated automatically. One active structure per course.</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormCourses([]); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Add Fee Structure
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search course or university..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-56">
          <UniversitySelect
            universities={universityOptions}
            value={universityId}
            placeholder="Filter by university"
            onChange={(val) => { setUniversityId(val); setCourseId(''); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-56">
          <CourseSelect
            courses={courseOptions}
            universityId={universityId}
            value={courseId}
            placeholder="Filter by course"
            onChange={(val) => { setCourseId(val); setPage(1); }}
          />
        </div>
        <select className="input w-auto" value={feeType} onChange={(e) => { setFeeType(e.target.value); setPage(1); }}>
          <option value="">All fee types</option>
          {FEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
        </select>
        {(search || universityId || courseId || feeType || status) && (
          <button className="btn-secondary" onClick={() => { setSearch(''); setUniversityId(''); setCourseId(''); setFeeType(''); setStatus(''); setPage(1); }}>
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : feeStructures.length === 0 ? (
        <EmptyState
          title="No fee structures found"
          description="Select a university and course, then add semester-wise or year-wise fees"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}>Add Fee Structure</button>}
        />
      ) : (
        <>
          <FeeStructureTable
            structures={feeStructures}
            onView={openView}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
          <Pagination
            page={page}
            pages={feePagination.pages}
            total={feePagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Fee Structure" size="xl">
        <FeeStructureForm
          universities={universityOptions}
          courses={formCourses}
          onUniversityChange={loadFormCourses}
          onSubmit={handleCreate}
          loading={saving}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Fee Structure" size="xl">
        {editItem && (
          <FeeStructureForm
            universities={universityOptions}
            courses={formCourses}
            defaultValues={editItem}
            key={editItem.id}
            onUniversityChange={loadFormCourses}
            onSubmit={handleUpdate}
            loading={saving}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!viewItem}
        onClose={() => { setViewItem(null); dispatch(clearCurrentFee()); }}
        title="Fee breakdown"
        size="xl"
      >
        {viewItem && <FeeBreakdown structure={viewItem} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Fee Structure"
        message={`Delete the fee structure for ${deleteTarget?.courseName}? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
