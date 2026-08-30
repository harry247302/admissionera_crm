import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCourses, fetchUniversityOptions, createCourse, updateCourse, deleteCourse,
  createFeeStructure, setCourseFilters,
} from '../../redux/slices/educationSlice';
import CourseTable from '../../components/education/CourseTable';
import CourseForm from '../../components/education/CourseForm';
import Breadcrumb from '../../components/education/Breadcrumb';
import Pagination from '../../components/education/Pagination';
import UniversitySelect from '../../components/education/UniversitySelect';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { SkeletonTable } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { COURSE_LEVELS, ENTITY_STATUSES, PAGE_SIZE, formatLabel } from '../../utils/educationConstants';
import {
  academicCourseService,
  academicSpecializationService,
  toSpecializationPayload,
} from '../../services/educationService';
import { buildFeeStructurePayload } from '../../components/education/courseWizard/courseWizardUtils';

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

  const resolveUniversity = (courseData, universityUuid) => {
    const university = universityOptions.find(
      (u) => String(u.id) === String(courseData.universityId)
    );
    return {
      university,
      universityUuid: universityUuid || university?.uuid,
    };
  };

  const createAndLinkSpecializations = async (specializations, courseUuid) => {
    const updatedSpecs = [];
    const specializationUuids = [];

    for (const item of specializations) {
      if (item.savedUuid) {
        specializationUuids.push(String(item.savedUuid));
        updatedSpecs.push(item);
        continue;
      }

      const payload = toSpecializationPayload({
        name: item.name,
        slug: item.slug,
        code: item.code,
        description: item.description,
        status: item.status || 'ACTIVE',
      });

      const created = await academicSpecializationService.create(payload);
      const specUuid = created.data?.specialization?.uuid;
      if (!specUuid) continue;

      specializationUuids.push(specUuid);
      updatedSpecs.push({ ...item, savedUuid: specUuid });
    }

    const uniqueUuids = [...new Set(specializationUuids)];
    if (uniqueUuids.length) {
      await academicCourseService.createCourseSpecializations({
        course_uuid: courseUuid,
        specialization_uuids: uniqueUuids,
      });
    }

    return updatedSpecs;
  };

  const handleWizardSubmit = async (payload) => {
    const { phase, course, specializations = [], fees, courseUuid, universityUuid } = payload;

    if (phase === 'draft-create') {
      const created = await dispatch(createCourse(course)).unwrap();
      return {
        courseUuid: created?.uuid || created?.id,
        courseId: created?.id || created?.uuid,
      };
    }

    if (phase === 'draft-update') {
      await dispatch(updateCourse({
        id: courseUuid,
        data: course,
      })).unwrap();
      return { courseUuid, courseId: payload.courseId || courseUuid };
    }

    if (phase === 'save-specializations') {
      if (!courseUuid) {
        throw new Error('Course must be saved before adding specializations');
      }
      const validSpecs = specializations.filter((item) => item.name?.trim());
      const updated = await createAndLinkSpecializations(validSpecs, courseUuid);
      toast.success('Specializations saved and linked to course');
      return { specializations: updated };
    }

    if (phase === 'final') {
      let courseRecord;

      if (courseUuid) {
        courseRecord = await dispatch(updateCourse({ id: courseUuid, data: course })).unwrap();
      } else {
        courseRecord = await dispatch(createCourse(course)).unwrap();
      }

      const finalCourseUuid = courseRecord?.uuid || courseRecord?.id || courseUuid;
      const finalCourseId = courseRecord?.id || courseRecord?.uuid || payload.courseId;

      const pendingSpecs = specializations.filter((item) => item.name?.trim() && !item.savedUuid);
      if (finalCourseUuid && pendingSpecs.length) {
        await createAndLinkSpecializations(
          specializations.filter((item) => item.name?.trim()),
          finalCourseUuid
        );
      }

      if (fees && finalCourseId && course.universityId) {
        try {
          const feePayload = buildFeeStructurePayload(fees, finalCourseId, course.universityId);
          await dispatch(createFeeStructure(feePayload)).unwrap();
        } catch (feeErr) {
          toast.error(typeof feeErr === 'string' ? feeErr : feeErr?.message || 'Course saved, but fee structure could not be saved');
        }
      }

      toast.success('Course created successfully');
      setShowForm(false);
      dispatch(fetchCourses({ ...filters, page, limit: PAGE_SIZE }));
      return { courseUuid: finalCourseUuid };
    }

    return null;
  };

  const handleCreate = async (data) => {
    try {
      if (data?.phase) {
        return await handleWizardSubmit(data);
      }

      const { specializationUuids, universityUuid, ...courseData } = data;
      const course = await dispatch(createCourse(courseData)).unwrap();
      const { universityUuid: resolvedUniversityUuid } = resolveUniversity(courseData, universityUuid);
      const courseUuid = course?.uuid || course?.id;

      if (resolvedUniversityUuid && courseUuid && (specializationUuids || []).length) {
        await academicCourseService.linkUniversityCourse({
          university_uuid: resolvedUniversityUuid,
          course_uuid: courseUuid,
          specialization_uuids: specializationUuids,
        });
      }

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
      if (data?.phase) {
        return await handleWizardSubmit(data);
      }

      const { specializationUuids, universityUuid, ...courseData } = data;
      const course = await dispatch(updateCourse({
        id: editItem.uuid || editItem.id,
        data: courseData,
      })).unwrap();

      const { universityUuid: resolvedUniversityUuid } = resolveUniversity(courseData, universityUuid);
      const courseUuid = course?.uuid || course?.id || editItem.uuid || editItem.id;

      if (resolvedUniversityUuid && courseUuid && (specializationUuids || []).length) {
        await academicCourseService.linkUniversityCourse({
          university_uuid: resolvedUniversityUuid,
          course_uuid: courseUuid,
          specialization_uuids: specializationUuids,
        });
      }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[
            { label: 'Education', to: '/crm/education' },
            { label: 'Courses' },
          ]} />
          <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="text-sm text-slate-500">Create courses with specializations and fee structures using the step-by-step wizard.</p>
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
          wizardMode
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
            wizardMode={false}
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
