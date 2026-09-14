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

export default function UniversityForm({ defaultValues, onSubmit, loading, onCancel }) {
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(resolveAssetUrl(defaultValues?.logo));
  const [bannerPreview, setBannerPreview] = useState(resolveAssetUrl(defaultValues?.banner));
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');

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
          hint="Images only, max 2MB. Saved as WebP on the server."
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
          hint="Images only, max 2MB. Saved as WebP on the server."
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
