import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import {
  fetchCourseById, fetchUniversityOptions, updateCourse, clearCurrentCourse,
  createSpecialization, updateSpecialization, deleteSpecialization,
} from '../../redux/slices/educationSlice';
import Breadcrumb from '../../components/education/Breadcrumb';
import StatusBadge from '../../components/education/StatusBadge';
import CourseForm from '../../components/education/CourseForm';
import SpecializationForm from '../../components/education/SpecializationForm';
import SpecializationTable from '../../components/education/SpecializationTable';
import FeeBreakdown from '../../components/education/FeeBreakdown';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatLabel, formatCurrency } from '../../utils/educationConstants';

const TABS = ['Overview', 'Specializations', 'Fees'];

export default function CourseDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCourse: course, universityOptions, detailLoading, saving } = useSelector((s) => s.education);
  const [tab, setTab] = useState('Overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [editSpec, setEditSpec] = useState(null);
  const [deleteSpec, setDeleteSpec] = useState(null);

  useEffect(() => {
    dispatch(fetchCourseById(id));
    dispatch(fetchUniversityOptions());
    return () => dispatch(clearCurrentCourse());
  }, [dispatch, id]);

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateCourse({ id, data })).unwrap();
      toast.success('Course updated');
      setShowEdit(false);
      dispatch(fetchCourseById(id));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleCreateSpec = async (data) => {
    try {
      await dispatch(createSpecialization(data)).unwrap();
      toast.success('Specialization added');
      setShowSpecForm(false);
      dispatch(fetchCourseById(id));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleUpdateSpec = async (data) => {
    try {
      await dispatch(updateSpecialization({ id: editSpec.id, data })).unwrap();
      toast.success('Specialization updated');
      setEditSpec(null);
      dispatch(fetchCourseById(id));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDeleteSpec = async () => {
    try {
      await dispatch(deleteSpecialization(deleteSpec.id)).unwrap();
      toast.success('Specialization deleted');
      setDeleteSpec(null);
      dispatch(fetchCourseById(id));
    } catch (err) {
      toast.error(err);
    }
  };

  if (detailLoading) return <LoadingSpinner message="Loading course..." />;
  if (!course) return <div className="card text-red-600">Course not found</div>;

  const stats = course.stats || {};

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Education', to: '/crm/education' },
        { label: 'Courses', to: '/crm/education/courses' },
        { label: course.code },
      ]} />

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{course.code} — {course.name}</h1>
              <StatusBadge status={course.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {course.universityName}
              <span className="mx-2 text-slate-300">·</span>
              {formatLabel(course.level)}
              <span className="mx-2 text-slate-300">·</span>
              {course.duration} {formatLabel(course.durationUnit).toLowerCase()}
              <span className="mx-2 text-slate-300">·</span>
              {course.numberOfSemesters || 0} semesters
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/crm/education/universities/${course.universityId}`} className="btn-secondary">View university</Link>
            <button className="btn-secondary" onClick={() => setShowEdit(true)}><Pencil className="h-4 w-4" /> Edit</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Specializations" value={stats.specializationCount} />
        <MiniStat label="Active streams" value={stats.activeSpecializations} />
        <MiniStat label="Fee structures" value={stats.feeStructureCount} />
        <MiniStat label="Active total fee" value={formatCurrency(stats.totalFee)} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === item ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2 space-y-5">
            <section>
              <h2 className="mb-2 font-semibold text-slate-900">Course information</h2>
              <p className="text-sm leading-6 text-slate-600">{course.description || 'No description added yet.'}</p>
            </section>
            <section>
              <h2 className="mb-2 font-semibold text-slate-900">Eligibility</h2>
              <p className="text-sm leading-6 text-slate-600">{course.eligibility || 'No eligibility notes added yet.'}</p>
            </section>
          </div>
          <div className="card space-y-4">
            <h2 className="font-semibold text-slate-900">University information</h2>
            <Info label="University" value={course.universityName} />
            <Info label="Code" value={course.universityCode} />
            <Info label="Type" value={formatLabel(course.universityType)} />
            <Info label="Location" value={course.universityLocation} />
            <h2 className="pt-2 font-semibold text-slate-900">Programme</h2>
            <Info label="Level" value={formatLabel(course.level)} />
            <Info label="Duration" value={`${course.duration} ${formatLabel(course.durationUnit).toLowerCase()}`} />
            <Info label="Semesters" value={course.numberOfSemesters} />
            <Info label="Years" value={course.numberOfYears} />
          </div>
        </div>
      )}

      {tab === 'Specializations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowSpecForm(true)}>Add Specialization</button>
          </div>
          {course.specializations?.length ? (
            <SpecializationTable
              specializations={course.specializations}
              onEdit={setEditSpec}
              onDelete={setDeleteSpec}
            />
          ) : (
            <EmptyState
              title="No specializations yet"
              description="Add streams such as Finance, Marketing or Human Resources"
              action={<button className="btn-primary" onClick={() => setShowSpecForm(true)}>Add Specialization</button>}
            />
          )}
        </div>
      )}

      {tab === 'Fees' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Fee structure</h2>
            <Link to="/crm/education/fees" className="text-sm font-medium text-brand-600">Manage fees</Link>
          </div>
          <FeeBreakdown structure={course.activeFeeStructure} />
          {!course.activeFeeStructure && (
            <div className="flex justify-end">
              <Link to="/crm/education/fees" className="btn-primary">Add fee structure</Link>
            </div>
          )}
        </div>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Course" size="xl">
        <CourseForm universities={universityOptions} defaultValues={course} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal open={showSpecForm} onClose={() => setShowSpecForm(false)} title="Add Specialization" size="lg">
        <SpecializationForm
          universities={universityOptions}
          courses={[{ id: course.id, name: course.name, code: course.code, universityId: course.universityId }]}
          defaultValues={{ universityId: course.universityId, courseId: course.id }}
          onSubmit={handleCreateSpec}
          loading={saving}
          onCancel={() => setShowSpecForm(false)}
        />
      </Modal>

      <Modal open={!!editSpec} onClose={() => setEditSpec(null)} title="Edit Specialization" size="lg">
        {editSpec && (
          <SpecializationForm
            universities={universityOptions}
            courses={[{ id: course.id, name: course.name, code: course.code, universityId: course.universityId }]}
            defaultValues={editSpec}
            onSubmit={handleUpdateSpec}
            loading={saving}
            onCancel={() => setEditSpec(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteSpec}
        onClose={() => setDeleteSpec(null)}
        onConfirm={handleDeleteSpec}
        title="Delete Specialization"
        message={`Delete ${deleteSpec?.name}? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value ?? 0}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value || '—'}</p>
    </div>
  );
}
