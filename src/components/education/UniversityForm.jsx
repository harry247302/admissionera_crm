import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import FormField from './FormField';
import RichTextEditor from '../common/RichTextEditor';
import { UNIVERSITY_TYPES, ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ASSET_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path;
  return `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};


const formatApprovalLabel = (approval) => {
  if (typeof approval === 'object' && approval !== null) {
    return approval.approval_name || approval.name || approval.title || 'Approval';
  }
  if (typeof approval === 'string') {
    let name = approval.replace(/\.[^/.]+$/, '');
    name = name.replace(/^logo[-_]|[-_]logo$/gi, '');
    name = name.replace(/[-_]a[-_]plus[-_]plus/gi, ' A++');
    name = name.replace(/[-_]a[-_]plus/gi, ' A+');
    name = name.replace(/[-_]/g, ' ').trim();
    return name.toUpperCase();
  }
  return String(approval);
};

const getApprovalKey = (item) => {
  if (item == null) return '';
  if (typeof item === 'string') return item.trim();
  return (
    item.approval_logo ||
    item.logo ||
    item.approval_name ||
    item.name ||
    item.title ||
    item.id ||
    item.uuid ||
    ''
  ).toString().trim();
};

const normalizeApprovalName = (str) => {
  if (!str) return '';
  let s = String(str).split('/').pop() || '';
  s = s.replace(/\.[^/.]+$/, '');
  s = s.replace(/^logo[-_]|[-_]logo$/gi, '');
  s = s.replace(/[-_]a[-_]plus[-_]plus/gi, ' a++');
  s = s.replace(/[-_]a[-_]plus/gi, ' a+');
  s = s.replace(/[-_]/g, ' ').trim().toLowerCase();
  return s;
};

const isApprovalMatch = (a, b) => {
  if (!a || !b) return false;
  const keyA = getApprovalKey(a);
  const keyB = getApprovalKey(b);
  if (keyA && keyB && keyA.toLowerCase() === keyB.toLowerCase()) return true;

  const normA = normalizeApprovalName(keyA);
  const normB = normalizeApprovalName(keyB);
  if (normA && normB) {
    if (normA === normB) return true;
    const wordsA = normA.split(' ').filter(Boolean);
    const wordsB = normB.split(' ').filter(Boolean);
    if (wordsA.length && wordsB.length) {
      if (wordsA.some((w) => w.length >= 3 && wordsB.includes(w))) return true;
    }
  }
  return false;
};

const isApprovalSelected = (approval, list = []) => {
  return list.some((item) => isApprovalMatch(item, approval));
};

export default function UniversityForm({ defaultValues, onSubmit, loading, onCancel }) {
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(resolveAssetUrl(defaultValues?.logo));
  const [bannerPreview, setBannerPreview] = useState(resolveAssetUrl(defaultValues?.banner));
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [approvals, setApprovals] = useState([]);
  const [selectedApprovals, setSelectedApprovals] = useState(() => {
    const initial = defaultValues?.approvals;
    if (Array.isArray(initial)) return initial;
    if (typeof initial === 'string') {
      try {
        const parsed = JSON.parse(initial);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return initial.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  });
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState("");

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setApprovalsLoading(true);
        setApprovalsError("");

        const response = await fetch(
          "https://backend.admissionera.com/api/approvals/get-approvals"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch approvals");
        }

        const result = await response.json();

        const data = Array.isArray(result)
          ? result
          : result.data ?? result.approvals ?? [];

        setApprovals(data);
      } catch (error) {
        setApprovalsError(
          error instanceof Error
            ? error.message
            : "Something went wrong"
        );
      } finally {
        setApprovalsLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  // Pre-load existing approvals when editing a university if not already provided
  useEffect(() => {
    const universityId = defaultValues?.uuid || defaultValues?.id;
    if (!universityId) return;

    if (defaultValues?.approvals && defaultValues.approvals.length > 0) {
      setSelectedApprovals(defaultValues.approvals);
      return;
    }

    const fetchExistingApprovals = async () => {
      try {
        const response = await fetch(
          `${ASSET_BASE}/api/academic/university-approvals/${universityId}`
        );
        if (!response.ok) return;
        const result = await response.json();
        const data = Array.isArray(result) ? result : result.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setSelectedApprovals(data);
        }
      } catch {
        // ignore error
      }
    };

    fetchExistingApprovals();
  }, [defaultValues?.id, defaultValues?.uuid, defaultValues?.approvals]);

  // Once catalogue approvals are fetched, align selectedApprovals to catalogue items
  useEffect(() => {
    if (!approvals.length) return;
    setSelectedApprovals((prev) => {
      if (!prev.length) return prev;
      const matched = approvals.filter((item) =>
        prev.some((p) => isApprovalMatch(p, item))
      );
      return matched.length ? matched : prev;
    });
  }, [approvals]);

  const handleToggleApproval = (approval) => {
    setSelectedApprovals((prev) => {
      const exists = prev.some((item) => isApprovalMatch(item, approval));
      if (exists) {
        return prev.filter((item) => !isApprovalMatch(item, approval));
      } else {
        return [...prev, approval];
      }
    });
  };

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      type: '',
      description: '',
      features: '',
      admission_process: '',
      career: '',
      ratings: '',
      world_rank: '',
      grade: '',
      ...defaultValues,
      code: defaultValues?.code || defaultValues?.short_name || '',
    },
  });

  useEffect(() => {
    if (!logoFile) return undefined;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) return undefined;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const pickImage = (file, setFile, setError, inputEl) => {
    setError('');
    if (!file) {
      setFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      setFile(null);
      if (inputEl) inputEl.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 2MB');
      setFile(null);
      if (inputEl) inputEl.value = '';
      return;
    }
    setFile(file);
  };

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      short_name: data.code || data.short_name,
      logo: logoFile || undefined,
      approvals: selectedApprovals,
      banner: bannerFile || undefined,
      existingLogo: defaultValues?.logo || '',
      existingBanner: defaultValues?.banner || '',
    });
  });

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="University Name *" error={errors.name?.message}>
          <input className="input" placeholder="e.g. Amity University" {...register('name', { required: 'University name is required' })} />
        </FormField>
        <FormField label="Short Name / Code *" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. AMITY" {...register('code', { required: 'Code is required' })} />
        </FormField>
        <FormField label="University Type *" error={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            rules={{ required: 'University type is required' }}
            render={({ field }) => (
              <select className="input" {...field}>
                <option value="">Select type</option>
                {UNIVERSITY_TYPES.map((type) => (
                  <option key={type} value={type}>{formatLabel(type)}</option>
                ))}
              </select>
            )}
          />
        </FormField>
        <FormField label="Location" error={errors.location?.message}>
          <input className="input" placeholder="City, State" {...register('location')} />
        </FormField>
        <FormField label="Website" error={errors.website?.message} className="sm:col-span-2">
          <input
            className="input"
            placeholder="https://"
            {...register('website', {
              validate: (v) => !v || /^https?:\/\//i.test(v) || 'Enter a valid URL starting with http:// or https://',
            })}
          />
        </FormField>
        <FormField label="Grade">
          <input className="input" placeholder="e.g. A+" {...register('grade')} />
        </FormField>
        <FormField label="Ratings">
          <input className="input" type="number" step="0.1" min="0" max="5" placeholder="e.g. 4.5" {...register('ratings')} />
        </FormField>
        <FormField label="World Rank">
          <input className="input" type="number" min="1" placeholder="e.g. 1200" {...register('world_rank')} />
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Logo"
          error={logoError}
          hint="Images only, 400x400px max 2MB. Saved as WebP on the server."
        >
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            onChange={(e) => pickImage(e.target.files?.[0], setLogoFile, setLogoError, e.target)}
          />
          {logoPreview && (
            <img src={logoPreview} alt="Logo preview" className="mt-3 h-20 w-20 rounded-lg border border-slate-200 object-contain bg-white" />
          )}
        </FormField>

        <FormField
          label="Banner"
          error={bannerError}
          hint="Images only, 1920x800px max 2MB. Saved as WebP on the server."
        >
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            onChange={(e) => pickImage(e.target.files?.[0], setBannerFile, setBannerError, e.target)}
          />
          {bannerPreview && (
            <img src={bannerPreview} alt="Banner preview" className="mt-3 h-24 w-full rounded-lg border border-slate-200 object-cover bg-white" />
          )}
        </FormField>
      </div>

      <FormField
        label={`Approvals (${selectedApprovals.length} selected)`}
        error={approvalsError}
        hint="Select the approvals applicable to this university."
      >
        {approvalsLoading ? (
          <p className="text-sm text-slate-500">
            Loading approvals...
          </p>
        ) : (
          <div className="space-y-3">
            {approvals.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Select all that apply</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApprovals([...approvals])}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedApprovals([])}
                    className="font-medium text-slate-500 hover:text-slate-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {approvals.map((approval, index) => {
                const isSelected = isApprovalSelected(approval, selectedApprovals);
                const label = formatApprovalLabel(approval);
                const key = getApprovalKey(approval) || index;
                const logoSrc = resolveAssetUrl(
                  typeof approval === 'string'
                    ? `/uploads/${approval}`
                    : approval.approval_logo || approval.logo || ''
                );

                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-sm ring-1 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleApproval(approval)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {logoSrc && (
                      <img
                        src={logoSrc}
                        alt={label}
                        className="h-7 w-7 rounded border border-slate-200 bg-white object-contain p-0.5"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {!approvalsLoading && !approvalsError && approvals.length === 0 && (
          <p className="text-sm text-slate-500">
            No approvals found.
          </p>
        )}
      </FormField>

      <FormField label="Description" hint="Supports headings, links, colors, highlights, and text formatting">
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Write a detailed overview of the university..."
            />
          )}
        />
      </FormField>

      <FormField label="Features" hint="Key highlights and campus features">
        <Controller
          name="features"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="List university features..."
            />
          )}
        />
      </FormField>

      <FormField label="Admission Process" hint="Steps, eligibility, and application notes">
        <Controller
          name="admission_process"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Describe the admission process..."
            />
          )}
        />
      </FormField>

      <FormField label="Career" hint="Placements, career outcomes, and opportunities">
        <Controller
          name="career"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Describe career opportunities..."
            />
          )}
        />
      </FormField>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : defaultValues?.id ? 'Update University' : 'Save University'}
        </button>
      </div>
    </form>
  );
}
