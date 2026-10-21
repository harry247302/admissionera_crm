import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Briefcase, GraduationCap, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCounselor, fetchCounselors, updateCounselor } from '../../redux/slices/counselorSlice';
import { counselorService } from '../../services/crmService';
import CounselorForm from '../../components/crm/CounselorForm';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { stateName } from '../../utils/indianStates';

const ASSET_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(counselor) {
  const letters = `${counselor.firstName.charAt(0)}${counselor.lastName.charAt(0)}`.trim();
  return (letters || counselor.name.charAt(0) || '?').toUpperCase();
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="card animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
          <div className="h-3 w-48 rounded bg-slate-100" />
          <div className="h-3 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function Counselors() {
  const dispatch = useDispatch();
  const { items, loading, loaded, saving, error } = useSelector((s) => s.counselors);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingContent, setSavingContent] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCounselors());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((c) => [c.name, c.email, c.phone].join(' ').toLowerCase().includes(query));
  }, [items, search]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async ({ content, ...data }) => {
    let saved;
    try {
      saved = editing
        ? await dispatch(updateCounselor({ id: editing.id, data })).unwrap()
        : await dispatch(createCounselor(data)).unwrap();
    } catch (err) {
      const fallback = editing ? 'Failed to update counsellor' : 'Failed to create counsellor';
      toast.error(typeof err === 'string' ? err : err?.message || fallback);
      return;
    }

    setSavingContent(true);
    try {
      await counselorService.addContent(saved.id, content);
      toast.success(`${saved.name} ${editing ? 'updated' : 'added'}`);
    } catch (err) {
      toast.error(
        `${saved.name} was saved, but some tables or paragraphs failed: ${err?.response?.data?.message || err?.message || 'unknown error'}`
      );
    } finally {
      setSavingContent(false);
      closeForm();
    }
  };

  const refresh = () => dispatch(fetchCounselors({ force: true }));
  const openForm = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (counselor) => {
    setEditing(counselor);
    setShowForm(true);
  };

  let content;
  if (!loaded && loading) {
    content = <CardSkeleton />;
  } else if (error && !items.length) {
    content = (
      <EmptyState
        title="Couldn’t load counsellors"
        description={error}
        action={<button className="btn-secondary" onClick={refresh}>Try again</button>}
      />
    );
  } else if (!items.length) {
    content = (
      <EmptyState
        title="No counsellors yet"
        description="Add your first counsellor to start assigning leads."
        action={<button className="btn-primary" onClick={openForm}>Add Counsellor</button>}
      />
    );
  } else if (!filtered.length) {
    content = <EmptyState title="No matches" description={`No counsellor matches “${search}”.`} />;
  } else {
    content = (
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.id} className="card">
            <div className="flex items-start gap-3">
              {c.profileImg ? (
                <img
                  src={resolveAssetUrl(c.profileImg)}
                  alt={c.name}
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {initials(c)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold capitalize text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-400">Joined {formatDate(c.createdAt)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                c.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {c.status ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
                aria-label={`Edit ${c.name}`}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {c.email ? (
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-slate-600 hover:text-brand-600">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{c.email}</span>
                </a>
              ) : null}
              {c.phone ? (
                <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-brand-600">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  {c.phone}
                  {c.alternatePhone ? <span className="text-slate-400">/ {c.alternatePhone}</span> : null}
                </a>
              ) : null}
              {c.qualification ? (
                <p className="flex items-center gap-2 text-slate-600">
                  <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{c.qualification}</span>
                </p>
              ) : null}
              {c.experienceYears !== null ? (
                <p className="flex items-center gap-2 text-slate-600">
                  <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                  {c.experienceYears} year{c.experienceYears === 1 ? '' : 's'} experience
                </p>
              ) : null}
              {c.state ? (
                <p className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  {stateName(c.state)}
                </p>
              ) : null}
            </div>
            {c.notes ? (
              <p className="mt-3 line-clamp-2 border-t border-slate-100 pt-3 text-xs text-slate-500" title={c.notes}>
                {c.notes}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Counsellors</h1>
          <p className="text-sm text-slate-500">
            {loaded ? `${items.length} counsellor${items.length === 1 ? '' : 's'}` : 'Manage your counselling team.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh counsellors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" className="btn-primary" onClick={openForm}>
            <Plus className="h-4 w-4" /> Add Counsellor
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <label className="relative block max-w-sm">
          <span className="sr-only">Search counsellors</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      ) : null}

      {content}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Counsellor' : 'Add Counsellor'} size="xl">
        {showForm ? (
          <CounselorForm
            key={editing?.id || 'new'}
            counselor={editing}
            existingImageUrl={resolveAssetUrl(editing?.profileImg)}
            onSubmit={handleSubmit}
            loading={saving || savingContent}
            onCancel={closeForm}
          />
        ) : null}
      </Modal>
    </div>
  );
}
