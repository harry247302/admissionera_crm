import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import FormField from './FormField';
import { DURATION_UNITS, ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function SpecializationForm({ defaultValues, onSubmit, loading, onCancel }) {
  const isEditing = Boolean(defaultValues?.uuid || defaultValues?.id);

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      durationUnit: 'YEARS',
      duration: '',
      slug: '',
      shortName: '',
      overview: '',
      admissionRequirements: '',
      careerOpportunities: '',
      ...defaultValues,
      shortName: defaultValues?.shortName || defaultValues?.short_name || '',
      durationUnit: defaultValues?.durationUnit || defaultValues?.duration_unit || 'YEARS',
      admissionRequirements:
        defaultValues?.admissionRequirements || defaultValues?.admission_requirements || '',
      careerOpportunities:
        defaultValues?.careerOpportunities || defaultValues?.career_opportunities || '',
      status:
        defaultValues?.status
        || (defaultValues?.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    },
  });

  const name = useWatch({ control, name: 'name' });

  useEffect(() => {
    if (isEditing || !name) return;
    setValue('slug', slugify(name));
  }, [name, isEditing, setValue]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({
        ...data,
        duration: data.duration === '' || data.duration == null ? null : Number(data.duration),
      }))}
      className="space-y-5"
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Create a specialization in the catalog. Assign it to universities and courses from their respective pages.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Specialization Name *" error={errors.name?.message}>
          <input
            className="input"
            placeholder="e.g. Computer Science"
            {...register('name', { required: 'Name is required' })}
          />
        </FormField>
        <FormField label="Slug *" error={errors.slug?.message}>
          <input
            className="input lowercase"
            placeholder="e.g. computer-science"
            {...register('slug', { required: 'Slug is required' })}
          />
        </FormField>
        <FormField label="Code" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. CS" {...register('code')} />
        </FormField>
        <FormField label="Short Name">
          <input className="input" placeholder="e.g. CS" {...register('shortName')} />
        </FormField>
        <FormField label="Duration">
          <input type="number" min="0" step="0.5" className="input" {...register('duration')} />
        </FormField>
        <FormField label="Duration Unit">
          <select className="input" {...register('durationUnit')}>
            <option value="">Select unit</option>
            {DURATION_UNITS.map((unit) => (
              <option key={unit} value={unit}>{formatLabel(unit)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Description">
        <textarea className="input min-h-[80px]" rows={3} {...register('description')} />
      </FormField>
      <FormField label="Overview">
        <textarea className="input min-h-[80px]" rows={3} {...register('overview')} />
      </FormField>
      <FormField label="Eligibility">
        <textarea className="input min-h-[80px]" rows={3} {...register('eligibility')} />
      </FormField>
      <FormField label="Admission Requirements">
        <textarea className="input min-h-[80px]" rows={3} {...register('admissionRequirements')} />
      </FormField>
      <FormField label="Career Opportunities">
        <textarea className="input min-h-[80px]" rows={3} {...register('careerOpportunities')} />
      </FormField>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Specialization' : 'Save Specialization'}
        </button>
      </div>
    </form>
  );
}
