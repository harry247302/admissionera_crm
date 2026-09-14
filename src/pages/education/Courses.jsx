import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCourses, fetchUniversityOptions, createCourse, updateCourse, deleteCourse,
  setCourseFilters,
} from '../../redux/slices/educationSlice';
import CourseTable from '../../components/education/CourseTable';
import CourseForm from '../../components/education/CourseForm';
import CourseFaqForm from '../../components/education/CourseFaqForm';
import SpecializationFeeForm from '../../components/education/SpecializationFeeForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Pagination from '../../components/education/Pagination';
import UniversitySelect from '../../components/education/UniversitySelect';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { SkeletonTable } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { COURSE_LEVELS, ENTITY_STATUSES, PAGE_SIZE, formatLabel } from '../../utils/educationConstants';
import { courseFaqService } from '../../services/educationService';

export default function Courses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    courses, coursePagination, universityOptions, loading, saving,
  } = useSelector((s) => s.education);

  const [search, setSearch] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feeTarget, setFeeTarget] = useState(null);
  const [faqTarget, setFaqTarget] = useState(null);
  const [faqSaving, setFaqSaving] = useState(false);

  const filters = { search, universityId, level, status, sortBy, sortDir };

  useEffect(() => {
    dispatch(fetchUniversityOptions());
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(setCourseFilters(filters));
      dispatch(fetchCourses({ ...filters, page, limit: PAGE_SIZE }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, search, universityId, level, status, page, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleCreate = async (data) => {
    try {
      await dispatch(createCourse(data)).unwrap();
      toast.success('Course created');
      setShowForm(false);
      dispatch(fetchCourses({ ...filters, page, limit: PAGE_SIZE }));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to create course');
      throw err;
    }
  };

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateCourse({
        id: editItem.uuid || editItem.id,
        data,
      })).unwrap();
      toast.success('Course updated');
      setEditItem(null);
      dispatch(fetchCourses({ ...filters, page, limit: PAGE_SIZE }));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update course');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteCourse(deleteTarget.uuid || deleteTarget.id)).unwrap();
      toast.success('Course deleted');
      setDeleteTarget(null);
      dispatch(fetchCourses({ ...filters, page, limit: PAGE_SIZE }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleCreateFaq = async (data) => {
    setFaqSaving(true);
    try {
      await courseFaqService.create(data);
      toast.success('FAQ added');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add FAQ');
      throw err;
    } finally {
      setFaqSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[
            { label: 'Education', to: '/crm/education' },
            { label: 'Courses' },
          ]} />
          <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="text-sm text-slate-500">Create and manage courses.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search course, code or university..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-64">
          <UniversitySelect
            universities={universityOptions}
            value={universityId}
            onChange={(val) => { setUniversityId(val); setPage(1); }}
            placeholder="Filter by university"
          />
        </div>
        <select className="input w-auto" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
          <option value="">All levels</option>
          {COURSE_LEVELS.map((l) => <option key={l} value={l}>{formatLabel(l)}</option>)}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
        </select>
        {(search || universityId || level || status) && (
          <button className="btn-secondary" onClick={() => { setSearch(''); setUniversityId(''); setLevel(''); setStatus(''); setPage(1); }}>
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Select a university and create the first course"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}>Add Course</button>}
        />
      ) : (
        <>
          <CourseTable
            courses={courses}
            onView={(c) => navigate(`/crm/education/courses/${c.id}`)}
            onEdit={setEditItem}
            onDelete={setDeleteTarget}
            onEditFees={setFeeTarget}
            onViewFAQs={setFaqTarget}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <Pagination
            page={page}
            pages={coursePagination.pages}
            total={coursePagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Course" size="xl">
        <CourseForm
          universities={universityOptions}
          onSubmit={handleCreate}
          loading={saving}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Course" size="xl">
        {editItem && (
          <CourseForm
            universities={universityOptions}
            defaultValues={editItem}
            key={editItem.id}
            onSubmit={handleUpdate}
            loading={saving}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!feeTarget}
        onClose={() => setFeeTarget(null)}
        title="Update Fees"
        size="lg"
      >
        {feeTarget && (
          <SpecializationFeeForm
            key={feeTarget.spec?.uuid}
            course={feeTarget.course}
            spec={feeTarget.spec}
            onCancel={() => setFeeTarget(null)}
            onSaved={() => {
              setFeeTarget(null);
              dispatch(fetchCourses({ ...filters, page, limit: PAGE_SIZE }));
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!faqTarget}
        onClose={() => !faqSaving && setFaqTarget(null)}
        title="Course FAQs"
        size="lg"
      >
        {faqTarget && (
          <CourseFaqForm
            key={faqTarget.uuid || faqTarget.id}
            course={faqTarget}
            onSubmit={handleCreateFaq}
            loading={faqSaving}
            onCancel={() => setFaqTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Delete ${deleteTarget?.name}? Specializations and fee structures for this course will also be removed.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
