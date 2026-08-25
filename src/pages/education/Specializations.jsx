import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchSpecializations, fetchUniversityOptions, fetchCourseOptions,
  createSpecialization, updateSpecialization, deleteSpecialization, setSpecializationFilters,
} from '../../redux/slices/educationSlice';
import { courseService } from '../../services/educationService';
import SpecializationTable from '../../components/education/SpecializationTable';
import SpecializationForm from '../../components/education/SpecializationForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Pagination from '../../components/education/Pagination';
import UniversitySelect from '../../components/education/UniversitySelect';
import CourseSelect from '../../components/education/CourseSelect';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { SkeletonTable } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ENTITY_STATUSES, PAGE_SIZE, formatLabel } from '../../utils/educationConstants';

export default function Specializations() {
  const dispatch = useDispatch();
  const {
    specializations, specializationPagination, universityOptions, courseOptions, loading, saving,
  } = useSelector((s) => s.education);

  const [search, setSearch] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formCourses, setFormCourses] = useState([]);

  useEffect(() => {
    dispatch(fetchUniversityOptions());
  }, [dispatch]);

  useEffect(() => {
    if (universityId) dispatch(fetchCourseOptions({ universityId }));
  }, [dispatch, universityId]);

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

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(setSpecializationFilters({ search, universityId, courseId, status }));
      dispatch(fetchSpecializations({ search, universityId, courseId, status, page, limit: PAGE_SIZE, sortBy: 'name' }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, search, universityId, courseId, status, page]);

  const handleCreate = async (data) => {
    try {
      await dispatch(createSpecialization(data)).unwrap();
      toast.success('Specialization created');
      setShowForm(false);
      dispatch(fetchSpecializations({ search, universityId, courseId, status, page, limit: PAGE_SIZE, sortBy: 'name' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateSpecialization({ id: editItem.id, data })).unwrap();
      toast.success('Specialization updated');
      setEditItem(null);
      dispatch(fetchSpecializations({ search, universityId, courseId, status, page, limit: PAGE_SIZE, sortBy: 'name' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSpecialization(deleteTarget.id)).unwrap();
      toast.success('Specialization deleted');
      setDeleteTarget(null);
      dispatch(fetchSpecializations({ search, universityId, courseId, status, page, limit: PAGE_SIZE, sortBy: 'name' }));
    } catch (err) {
      toast.error(err);
    }
  };

  const openCreate = () => {
    setFormCourses([]);
    setShowForm(true);
  };

  const openEdit = async (item) => {
    await loadFormCourses(item.universityId);
    setEditItem(item);
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
          <p className="text-sm text-slate-500">University → Course → Specialization. Courses load only after a university is selected.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Specialization
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search specialization, course or university..."
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
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
        </select>
        {(search || universityId || courseId || status) && (
          <button className="btn-secondary" onClick={() => { setSearch(''); setUniversityId(''); setCourseId(''); setStatus(''); setPage(1); }}>
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : specializations.length === 0 ? (
        <EmptyState
          title="No specializations found"
          description="Select a university and course, then add a specialization"
          action={<button className="btn-primary" onClick={openCreate}>Add Specialization</button>}
        />
      ) : (
        <>
          <SpecializationTable
            specializations={specializations}
            onEdit={openEdit}
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
          universities={universityOptions}
          courses={formCourses}
          onUniversityChange={loadFormCourses}
          onSubmit={handleCreate}
          loading={saving}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Specialization" size="lg">
        {editItem && (
          <SpecializationForm
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
