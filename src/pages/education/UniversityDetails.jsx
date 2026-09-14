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

const ASSET_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path;
  return `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

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
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update university');
    }
  };

  if (detailLoading) return <LoadingSpinner message="Loading university..." />;
  if (!university) return <div className="card text-red-600">University not found</div>;

  const approvals = university.approvals || [];
  const faqs = university.faqs || [];
  const courses = university.courses || [];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Education', to: '/crm/education' },
        { label: 'Universities', to: '/crm/education/universities' },
        { label: university.name },
      ]} />

      {university.banner && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src={resolveAssetUrl(university.banner)}
            alt={`${university.name} banner`}
            className="h-48 w-full object-cover sm:h-64"
          />
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-4">
            {university.logo && (
              <img
                src={resolveAssetUrl(university.logo)}
                alt={`${university.name} logo`}
                className="h-16 w-16 rounded-lg border border-slate-200 bg-white object-contain p-1"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{university.name}</h1>
                <StatusBadge status={university.status} />
                {university.type && <StatusBadge status={university.type} />}
              </div>
              <p className="mt-1 font-mono text-sm text-slate-500">{university.code}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                {university.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {university.location}
                  </span>
                )}
                {university.website && (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {university.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="Courses" value={university.courseCount ?? courses.length} />
        <MiniStat label="Approvals" value={approvals.length} />
        <MiniStat label="FAQs" value={faqs.length} />
        <MiniStat label="Rating" value={university.ratings || '—'} />
        <MiniStat label="World Rank" value={university.world_rank || '—'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-5">
          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Overview</h2>
            {university.description ? (
              <div
                className="rich-text-content prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: university.description }}
              />
            ) : (
              <p className="text-sm leading-6 text-slate-600">No description added yet.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Features</h2>
            {university.features ? (
              <div
                className="rich-text-content prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: university.features }}
              />
            ) : (
              <p className="text-sm text-slate-500">No features added yet.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Admission Process</h2>
            {university.admission_process ? (
              <div
                className="rich-text-content prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: university.admission_process }}
              />
            ) : (
              <p className="text-sm text-slate-500">No admission process added yet.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Career</h2>
            {university.career ? (
              <div
                className="rich-text-content prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: university.career }}
              />
            ) : (
              <p className="text-sm text-slate-500">No career details added yet.</p>
            )}
          </section>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-900">Snapshot</h2>
          <Info label="Code" value={university.code} />
          <Info label="Type" value={formatLabel(university.type)} />
          <Info label="Grade" value={university.grade} />
          <Info label="Ratings" value={university.ratings} />
          <Info label="World Rank" value={university.world_rank} />
          <Info label="Status" value={formatLabel(university.status)} />
          <Info label="Created" value={formatDate(university.createdAt)} />
          <Info label="Last updated" value={formatDate(university.updatedAt)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Approvals</h2>
          <span className="text-sm text-slate-500">{approvals.length} total</span>
        </div>
        {approvals.length ? (
          <div className="divide-y divide-slate-100">
            {approvals.map((item) => (
              <div key={item.id || item.uuid} className="flex flex-wrap items-start gap-4 px-5 py-4">
                {item.approval_logo && (
                  <img
                    src={resolveAssetUrl(item.approval_logo)}
                    alt={item.approval_name}
                    className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain p-1"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{item.approval_name}</p>
                    <StatusBadge status={item.is_active === false ? 'INACTIVE' : 'ACTIVE'} />
                  </div>
                  {item.approval_description && (
                    <p className="mt-1 text-sm text-slate-600">{item.approval_description}</p>
                  )}
                </div>
                <p className="text-xs text-slate-400">Order {item.display_order ?? 0}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No approvals yet" description="Add approvals from the universities list" />
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">FAQs</h2>
          <span className="text-sm text-slate-500">{faqs.length} total</span>
        </div>
        {faqs.length ? (
          <div className="divide-y divide-slate-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{faq.question}</p>
                  <StatusBadge status={faq.is_active === false ? 'INACTIVE' : 'ACTIVE'} />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No FAQs yet" description="Add FAQs from the universities list" />
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Courses</h2>
          <Link to="/crm/education/courses" className="text-sm font-medium text-brand-600">Manage courses</Link>
        </div>
        {courses.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Specializations</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.uuid || c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      className="font-medium hover:text-brand-600"
                      onClick={() => navigate(`/crm/education/courses/${c.id}`)}
                    >
                      {c.name}
                    </button>
                    <p className="font-mono text-xs text-slate-400">{c.code}</p>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.level} /></td>
                  <td className="px-5 py-3 text-slate-600">
                    {c.specializationCount ?? c.specializations?.length ?? 0}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No courses yet" description="Create a course and assign this university" />
        )}
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit University" size="xl">
        <UniversityForm defaultValues={university} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>
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
