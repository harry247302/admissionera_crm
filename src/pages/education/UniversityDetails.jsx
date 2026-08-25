import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Globe, MapPin, Pencil } from 'lucide-react';
import {
  fetchUniversityById, updateUniversity, clearCurrentUniversity,
} from '../../redux/slices/educationSlice';
import Breadcrumb from '../../components/education/Breadcrumb';
import StatusBadge from '../../components/education/StatusBadge';
import UniversityForm from '../../components/education/UniversityForm';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/crmConstants';
import { formatLabel } from '../../utils/educationConstants';

export default function UniversityDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUniversity: university, detailLoading } = useSelector((s) => s.education);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    dispatch(fetchUniversityById(id));
    return () => dispatch(clearCurrentUniversity());
  }, [dispatch, id]);

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateUniversity({ id, data })).unwrap();
      toast.success('University updated');
      setShowEdit(false);
      dispatch(fetchUniversityById(id));
    } catch (err) {
      toast.error(err);
    }
  };

  if (detailLoading) return <LoadingSpinner message="Loading university..." />;
  if (!university) return <div className="card text-red-600">University not found</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Education', to: '/crm/education' },
        { label: 'Universities', to: '/crm/education/universities' },
        { label: university.name },
      ]} />

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{university.name}</h1>
              <StatusBadge status={university.status} />
              <StatusBadge status={university.type} />
            </div>
            <p className="mt-1 font-mono text-sm text-slate-500">{university.code}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
              {university.location && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" />{university.location}</span>
              )}
              {university.website && (
                <a href={university.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand-600 hover:underline">
                  <Globe className="h-4 w-4" />{university.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-slate-900">Overview</h2>
          <p className="text-sm leading-6 text-slate-600">{university.description || 'No description added yet.'}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Type" value={formatLabel(university.type)} />
            <Info label="Status" value={formatLabel(university.status)} />
            <Info label="Created" value={formatDate(university.createdAt)} />
          </div>
        </div>
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-900">Snapshot</h2>
          <Info label="Linked courses" value={university.courseCount ?? university.courses?.length ?? 0} />
          <Info label="Last updated" value={formatDate(university.updatedAt)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Courses</h2>
          <Link to="/crm/education/courses" className="text-sm font-medium text-brand-600">Manage courses</Link>
        </div>
        {university.courses?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {university.courses.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <button className="font-medium hover:text-brand-600" onClick={() => navigate(`/crm/education/courses/${c.id}`)}>
                      {c.name}
                    </button>
                    <p className="font-mono text-xs text-slate-400">{c.code}</p>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.level} /></td>
                  <td className="px-5 py-3">{c.duration} {formatLabel(c.durationUnit).toLowerCase()}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No courses yet" description="Create a course and assign this university" />
        )}
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit University" size="lg">
        <UniversityForm defaultValues={university} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>
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
